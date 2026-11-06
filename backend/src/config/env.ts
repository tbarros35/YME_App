import dotenv from 'dotenv';
dotenv.config();

const parseCorsOrigins = (raw?: string): string[] => {
  if (!raw) {
    return [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:80',
      'http://localhost',
    ];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://yme_user:yme_password_secure@localhost:5432/yme_portal_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_access_token_key_yme_2026',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'super_secret_jwt_refresh_token_key_yme_2026',
  JWT_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  CORS_ORIGIN: parseCorsOrigins(process.env.CORS_ORIGIN),
};

// Validate critical environment variables in production
if (env.NODE_ENV === 'production') {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'super_secret_jwt_access_token_key_yme_2026'
  ) {
    console.warn(
      '⚠️ AVISO DE SEGURANÇA: JWT_SECRET padrão em produção! Define um segredo aleatório forte em .env.production.'
    );
  }
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ AVISO: DATABASE_URL não definida em produção.');
  }
}
