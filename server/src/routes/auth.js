import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';
import { z } from 'zod';
import { createOrGetCustomer } from '../services/ciabra.js';

const router = express.Router();

const registerSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(255, 'Nome muito longo')
    .trim(),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email muito longo')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha muito longa'),
  phone: z.string().max(20).optional(),
  cpf: z.string()
    .min(11, 'CPF inválido')
    .max(14, 'CPF inválido')
    .optional(),
  association_id: z.number().int().positive().optional(),
  // Agora permitimos qualquer dia entre 1 e 31
  payment_day: z.number().int().refine(
    (val) => val >= 1 && val <= 31,
    {
      message: 'Dia de pagamento deve ser entre 1 e 31',
    }
  ).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password, phone, cpf, association_id, payment_day } = validatedData;

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Buscar associação padrão se não fornecida
    let finalAssociationId = association_id;
    if (!finalAssociationId) {
      const defaultAssociation = await pool.query(
        'SELECT id FROM associations WHERE is_default = true AND is_active = true LIMIT 1'
      );
      if (defaultAssociation.rows.length > 0) {
        finalAssociationId = defaultAssociation.rows[0].id;
      }
    }

    // Verificar se a associação existe e está ativa
    if (finalAssociationId) {
      const associationCheck = await pool.query(
        'SELECT id FROM associations WHERE id = $1 AND is_active = true',
        [finalAssociationId]
      );
      if (associationCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Associação inválida ou inativa' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, association_id, payment_day) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, payment_day, created_at',
      [name, email, hashedPassword, phone || null, finalAssociationId || null, payment_day || null]
    );

    const user = result.rows[0];

    // Criar perfil com CPF se fornecido
    if (cpf) {
      await pool.query(
        'INSERT INTO user_profiles (user_id, cpf) VALUES ($1, $2)',
        [user.id, cpf.replace(/\D/g, '')] // Remove formatação do CPF
      );

      // Criar cliente no Ciabra (assíncrono - não bloqueia o cadastro se falhar)
      (async () => {
        try {
          console.log(`🔄 [auth/register] Criando cliente no Ciabra para usuário ${user.id}...`);
          const ciabraCustomer = await createOrGetCustomer({
            name: name,
            email: email,
            document: cpf.replace(/\D/g, ''), // Remove formatação do CPF
            phone: phone ? (phone.startsWith('+') ? phone : `+55${phone.replace(/\D/g, '')}`) : null,
            ciabraCustomerId: null, // Novo cliente
            address: null,
            city: null,
            state: null,
            zipCode: null,
          });
          
          if (ciabraCustomer && ciabraCustomer.id) {
            // Salvar ciabra_customer_id no banco
            await pool.query(
              'UPDATE users SET ciabra_customer_id = $1 WHERE id = $2',
              [ciabraCustomer.id, user.id]
            );
            console.log(`✅ [auth/register] Cliente Ciabra criado e salvo: ${ciabraCustomer.id} para usuário ${user.id}`);
          }
        } catch (error) {
          // Não bloqueia o cadastro se falhar ao criar no Ciabra
          console.error(`⚠️ [auth/register] Erro ao criar cliente no Ciabra (não bloqueia cadastro):`, error.message);
        }
      })();
    }

    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('⚠️  ERRO: JWT_SECRET não configurado!');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Buscar dados completos do usuário
    const userWithAdmin = await pool.query(
      'SELECT id, name, email, phone, is_admin, is_active, payment_day FROM users WHERE id = $1',
      [user.id]
    );

    res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user: {
        id: userWithAdmin.rows[0].id,
        name: userWithAdmin.rows[0].name,
        email: userWithAdmin.rows[0].email,
        phone: userWithAdmin.rows[0].phone,
        is_admin: userWithAdmin.rows[0].is_admin || false,
        is_active: userWithAdmin.rows[0].is_active !== false,
        payment_day: userWithAdmin.rows[0].payment_day,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    // Verificar se o pool está conectado
    try {
      await pool.query('SELECT 1');
    } catch (dbError) {
      console.error('❌ Erro de conexão com banco durante login:', dbError.message);
      return res.status(503).json({ 
        error: 'Serviço temporariamente indisponível. Banco de dados não está acessível.' 
      });
    }

    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Find user
    const result = await pool.query(
      'SELECT id, name, email, password, phone, is_admin, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Conta desativada. Entre em contato com o administrador.' });
    }

    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('⚠️  ERRO: JWT_SECRET não configurado!');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        is_admin: user.is_admin || false,
        is_active: user.is_active !== false,
      },
      token,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    const decoded = jwt.verify(token, jwtSecret);

    const result = await pool.query(
      'SELECT id, name, email, phone, is_admin, is_active, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(401).json({ error: 'Token inválido' });
  }
});

export default router;

