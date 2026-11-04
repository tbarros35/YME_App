import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://yme_user:yme_password_secure@localhost:5432/yme_portal_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_yme_2026',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_yme_2026',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:80', 'http://localhost'],
};

// Validate critical environment variables
if (!process.env.JWT_SECRET && env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: JWT_SECRET is not set in production. Using fallback secret.');
}
