import express from 'express';
import { pool } from '../database/connection.js';
import { createCharge, getChargeStatus, verifyWebhookSignature, processWebhook, checkCredentials } from '../services/ciabra.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Verificar credenciais do Ciabra
 * GET /api/ciabra/check
 */
router.get('/check', async (req, res) => {
  try {
    const result = await checkCredentials();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Erro ao verificar credenciais:', error);
    res.status(500).json({ error: error.message || 'Erro ao verificar credenciais' });
  }
});

/**
 * Webhook para receber notificações do Ciabra
 */
router.post('/webhook', express.json(), async (req, res) => {
  try {
    const signature = req.headers['x-ciabra-signature'] || req.headers['x-signature'];
    const payload = req.body;

    // Log completo do payload recebido para debug
    console.log('📨 Webhook recebido do Ciabra - Payload completo:', JSON.stringify(payload, null, 2));
    console.log('📨 Webhook recebido do Ciabra - Resumo:', {
      event: payload.event || payload.type || 'unknown',
      chargeId: payload.id || payload.charge_id || payload.data?.id || payload.charge?.id,
      status: payload.status || payload.data?.status || payload.charge?.status,
    });

    // Verificar assinatura (opcional - Ciabra pode não enviar)
    if (signature && !verifyWebhookSignature(signature, payload)) {
      console.warn('⚠️  Webhook com assinatura inválida:', signature);
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar webhook
    const webhookData = processWebhook(payload);
    const { eventType, invoiceId, chargeId, status, paidAt, amount, pixQrCode, pixQrCodeUrl, boletoUrl, externalId } = webhookData;

    // Usar invoiceId ou chargeId (são a mesma coisa)
    const invoiceIdToSearch = invoiceId || chargeId;

    console.log(`📋 Processando evento: ${eventType}, invoiceId: ${invoiceIdToSearch}, status: ${status}`);

    if (!invoiceIdToSearch) {
      console.warn('⚠️  Webhook sem invoice_id:', payload);
      // Tentar buscar pelo externalId se disponível
      const externalId = payload.externalId || payload.invoice?.externalId;
      if (externalId) {
        const paymentByExternalId = await pool.query(
          'SELECT id, user_id, status FROM payments WHERE id = $1',
          [externalId]
        );
        if (paymentByExternalId.rows.length > 0) {
          // Continuar processamento com payment encontrado
          const payment = paymentByExternalId.rows[0];
          // Atualizar ciabra_charge_id se não tiver
          if (!payment.ciabra_charge_id) {
            await pool.query(
              'UPDATE payments SET ciabra_charge_id = $1 WHERE id = $2',
              [invoiceIdToSearch || payload.invoiceId || payload.id, payment.id]
            );
          }
        } else {
          return res.status(200).json({ message: 'Pagamento não encontrado (pode ser teste ou cobrança externa)' });
        }
      } else {
        return res.status(400).json({ error: 'invoice_id não encontrado no webhook' });
      }
    }

    // Buscar pagamento pelo charge_id (invoice_id) ou external_id
    let paymentResult = await pool.query(
      'SELECT id, user_id, status FROM payments WHERE ciabra_charge_id = $1',
      [invoiceIdToSearch]
    );

    // Se não encontrou pelo charge_id, tentar pelo external_id (nosso payment_id)
    if (paymentResult.rows.length === 0 && externalId) {
      paymentResult = await pool.query(
        'SELECT id, user_id, status FROM payments WHERE id = $1',
        [externalId]
      );
      // Se encontrou pelo externalId, atualizar o ciabra_charge_id
      if (paymentResult.rows.length > 0 && invoiceIdToSearch) {
        await pool.query(
          'UPDATE payments SET ciabra_charge_id = $1 WHERE id = $2',
          [invoiceIdToSearch, paymentResult.rows[0].id]
        );
      }
    }

    if (paymentResult.rows.length === 0) {
      console.warn(`⚠️  Pagamento não encontrado para charge_id: ${chargeId} (pode ser teste ou cobrança externa)`);
      // Retornar 200 para não causar retry do Ciabra
      return res.status(200).json({ message: 'Pagamento não encontrado (pode ser teste ou cobrança externa)' });
    }

    const payment = paymentResult.rows[0];

    // Processar cada tipo de evento especificamente
    const updateData = {
      updated_at: new Date(),
    };

    // Processar baseado no tipo de evento do Ciabra
    // Tipos: INVOICE_CREATED, INVOICE_DELETED, PAYMENT_GENERATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_REFUNDED
    if (eventType === 'INVOICE_CREATED' || eventType.includes('INVOICE_CREATED')) {
      // Invoice criada: Atualizar com dados iniciais (PIX/Boleto)
      console.log('📦 Evento: Invoice criada');
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
      if (status) updateData.status = status;
    }
    else if (eventType === 'INVOICE_DELETED' || eventType.includes('INVOICE_DELETED')) {
      // Invoice deletada: Marcar como cancelado
      console.log('🗑️  Evento: Invoice deletada');
      updateData.status = 'cancelled';
    }
    else if (eventType === 'PAYMENT_GENERATED' || eventType.includes('PAYMENT_GENERATED')) {
      // Pagamento gerado: Atualizar QR Code PIX ou URL do boleto
      console.log('💳 Evento: Pagamento gerado');
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
    }
    else if (eventType === 'PAYMENT_CONFIRMED' || eventType === 'PAYMENT_RECEIVED' || eventType.includes('PAYMENT_CONFIRMED') || status === 'paid') {
      // Pagamento confirmado/recebido: Marcar como pago e atualizar data
      console.log('✅ Evento: Pagamento confirmado/recebido');
      updateData.status = 'paid';
      if (paidAt) {
        updateData.paid_date = new Date(paidAt);
      } else {
        updateData.paid_date = new Date(); // Se não veio a data, usar agora
      }

      // Verificar se o usuário ainda tem outros pagamentos vencidos
      const overdueCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM payments 
         WHERE user_id = $1 
           AND id != $2
           AND status IN ('pending', 'overdue') 
           AND due_date < CURRENT_DATE`,
        [payment.user_id, payment.id]
      );

      // Se não tem mais vencidos, o usuário volta a ser adimplente
      if (parseInt(overdueCheck.rows[0].count) === 0) {
        console.log(`✅ Usuário ${payment.user_id} voltou a ser adimplente`);
      }
    }
    else if (eventType === 'PAYMENT_REFUNDED' || eventType.includes('PAYMENT_REFUNDED')) {
      // Pagamento estornado: Marcar como cancelado
      console.log('🔄 Evento: Pagamento estornado');
      updateData.status = 'cancelled';
    }
    else {
      // Evento genérico: Atualizar status e dados se fornecidos
      console.log(`📝 Evento genérico: ${eventType}`);
      if (status) updateData.status = status;
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
      if (status === 'paid' && paidAt) {
        updateData.paid_date = new Date(paidAt);
      }
    }

    // Construir query de update dinamicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updateData[key]);
        paramIndex++;
      }
    });

    updateValues.push(payment.id);
    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    await pool.query(updateQuery, updateValues);

    console.log(`✅ Pagamento ${payment.id} atualizado para status: ${status}`);

    res.json({ success: true, message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error('Erro ao processar webhook do Ciabra:', error);
    res.status(500).json({ error: 'Erro ao processar webhook' });
  }
});

/**
 * Criar cobrança para um pagamento
 * POST /api/ciabra/charges
 * Body: { payment_id (opcional), payment_method: 'pix' | 'boleto' }
 * Se payment_id não for fornecido, cria um novo pagamento baseado no payment_day do usuário
 */
router.post('/charges', authenticateToken, async (req, res) => {
  try {
    const { payment_id, payment_method = 'pix' } = req.body;
    const userId = req.user.id;

    let payment;

    if (payment_id) {
      // Buscar pagamento existente (incluindo dados de perfil para endereço)
      const paymentResult = await pool.query(
        `SELECT p.*, 
                u.name, 
                u.email, 
                u.phone, 
                u.payment_day, 
                u.ciabra_customer_id,
                up.cpf,
                up.address,
                up.city,
                up.state,
                up.zip_code
         FROM payments p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE p.id = $1 AND p.user_id = $2`,
        [payment_id, userId]
      );

      if (paymentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      payment = paymentResult.rows[0];
    } else {
      // Criar novo pagamento baseado no payment_day do usuário
      const userResult = await pool.query(
        `SELECT u.id, u.name, u.email, u.phone, u.payment_day, u.ciabra_customer_id, 
                up.cpf, up.address, up.city, up.state, up.zip_code
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const user = userResult.rows[0];
      const paymentDay = user.payment_day || 10;
      
      // Adicionar ciabra_customer_id ao objeto user para uso posterior
      user.ciabra_customer_id = user.ciabra_customer_id;

      // Calcular próxima data de vencimento
      const today = new Date();
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      let targetDay = paymentDay;
      let targetMonth = currentMonth;
      let targetYear = currentYear;

      // Se já passou o dia de pagamento deste mês, calcular para o próximo mês
      if (currentDay > paymentDay) {
        targetMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        targetYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      }

      const dueDate = new Date(targetYear, targetMonth, targetDay);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Verificar se já existe pagamento para essa data
      const existingPayment = await pool.query(
        `SELECT * FROM payments 
         WHERE user_id = $1 AND due_date = $2
         LIMIT 1`,
        [userId, dueDateStr]
      );

      if (existingPayment.rows.length > 0) {
        payment = existingPayment.rows[0];
        // Buscar dados do usuário para o pagamento existente
        const userDataResult = await pool.query(
          `SELECT u.name, u.email, u.phone, u.ciabra_customer_id, 
                  up.cpf, up.address, up.city, up.state, up.zip_code
           FROM users u
           LEFT JOIN user_profiles up ON u.id = up.user_id
           WHERE u.id = $1`,
          [userId]
        );
        if (userDataResult.rows.length > 0) {
          payment = {
            ...payment,
            name: userDataResult.rows[0].name,
            email: userDataResult.rows[0].email,
            phone: userDataResult.rows[0].phone,
            cpf: userDataResult.rows[0].cpf,
            ciabraCustomerId: userDataResult.rows[0].ciabra_customer_id,
            address: userDataResult.rows[0].address,
            city: userDataResult.rows[0].city,
            state: userDataResult.rows[0].state,
            zip_code: userDataResult.rows[0].zip_code,
          };
        }
      } else {
        // Criar novo pagamento
        const amount = 150.00; // Valor padrão
        const newPaymentResult = await pool.query(
          `INSERT INTO payments (user_id, amount, due_date, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING *`,
          [userId, amount, dueDateStr]
        );

        payment = {
          ...newPaymentResult.rows[0],
          name: user.name,
          email: user.email,
          phone: user.phone,
          cpf: user.cpf,
          ciabraCustomerId: user.ciabra_customer_id || null,
          address: user.address,
          city: user.city,
          state: user.state,
          zip_code: user.zip_code,
        };
      }
    }

    // Se já tem charge_id, retornar dados existentes
    if (payment.ciabra_charge_id) {
      const chargeData = await getChargeStatus(payment.ciabra_charge_id);
      return res.json({
        charge: chargeData,
        payment: {
          id: payment.id,
          ciabra_charge_id: payment.ciabra_charge_id,
          pix_qr_code: payment.ciabra_pix_qr_code,
          pix_qr_code_url: payment.ciabra_pix_qr_code_url,
          boleto_url: payment.ciabra_boleto_url,
        },
      });
    }

    // Criar cobrança no Ciabra
    // Formatar data de forma simples para a descrição
    const dueDateFormatted = new Date(payment.due_date).toLocaleDateString('pt-BR');
    const chargeData = await createCharge({
      amount: parseFloat(payment.amount),
      due_date: payment.due_date,
      description: `Contribuição mensal - ${dueDateFormatted}`,
      customer: {
        name: payment.name,
        email: payment.email,
        document: payment.cpf,
        phone: payment.phone,
        ciabraCustomerId: payment.ciabraCustomerId, // Reutilizar se já existir
        address: payment.address,
        city: payment.city,
        state: payment.state,
        zipCode: payment.zip_code,
      },
      payment_method,
      externalId: payment.id.toString(), // ID do nosso pagamento
      userId: userId, // Para salvar o ciabra_customer_id após criar
    });

    // A resposta do Ciabra pode ter estrutura diferente
    // Vamos buscar os detalhes completos da invoice para obter QR Code e Boleto
    let invoiceDetails = chargeData;
    if (chargeData.id) {
      try {
        // Aguardar um pouco para o Ciabra processar o pagamento
        await new Promise(resolve => setTimeout(resolve, 1000));
        invoiceDetails = await getChargeStatus(chargeData.id);
      } catch (error) {
        console.warn('Não foi possível buscar detalhes da invoice, usando dados iniciais:', error);
      }
    }

    // Extrair dados de pagamento (PIX/Boleto) da invoice
    // A estrutura pode variar, então tentamos vários formatos
    const installments = invoiceDetails.installments || [];
    const firstInstallment = installments[0];
    const payments = firstInstallment?.payments || [];
    const firstPayment = payments[0];

    // Tentar extrair PIX e Boleto de diferentes estruturas
    let pixQrCode = null;
    let pixQrCodeUrl = null;
    let boletoUrl = null;

    // Buscar PIX
    if (firstPayment?.pix) {
      pixQrCode = firstPayment.pix.qrCode || firstPayment.pix.qr_code || firstPayment.pix.code;
      pixQrCodeUrl = firstPayment.pix.qrCodeUrl || firstPayment.pix.qr_code_url || firstPayment.pix.url;
    }
    // Tentar na invoice diretamente
    if (!pixQrCode && invoiceDetails.pix) {
      pixQrCode = invoiceDetails.pix.qrCode || invoiceDetails.pix.qr_code || invoiceDetails.pix.code;
      pixQrCodeUrl = invoiceDetails.pix.qrCodeUrl || invoiceDetails.pix.qr_code_url || invoiceDetails.pix.url;
    }

    // Buscar Boleto
    if (firstPayment?.boleto) {
      boletoUrl = firstPayment.boleto.url || firstPayment.boleto.link;
    }
    if (!boletoUrl && invoiceDetails.boleto) {
      boletoUrl = invoiceDetails.boleto.url || invoiceDetails.boleto.link;
    }

    // Atualizar pagamento com dados do Ciabra
    const updateData = {
      ciabra_charge_id: chargeData.id || invoiceDetails.id,
      ciabra_pix_qr_code: pixQrCode,
      ciabra_pix_qr_code_url: pixQrCodeUrl,
      ciabra_boleto_url: boletoUrl,
    };

    await pool.query(
      `UPDATE payments 
       SET ciabra_charge_id = $1,
           ciabra_pix_qr_code = $2,
           ciabra_pix_qr_code_url = $3,
           ciabra_boleto_url = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        updateData.ciabra_charge_id,
        updateData.ciabra_pix_qr_code,
        updateData.ciabra_pix_qr_code_url,
        updateData.ciabra_boleto_url,
        payment.id,
      ]
    );

    // Salvar ciabra_customer_id no usuário (se ainda não tiver e se tiver customerId na resposta)
    if (chargeData.customerId && userId) {
      await pool.query(
        `UPDATE users 
         SET ciabra_customer_id = $1
         WHERE id = $2 AND ciabra_customer_id IS NULL`,
        [chargeData.customerId, userId]
      );
      console.log(`✅ Salvo ciabra_customer_id ${chargeData.customerId} para usuário ${userId}`);
    }

    res.json({
      message: 'Cobrança criada com sucesso',
      charge: chargeData,
      payment: {
        id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status,
        ciabra_charge_id: updateData.ciabra_charge_id,
        ciabra_pix_qr_code: updateData.ciabra_pix_qr_code,
        ciabra_pix_qr_code_url: updateData.ciabra_pix_qr_code_url,
        ciabra_boleto_url: updateData.ciabra_boleto_url,
      },
    });
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar cobrança' });
  }
});

/**
 * Consultar status de uma cobrança
 * GET /api/ciabra/charges/:charge_id
 */
router.get('/charges/:charge_id', authenticateToken, async (req, res) => {
  try {
    const { charge_id } = req.params;

    const chargeData = await getChargeStatus(charge_id);

    // Atualizar pagamento local se necessário
    const paymentResult = await pool.query(
      'SELECT id FROM payments WHERE ciabra_charge_id = $1',
      [charge_id]
    );

    if (paymentResult.rows.length > 0) {
      const paymentId = paymentResult.rows[0].id;
      const statusMap = {
        pending: 'pending',
        paid: 'paid',
        overdue: 'overdue',
        cancelled: 'cancelled',
      };

      const newStatus = statusMap[chargeData.status] || chargeData.status;

      await pool.query(
        `UPDATE payments 
         SET status = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newStatus, paymentId]
      );
    }

    res.json({ charge: chargeData });
  } catch (error) {
    console.error('Erro ao consultar cobrança:', error);
    res.status(500).json({ error: error.message || 'Erro ao consultar cobrança' });
  }
});

export default router;
