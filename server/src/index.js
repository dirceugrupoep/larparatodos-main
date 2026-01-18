import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { pool } from './database/connection.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contact.js';
import dashboardRoutes from './routes/dashboard.js';
import paymentsRoutes from './routes/payments.js';
import profileRoutes from './routes/profile.js';
import projectRoutes from './routes/project.js';
import adminRoutes from './routes/admin.js';
import associationsRoutes from './routes/associations.js';
import associationAuthRoutes from './routes/association-auth.js';
import associationUploadRoutes from './routes/association-upload.js';
import associationDashboardRoutes from './routes/association-dashboard.js';
import termsRoutes from './routes/terms.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Helmet para headers de segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Security: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login/cadastro
  message: 'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

// Aplicar rate limiting geral
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Limitar tamanho do body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos de uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes); // Rate limiting mais restritivo para auth
app.use('/api/contact', contactRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/admin', adminRoutes); // Rotas administrativas
app.use('/api/associations', associationsRoutes); // Rotas de associações
app.use('/api/association-auth', associationAuthRoutes); // Autenticação de associações
app.use('/api/association-upload', associationUploadRoutes); // Upload de imagens de associações
app.use('/api/association-dashboard', associationDashboardRoutes); // Dashboard e métricas da associação
app.use('/api/terms', termsRoutes); // Termos de aceite

// Error handler (deve ser o último middleware)
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

