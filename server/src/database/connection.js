import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const poolConfig = {
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'larparatodos',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
};

// Log da configuração (sem senha)
console.log('🔌 Configurando conexão PostgreSQL:', {
  host: poolConfig.host,
  port: poolConfig.port,
  database: poolConfig.database,
  user: poolConfig.user,
  password: poolConfig.password ? '***' : 'NOT SET',
});

export const pool = new Pool(poolConfig);

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
});

