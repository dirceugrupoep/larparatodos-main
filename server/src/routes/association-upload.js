import express from 'express';
import multer from 'multer';
import path from 'path';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';
import { uploadToS3, deleteFromS3 } from '../services/storage.js';

const router = express.Router();

// Configuração do multer para armazenar em memória (para enviar ao S3)
const storage = multer.memoryStorage();

// Filtro de arquivo - apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (JPEG, JPG, PNG, GIF, WEBP)'));
  }
};

// Configuração do upload - máximo 5MB
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Middleware para verificar autenticação da associação
const authenticateAssociation = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    if (!decoded.associationId) {
      return res.status(401).json({ error: 'Token inválido para associação' });
    }

    // Verificar se a associação existe e está ativa
    const result = await pool.query(
      'SELECT id, is_active, is_approved FROM associations WHERE id = $1',
      [decoded.associationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Associação não encontrada' });
    }

    if (!result.rows[0].is_active || !result.rows[0].is_approved) {
      return res.status(403).json({ error: 'Associação não está ativa ou aprovada' });
    }

    req.associationId = decoded.associationId;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Upload de logo
router.post('/logo', authenticateAssociation, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Gerar nome único para o arquivo
    const ext = path.extname(req.file.originalname);
    const fileName = `logo_${req.associationId}_${Date.now()}${ext}`;

    // Fazer upload para S3
    const fileUrl = await uploadToS3(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );

    // Buscar URL antiga para deletar se existir
    const oldLogoResult = await pool.query(
      'SELECT logo_url FROM associations WHERE id = $1',
      [req.associationId]
    );

    // Atualizar no banco de dados
    await pool.query(
      'UPDATE associations SET logo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [fileUrl, req.associationId]
    );

    // Deletar arquivo antigo do S3 se existir
    if (oldLogoResult.rows[0]?.logo_url) {
      try {
        await deleteFromS3(oldLogoResult.rows[0].logo_url);
      } catch (error) {
        console.warn('Erro ao deletar logo antigo:', error);
        // Não falhar se não conseguir deletar o arquivo antigo
      }
    }

    res.json({
      message: 'Logo enviado com sucesso',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload do logo' });
  }
});

// Upload de capa
router.post('/cover', authenticateAssociation, upload.single('cover'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Gerar nome único para o arquivo
    const ext = path.extname(req.file.originalname);
    const fileName = `cover_${req.associationId}_${Date.now()}${ext}`;

    // Fazer upload para S3
    const fileUrl = await uploadToS3(
      req.file.buffer,
      fileName,
      req.file.mimetype
    );

    // Buscar URL antiga para deletar se existir
    const oldCoverResult = await pool.query(
      'SELECT cover_url FROM associations WHERE id = $1',
      [req.associationId]
    );

    // Atualizar no banco de dados
    await pool.query(
      'UPDATE associations SET cover_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [fileUrl, req.associationId]
    );

    // Deletar arquivo antigo do S3 se existir
    if (oldCoverResult.rows[0]?.cover_url) {
      try {
        await deleteFromS3(oldCoverResult.rows[0].cover_url);
      } catch (error) {
        console.warn('Erro ao deletar capa antiga:', error);
        // Não falhar se não conseguir deletar o arquivo antigo
      }
    }

    res.json({
      message: 'Capa enviada com sucesso',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Upload cover error:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da capa' });
  }
});

export default router;
