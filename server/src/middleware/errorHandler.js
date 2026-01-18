// Middleware para tratamento centralizado de erros
export const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: err.errors,
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expirado' });
  }

  // Erro de banco de dados
  if (err.code === '23505') { // Unique violation
    return res.status(409).json({ error: 'Registro já existe' });
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

