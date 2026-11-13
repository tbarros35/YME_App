import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { env } from './config/env';
import apiRoutes from './routes';
import { errorHandler } from './middlewares/error';

const app = express();

// Enable trust proxy so Express reads X-Forwarded-For / CF-Connecting-IP headers from Cloudflare & Nginx reverse proxy
app.set('trust proxy', true);

// Security Headers (allow cross-origin resource policy for uploaded PDFs/images)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  })
);

// CORS Configuration with strict origin validation
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl) in non-production
      if (!origin) {
        return callback(null, true);
      }

      const isAllowed =
        env.CORS_ORIGIN.includes(origin) ||
        (env.NODE_ENV !== 'production' &&
          (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')));

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
      return callback(new Error(`Origem não permitida pela política CORS: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static Files - Uploads Directory
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Health Check Endpoint (not rate-limited)
app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// General API Rate Limiter: Generous limit for internal app with multiple members on university/shared Wi-Fi
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000, // 10,000 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  keyGenerator: (req) => {
    const cfIp = req.headers['cf-connecting-ip'] || req.headers['x-real-ip'];
    if (typeof cfIp === 'string' && cfIp.trim()) return cfIp.trim();
    return req.ip || '127.0.0.1';
  },
  message: {
    error: {
      code: 'TOO_MANY_REQUESTS',
      message:
        'Demasiadas requisições a partir deste endereço IP. Por favor tenta novamente dentro de alguns minutos.',
    },
  },
});

// API Routes
app.use('/api', apiLimiter, apiRoutes);

// 404 Route
app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'O recurso solicitado não foi encontrado no servidor.',
    },
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
