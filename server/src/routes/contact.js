import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../database/connection.js';
import { authenticateToken } from '../middleware/auth.js';
import { z } from 'zod';
import { createOrGetCustomer } from '../services/ciabra.js';

const router = express.Router();

const contactSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(255).trim(),
  email: z.string().email('Email inválido').max(255).toLowerCase().trim(),
  phone: z.string().max(20).optional(),
  cpf: z.string().min(11, 'CPF inválido').max(14),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  message: z.string().max(5000).optional(),
  association_id: z.number().int().positive().optional(),
  // Dia do pagamento opcional (1–31). Se não vier, calculamos depois.
  payment_day: z.number().int().refine(
    (val) => val >= 1 && val <= 31,
    { message: 'Dia de pagamento deve ser entre 1 e 31' }
  ).optional(),
});

// Create contact and user (público - cria usuário automaticamente)
router.post('/', async (req, res) => {
  try {
    const validatedData = contactSchema.parse(req.body);
    const { name, email, phone, cpf, password, message, association_id, payment_day } = validatedData;

    // Verificar se usuário já existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR id IN (SELECT user_id FROM user_profiles WHERE cpf = $2)',
      [email, cpf]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
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

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar se JWT_SECRET está configurado
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret === 'your-secret-key') {
      console.error('⚠️  ERRO: JWT_SECRET não configurado!');
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }

    // Iniciar transação
    await pool.query('BEGIN');

    try {
      // Criar usuário
      const userResult = await pool.query(
        'INSERT INTO users (name, email, password, phone, association_id, payment_day) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, phone, created_at',
        [name, email, hashedPassword, phone || null, finalAssociationId || null, payment_day || null]
      );

      const user = userResult.rows[0];

      // Criar perfil com CPF
      await pool.query(
        'INSERT INTO user_profiles (user_id, cpf) VALUES ($1, $2)',
        [user.id, cpf]
      );

      // Criar cliente no Ciabra (assíncrono - não bloqueia o cadastro se falhar)
      // Isso garante que o ciabra_customer_id esteja salvo para uso futuro
      (async () => {
        try {
          console.log(`🔄 [contact] Criando cliente no Ciabra para usuário ${user.id}...`);
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
            console.log(`✅ [contact] Cliente Ciabra criado e salvo: ${ciabraCustomer.id} para usuário ${user.id}`);
          }
        } catch (error) {
          // Não bloqueia o cadastro se falhar ao criar no Ciabra
          console.error(`⚠️ [contact] Erro ao criar cliente no Ciabra (não bloqueia cadastro):`, error.message);
        }
      })();

      // Criar contato
      const contactResult = await pool.query(
        'INSERT INTO contacts (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, email, phone || null, message || null]
      );

      // Criar status inicial do projeto
      await pool.query(
        'INSERT INTO project_status (user_id, phase, progress_percentage) VALUES ($1, $2, $3)',
        [user.id, 'registration', 0]
      );

      // Gerar token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '7d' }
      );

      // Commit da transação
      await pool.query('COMMIT');

      res.status(201).json({
        message: 'Cadastro realizado com sucesso! Sua conta foi criada e você já pode fazer login.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
        },
        contact: contactResult.rows[0],
        token, // Token para login automático opcional
      });
    } catch (error) {
      // Rollback em caso de erro
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Contact/Register error:', error);
    
    // Verificar se é erro de duplicação
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email ou CPF já cadastrado' });
    }
    
    res.status(500).json({ error: 'Erro ao processar cadastro' });
  }
});

// Get all contacts (PROTEGIDO - requer autenticação)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );

    res.json({ contacts: result.rows });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Erro ao buscar contatos' });
  }
});

export default router;

