import dotenv from 'dotenv';

dotenv.config();

export default {
  port: process.env.PORT || 3000,
  db: {
    host: process.env.DB_HOST || 'postgres',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'larparatodos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'larparatodos-secret-key-change-in-production',
    expiresIn: '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080',
};

