import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';

export const requireAdmin = async (req, res, next) => {
  try {
    // Verificar token
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    // Verificar se o usuário é admin e carregar email (para escopo fake vs real)
    const result = await pool.query(
      'SELECT is_admin, is_active, email FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    req.user.email = user.email;

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

