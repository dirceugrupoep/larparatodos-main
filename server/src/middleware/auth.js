import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    // Verificar formato Bearer
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Formato de token inválido. Use: Bearer <token>' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token de acesso não fornecido' });
    }

    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('⚠️  AVISO: JWT_SECRET não está configurado corretamente!');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    jwt.verify(token, jwtSecret, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ error: 'Token expirado. Faça login novamente.' });
        }
        if (err.name === 'JsonWebTokenError') {
          return res.status(403).json({ error: 'Token inválido' });
        }
        return res.status(403).json({ error: 'Erro ao verificar token' });
      }

      // Adicionar informações do usuário ao request
      req.user = {
        id: decoded.id,
        email: decoded.email,
      };
      next();
    });
  } catch (error) {
    console.error('Erro no middleware de autenticação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

