import express from 'express';
import { pool } from '../database/connection.js';
import { createCharge, getChargeStatus, getInstallmentPayments, verifyWebhookSignature, processWebhook, checkCredentials } from '../services/ciabra.js';
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
  const timestamp = new Date().toISOString();
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  
  try {
    // Log completo de headers
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📨 [WEBHOOK] Nova requisição recebida - ${timestamp}`);
    console.log(`📍 [WEBHOOK] IP do cliente: ${clientIp}`);
    console.log(`📋 [WEBHOOK] Headers recebidos:`, JSON.stringify(req.headers, null, 2));
    
    const signature = req.headers['x-ciabra-signature'] || req.headers['x-signature'];
    const payload = req.body;

    // Log completo do payload recebido
    console.log(`📦 [WEBHOOK] Payload completo (raw):`, JSON.stringify(payload, null, 2));
    console.log(`📦 [WEBHOOK] Tipo do payload:`, typeof payload);
    console.log(`📦 [WEBHOOK] Chaves do payload:`, Object.keys(payload || {}));
    
    // Log resumido com informações principais
    const eventType = payload.event || payload.type || payload.hookType || 'unknown';
    const invoiceId = payload.id || payload.charge_id || payload.data?.id || payload.charge?.id || payload.invoiceId || payload.invoice?.id;
    const status = payload.status || payload.data?.status || payload.charge?.status || payload.invoice?.status;
    const externalId = payload.externalId || payload.invoice?.externalId || payload.data?.externalId;
    
    console.log(`📊 [WEBHOOK] Resumo do evento:`, {
      eventType,
      invoiceId,
      status,
      externalId,
      signature: signature ? 'presente' : 'ausente',
    });

    // Verificar assinatura (opcional - Ciabra pode não enviar)
    console.log(`🔐 [WEBHOOK] Verificando assinatura...`);
    if (signature) {
      console.log(`🔐 [WEBHOOK] Assinatura recebida: ${signature.substring(0, 20)}...`);
      if (!verifyWebhookSignature(signature, payload)) {
        console.error(`❌ [WEBHOOK] Assinatura inválida!`);
        console.error(`❌ [WEBHOOK] Payload que causou erro:`, JSON.stringify(payload, null, 2));
        return res.status(401).json({ error: 'Assinatura inválida' });
      }
      console.log(`✅ [WEBHOOK] Assinatura válida`);
    } else {
      console.log(`⚠️  [WEBHOOK] Nenhuma assinatura recebida (pode ser normal)`);
    }

    // Processar webhook
    console.log(`🔄 [WEBHOOK] Processando payload...`);
    const webhookData = processWebhook(payload);
    console.log(`✅ [WEBHOOK] Dados processados:`, JSON.stringify(webhookData, null, 2));
    
    const { eventType: processedEventType, invoiceId: processedInvoiceId, chargeId, status: processedStatus, paidAt, amount, pixQrCode, pixQrCodeUrl, boletoUrl, externalId: processedExternalId } = webhookData;

    // Usar invoiceId ou chargeId (são a mesma coisa)
    const invoiceIdToSearch = processedInvoiceId || chargeId;

    console.log(`📋 [WEBHOOK] Dados extraídos:`, {
      eventType: processedEventType,
      invoiceId: invoiceIdToSearch,
      chargeId,
      status: processedStatus,
      paidAt,
      amount,
      externalId: processedExternalId,
      hasPixQrCode: !!pixQrCode,
      hasPixQrCodeUrl: !!pixQrCodeUrl,
      hasBoletoUrl: !!boletoUrl,
    });

    if (!invoiceIdToSearch) {
      console.warn(`⚠️  [WEBHOOK] invoice_id não encontrado no payload`);
      console.warn(`⚠️  [WEBHOOK] Tentando buscar pelo externalId...`);
      // Tentar buscar pelo externalId se disponível
      const externalId = processedExternalId || payload.externalId || payload.invoice?.externalId;
      if (externalId) {
        console.log(`🔍 [WEBHOOK] Buscando pagamento pelo externalId: ${externalId}`);
        const paymentByExternalId = await pool.query(
          'SELECT id, user_id, status, ciabra_charge_id FROM payments WHERE id = $1',
          [externalId]
        );
        console.log(`📊 [WEBHOOK] Resultado da busca por externalId:`, {
          encontrado: paymentByExternalId.rows.length > 0,
          dados: paymentByExternalId.rows[0] || null,
        });
        if (paymentByExternalId.rows.length > 0) {
          // Continuar processamento com payment encontrado
          const payment = paymentByExternalId.rows[0];
          // Atualizar ciabra_charge_id se não tiver
          const possibleInvoiceId = payload.invoiceId || payload.id || payload.invoice?.id;
          if (!payment.ciabra_charge_id && possibleInvoiceId) {
            console.log(`💾 [WEBHOOK] Atualizando ciabra_charge_id para payment ${payment.id}: ${possibleInvoiceId}`);
            await pool.query(
              'UPDATE payments SET ciabra_charge_id = $1 WHERE id = $2',
              [possibleInvoiceId, payment.id]
            );
          }
        } else {
          console.warn(`⚠️  [WEBHOOK] Pagamento não encontrado pelo externalId: ${externalId}`);
          return res.status(200).json({ message: 'Pagamento não encontrado (pode ser teste ou cobrança externa)' });
        }
      } else {
        console.error(`❌ [WEBHOOK] invoice_id e externalId não encontrados no payload`);
        return res.status(400).json({ error: 'invoice_id não encontrado no webhook' });
      }
    }

    // Buscar pagamento pelo charge_id (invoice_id) ou external_id
    console.log(`🔍 [WEBHOOK] Buscando pagamento pelo ciabra_charge_id: ${invoiceIdToSearch}`);
    let paymentResult = await pool.query(
      'SELECT id, user_id, status, ciabra_charge_id, amount, due_date FROM payments WHERE ciabra_charge_id = $1',
      [invoiceIdToSearch]
    );
    console.log(`📊 [WEBHOOK] Resultado da busca por ciabra_charge_id:`, {
      encontrado: paymentResult.rows.length > 0,
      dados: paymentResult.rows[0] || null,
    });

    // Se não encontrou pelo charge_id, tentar pelo external_id (nosso payment_id)
    if (paymentResult.rows.length === 0 && processedExternalId) {
      console.log(`🔍 [WEBHOOK] Não encontrado pelo ciabra_charge_id, tentando pelo externalId: ${processedExternalId}`);
      paymentResult = await pool.query(
        'SELECT id, user_id, status, ciabra_charge_id, amount, due_date FROM payments WHERE id = $1',
        [processedExternalId]
      );
      console.log(`📊 [WEBHOOK] Resultado da busca por externalId:`, {
        encontrado: paymentResult.rows.length > 0,
        dados: paymentResult.rows[0] || null,
      });
      // Se encontrou pelo externalId, atualizar o ciabra_charge_id
      if (paymentResult.rows.length > 0 && invoiceIdToSearch) {
        console.log(`💾 [WEBHOOK] Atualizando ciabra_charge_id para payment ${paymentResult.rows[0].id}: ${invoiceIdToSearch}`);
        await pool.query(
          'UPDATE payments SET ciabra_charge_id = $1 WHERE id = $2',
          [invoiceIdToSearch, paymentResult.rows[0].id]
        );
      }
    }

    if (paymentResult.rows.length === 0) {
      console.warn(`⚠️  [WEBHOOK] Pagamento não encontrado para invoice_id: ${invoiceIdToSearch}`);
      console.warn(`⚠️  [WEBHOOK] externalId tentado: ${processedExternalId || 'não fornecido'}`);
      // Retornar 200 para não causar retry do Ciabra
      return res.status(200).json({ message: 'Pagamento não encontrado (pode ser teste ou cobrança externa)' });
    }

    const payment = paymentResult.rows[0];
    console.log(`✅ [WEBHOOK] Pagamento encontrado:`, {
      paymentId: payment.id,
      userId: payment.user_id,
      statusAtual: payment.status,
      ciabraChargeId: payment.ciabra_charge_id,
      amount: payment.amount,
      dueDate: payment.due_date,
    });

    // Processar cada tipo de evento especificamente
    console.log(`🔄 [WEBHOOK] Preparando dados para atualização...`);
    const updateData = {
      updated_at: new Date(),
    };

    // Processar baseado no tipo de evento do Ciabra
    // Tipos: INVOICE_CREATED, INVOICE_DELETED, PAYMENT_GENERATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_REFUNDED
    console.log(`🎯 [WEBHOOK] Processando evento: ${processedEventType}`);
    
    if (processedEventType === 'INVOICE_CREATED' || processedEventType.includes('INVOICE_CREATED')) {
      // Invoice criada: Atualizar com dados iniciais (PIX/Boleto)
      console.log(`📦 [WEBHOOK] Evento: Invoice criada`);
      console.log(`📦 [WEBHOOK] Dados disponíveis:`, {
        hasPixQrCode: !!pixQrCode,
        hasPixQrCodeUrl: !!pixQrCodeUrl,
        hasBoletoUrl: !!boletoUrl,
        status: processedStatus,
      });
      if (pixQrCode) {
        updateData.ciabra_pix_qr_code = pixQrCode;
        console.log(`💾 [WEBHOOK] Adicionando PIX QR Code (${pixQrCode.length} caracteres)`);
      }
      if (pixQrCodeUrl) {
        updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
        console.log(`💾 [WEBHOOK] Adicionando PIX QR Code URL: ${pixQrCodeUrl}`);
      }
      if (boletoUrl) {
        updateData.ciabra_boleto_url = boletoUrl;
        console.log(`💾 [WEBHOOK] Adicionando Boleto URL: ${boletoUrl}`);
      }
      if (processedStatus) {
        updateData.status = processedStatus;
        console.log(`💾 [WEBHOOK] Atualizando status para: ${processedStatus}`);
      }
    }
    else if (processedEventType === 'INVOICE_DELETED' || processedEventType.includes('INVOICE_DELETED')) {
      // Invoice deletada: Marcar como cancelado
      console.log(`🗑️  [WEBHOOK] Evento: Invoice deletada`);
      updateData.status = 'cancelled';
      console.log(`💾 [WEBHOOK] Atualizando status para: cancelled`);
    }
    else if (processedEventType === 'PAYMENT_GENERATED' || processedEventType.includes('PAYMENT_GENERATED')) {
      // Pagamento gerado: Atualizar QR Code PIX ou URL do boleto
      console.log(`💳 [WEBHOOK] Evento: Pagamento gerado`);
      console.log(`💳 [WEBHOOK] Dados disponíveis:`, {
        hasPixQrCode: !!pixQrCode,
        hasPixQrCodeUrl: !!pixQrCodeUrl,
        hasBoletoUrl: !!boletoUrl,
      });
      if (pixQrCode) {
        updateData.ciabra_pix_qr_code = pixQrCode;
        console.log(`💾 [WEBHOOK] Adicionando PIX QR Code (${pixQrCode.length} caracteres)`);
      }
      if (pixQrCodeUrl) {
        updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
        console.log(`💾 [WEBHOOK] Adicionando PIX QR Code URL: ${pixQrCodeUrl}`);
      }
      if (boletoUrl) {
        updateData.ciabra_boleto_url = boletoUrl;
        console.log(`💾 [WEBHOOK] Adicionando Boleto URL: ${boletoUrl}`);
      }
    }
    else if (processedEventType === 'PAYMENT_CONFIRMED' || processedEventType === 'PAYMENT_RECEIVED' || processedEventType.includes('PAYMENT_CONFIRMED') || processedStatus === 'paid') {
      // Pagamento confirmado/recebido: Marcar como pago e atualizar data
      console.log(`✅ [WEBHOOK] Evento: Pagamento confirmado/recebido`);
      console.log(`✅ [WEBHOOK] Dados do pagamento:`, {
        paidAt,
        amount,
        status: processedStatus,
      });
      updateData.status = 'paid';
      if (paidAt) {
        updateData.paid_date = new Date(paidAt);
        console.log(`💾 [WEBHOOK] Atualizando paid_date para: ${paidAt}`);
      } else {
        updateData.paid_date = new Date(); // Se não veio a data, usar agora
        console.log(`💾 [WEBHOOK] Atualizando paid_date para: agora (não veio no payload)`);
      }
      console.log(`💾 [WEBHOOK] Atualizando status para: paid`);

      // Verificar se o usuário ainda tem outros pagamentos vencidos
      console.log(`🔍 [WEBHOOK] Verificando se usuário ${payment.user_id} tem outros pagamentos vencidos...`);
      const overdueCheck = await pool.query(
        `SELECT COUNT(*) as count 
         FROM payments 
         WHERE user_id = $1 
           AND id != $2
           AND status IN ('pending', 'overdue') 
           AND due_date < CURRENT_DATE`,
        [payment.user_id, payment.id]
      );
      const overdueCount = parseInt(overdueCheck.rows[0].count);
      console.log(`📊 [WEBHOOK] Pagamentos vencidos restantes: ${overdueCount}`);

      // Se não tem mais vencidos, o usuário volta a ser adimplente
      if (overdueCount === 0) {
        console.log(`✅ [WEBHOOK] Usuário ${payment.user_id} voltou a ser adimplente!`);
      } else {
        console.log(`⚠️  [WEBHOOK] Usuário ${payment.user_id} ainda tem ${overdueCount} pagamento(s) vencido(s)`);
      }
    }
    else if (processedEventType === 'PAYMENT_REFUNDED' || processedEventType.includes('PAYMENT_REFUNDED')) {
      // Pagamento estornado: Marcar como cancelado
      console.log(`🔄 [WEBHOOK] Evento: Pagamento estornado`);
      updateData.status = 'cancelled';
      console.log(`💾 [WEBHOOK] Atualizando status para: cancelled`);
    }
    else {
      // Evento genérico: Atualizar status e dados se fornecidos
      console.log(`📝 [WEBHOOK] Evento genérico: ${processedEventType}`);
      console.log(`📝 [WEBHOOK] Dados disponíveis para atualização:`, {
        status: processedStatus,
        hasPixQrCode: !!pixQrCode,
        hasPixQrCodeUrl: !!pixQrCodeUrl,
        hasBoletoUrl: !!boletoUrl,
        paidAt,
      });
      if (processedStatus) updateData.status = processedStatus;
      if (pixQrCode) updateData.ciabra_pix_qr_code = pixQrCode;
      if (pixQrCodeUrl) updateData.ciabra_pix_qr_code_url = pixQrCodeUrl;
      if (boletoUrl) updateData.ciabra_boleto_url = boletoUrl;
      if (processedStatus === 'paid' && paidAt) {
        updateData.paid_date = new Date(paidAt);
      }
    }

    // Construir query de update dinamicamente
    console.log(`🔧 [WEBHOOK] Construindo query de atualização...`);
    console.log(`🔧 [WEBHOOK] Dados a serem atualizados:`, JSON.stringify(updateData, null, 2));
    
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

    if (updateFields.length === 0) {
      console.warn(`⚠️  [WEBHOOK] Nenhum campo para atualizar! Retornando sucesso sem atualização.`);
      return res.status(200).json({ message: 'Webhook recebido, mas nenhum dado para atualizar' });
    }

    updateValues.push(payment.id);
    const updateQuery = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    console.log(`💾 [WEBHOOK] Executando query de atualização:`);
    console.log(`💾 [WEBHOOK] Query:`, updateQuery);
    console.log(`💾 [WEBHOOK] Valores:`, updateValues);

    const updateResult = await pool.query(updateQuery, updateValues);
    console.log(`✅ [WEBHOOK] Query executada com sucesso!`);
    console.log(`✅ [WEBHOOK] Dados atualizados:`, JSON.stringify(updateResult.rows[0], null, 2));
    console.log(`✅ [WEBHOOK] Pagamento ${payment.id} atualizado com sucesso`);

    console.log(`═══════════════════════════════════════════════════════════`);
    console.log(`✅ [WEBHOOK] Webhook processado com sucesso - ${timestamp}`);
    console.log(`═══════════════════════════════════════════════════════════`);

    res.json({ success: true, message: 'Webhook processado com sucesso' });
  } catch (error) {
    console.error(`═══════════════════════════════════════════════════════════`);
    console.error(`❌ [WEBHOOK] ERRO ao processar webhook - ${timestamp}`);
    console.error(`❌ [WEBHOOK] Erro:`, error);
    console.error(`❌ [WEBHOOK] Stack trace:`, error.stack);
    console.error(`❌ [WEBHOOK] Payload que causou o erro:`, JSON.stringify(req.body, null, 2));
    console.error(`═══════════════════════════════════════════════════════════`);
    res.status(500).json({ error: 'Erro ao processar webhook', message: error.message });
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

    // Se já tem charge_id, buscar dados atualizados da invoice
    if (payment.ciabra_charge_id) {
      console.log(`📥 [ciabra/charges] Buscando dados atualizados da invoice: ${payment.ciabra_charge_id}`);
      try {
        const chargeData = await getChargeStatus(payment.ciabra_charge_id);
        console.log(`✅ [ciabra/charges] Dados da invoice recebidos:`, JSON.stringify(chargeData, null, 2));
        
        // Buscar dados completos do PIX/Boleto usando o endpoint de installments
        const installments = chargeData.installments || [];
        const firstInstallment = installments[0];
        const installmentId = firstInstallment?.id;
        
        let pixQrCode = payment.ciabra_pix_qr_code;
        let pixQrCodeUrl = payment.ciabra_pix_qr_code_url;
        let boletoUrl = payment.ciabra_boleto_url;
        let paymentUrl = payment.ciabra_payment_url || chargeData.url;
        
        // Se temos o installmentId, buscar dados atualizados do PIX/Boleto
        if (installmentId) {
          try {
            const { getInstallmentPayments } = await import('../services/ciabra.js');
            const installmentData = await getInstallmentPayments(installmentId);
            console.log(`✅ [ciabra/charges] Dados do installment recebidos:`, JSON.stringify(installmentData, null, 2));
            
            // Atualizar dados do PIX
            if (installmentData.pix) {
              pixQrCode = installmentData.pix.emv || installmentData.pix.qrCode || installmentData.pix.code || pixQrCode;
              pixQrCodeUrl = installmentData.pix.location || installmentData.pix.qrCodeUrl || installmentData.pix.url || pixQrCodeUrl;
            }
            
            // Atualizar dados do Boleto
            if (installmentData.boleto) {
              boletoUrl = installmentData.boleto.url || installmentData.boleto.link || boletoUrl;
            }
            
            // Atualizar no banco se os dados mudaram
            if (pixQrCode !== payment.ciabra_pix_qr_code || 
                pixQrCodeUrl !== payment.ciabra_pix_qr_code_url || 
                boletoUrl !== payment.ciabra_boleto_url ||
                paymentUrl !== payment.ciabra_payment_url) {
              await pool.query(
                `UPDATE payments 
                 SET ciabra_pix_qr_code = $1,
                     ciabra_pix_qr_code_url = $2,
                     ciabra_boleto_url = $3,
                     ciabra_payment_url = $4,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $5`,
                [pixQrCode, pixQrCodeUrl, boletoUrl, paymentUrl, payment.id]
              );
              console.log(`✅ [ciabra/charges] Dados do PIX/Boleto atualizados no banco`);
            }
          } catch (installmentError) {
            console.warn('⚠️ [ciabra/charges] Não foi possível buscar dados do installment:', installmentError.message);
            // Continuar com os dados que já temos no banco
          }
        }
        
        return res.json({
          charge: chargeData,
          payment: {
            id: payment.id,
            amount: payment.amount,
            due_date: payment.due_date,
            status: payment.status,
            ciabra_charge_id: payment.ciabra_charge_id,
            ciabra_pix_qr_code: pixQrCode,
            ciabra_pix_qr_code_url: pixQrCodeUrl,
            ciabra_boleto_url: boletoUrl,
            payment_url: paymentUrl,
            installment_id: installmentId,
          },
        });
      } catch (error) {
        console.error('❌ [ciabra/charges] Erro ao buscar dados da invoice:', error);
        // Se der erro ao buscar, retornar os dados que temos no banco
        return res.json({
          charge: null,
          payment: {
            id: payment.id,
            ciabra_charge_id: payment.ciabra_charge_id,
            ciabra_pix_qr_code: payment.ciabra_pix_qr_code,
            ciabra_pix_qr_code_url: payment.ciabra_pix_qr_code_url,
            boleto_url: payment.ciabra_boleto_url,
            payment_url: payment.ciabra_payment_url,
          },
          error: 'Não foi possível buscar dados atualizados da invoice',
        });
      }
    }

    // Criar cobrança no Ciabra
    // Formatar data de forma simples para a descrição
    const dueDateFormatted = new Date(payment.due_date).toLocaleDateString('pt-BR');
    
    // IMPORTANTE: Verificar se o usuário tem CPF antes de criar cobrança
    // O Ciabra exige CPF para criar cliente e invoice
    if (!payment.cpf || payment.cpf.trim().length < 11) {
      return res.status(400).json({ 
        error: 'CPF é obrigatório para gerar cobranças. Por favor, preencha o CPF no seu perfil antes de gerar cobranças.',
        code: 'CPF_REQUIRED'
      });
    }

    // IMPORTANTE: Buscar o ciabra_customer_id mais recente do banco ANTES de criar a invoice
    // Isso evita criar múltiplos clientes
    const userCheckResult = await pool.query(
      `SELECT ciabra_customer_id FROM users WHERE id = $1`,
      [userId]
    );
    const customerIdFromDb = userCheckResult.rows[0]?.ciabra_customer_id || payment.ciabraCustomerId || null;
    
    console.log(`🔍 [ciabra/charges] ciabra_customer_id do banco: ${customerIdFromDb || 'não encontrado'}`);
    console.log(`🔍 [ciabra/charges] CPF do usuário: ${payment.cpf ? payment.cpf.replace(/\D/g, '').substring(0, 3) + '***' : 'NÃO FORNECIDO'}`);
    
    // Passar o ciabra_customer_id para o createCharge, que vai criar o cliente se necessário
    // e retornar o customerId na resposta para salvarmos no banco
    const chargeData = await createCharge({
      amount: parseFloat(payment.amount),
      due_date: payment.due_date,
      description: `Contribuição mensal - ${dueDateFormatted}`,
      customer: {
        name: payment.name,
        email: payment.email,
        document: payment.cpf.replace(/\D/g, ''), // Garantir que está limpo (apenas números)
        phone: payment.phone,
        ciabraCustomerId: customerIdFromDb, // Passar o ID do banco para reutilizar
        address: payment.address,
        city: payment.city,
        state: payment.state,
        zipCode: payment.zip_code,
      },
      payment_method,
      externalId: payment.id.toString(), // ID do nosso pagamento
      userId: userId, // Para salvar o ciabra_customer_id após criar
    });
    
    // IMPORTANTE: Salvar o ciabra_customer_id no banco APÓS criar a invoice
    // Isso garante que sempre temos o ID salvo, mesmo se o cliente foi criado agora
    if (chargeData.customerId && userId) {
      await pool.query(
        `UPDATE users 
         SET ciabra_customer_id = $1
         WHERE id = $2 AND (ciabra_customer_id IS NULL OR ciabra_customer_id != $1)`,
        [chargeData.customerId, userId]
      );
      console.log(`✅ Salvo ciabra_customer_id ${chargeData.customerId} para usuário ${userId} (após criar invoice)`);
    }

    console.log('📋 [ciabra/charges] Resposta da invoice criada:', JSON.stringify(chargeData, null, 2));
    
    // Verificar se é uma resposta parcial (erro 500 mas invoice pode ter sido criada)
    if (chargeData._partial) {
      console.warn('⚠️ [ciabra/charges] Resposta parcial recebida. Invoice pode ter sido criada no Ciabra.');
      console.warn(`⚠️ [ciabra/charges] O webhook vai atualizar os dados quando a invoice for processada.`);
      
      // Retornar resposta indicando que a cobrança foi gerada
      // O webhook vai atualizar os dados depois
      res.json({
        message: 'Cobrança gerada com sucesso',
        info: 'A cobrança foi gerada no Ciabra. Os dados do PIX/Boleto serão atualizados automaticamente via webhook. Você pode clicar em "Gerar QR Code" para buscar os dados atualizados.',
        charge: chargeData,
        payment: {
          id: payment.id,
          amount: payment.amount,
          due_date: payment.due_date,
          status: payment.status,
          ciabra_charge_id: null, // Será atualizado pelo webhook
          ciabra_pix_qr_code: null,
          ciabra_pix_qr_code_url: null,
          ciabra_boleto_url: null,
          payment_url: null,
          installment_id: null,
        },
        pending: true, // Flag indicando que os dados ainda não estão disponíveis
      });
      return;
    }
    
    // Se temos o ID da invoice, salvar imediatamente
    // Os dados do PIX/Boleto serão buscados quando o usuário clicar em "Gerar QR Code"
    // ou atualizados pelo webhook
    if (chargeData.id) {
      await pool.query(
        `UPDATE payments 
         SET ciabra_charge_id = $1,
             ciabra_payment_url = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [
          chargeData.id,
          chargeData.url || null,
          payment.id,
        ]
      );
      console.log(`✅ Salvo ciabra_charge_id ${chargeData.id} para pagamento ${payment.id}`);
    }

    // Retornar resposta indicando que a cobrança foi gerada
    // Os dados do PIX/Boleto serão buscados quando necessário ou atualizados pelo webhook
    res.json({
      message: 'Cobrança gerada com sucesso',
      info: 'A cobrança foi gerada no Ciabra. Clique em "Gerar QR Code" para obter os dados do PIX/Boleto, ou aguarde o webhook atualizar automaticamente.',
      charge: chargeData,
      payment: {
        id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status,
        ciabra_charge_id: chargeData.id,
        ciabra_pix_qr_code: null, // Será buscado quando necessário
        ciabra_pix_qr_code_url: null,
        ciabra_boleto_url: null,
        payment_url: chargeData.url || null,
        installment_id: chargeData.installments?.[0]?.id || null,
      },
      pending: !chargeData.installments || chargeData.installments.length === 0, // Flag indicando se precisa buscar dados
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

/**
 * Buscar dados atualizados do PIX/Boleto de uma cobrança
 * GET /api/ciabra/charges/:payment_id/payment-data
 * Busca os dados atualizados do PIX/Boleto usando o ciabra_charge_id salvo no banco
 */
router.get('/charges/:payment_id/payment-data', authenticateToken, async (req, res) => {
  try {
    const { payment_id } = req.params;
    const userId = req.user.id;

    console.log(`📥 [ciabra/payment-data] Buscando dados de pagamento para payment_id: ${payment_id}`);

    // Buscar o pagamento e verificar se tem ciabra_charge_id
    const paymentResult = await pool.query(
      `SELECT p.*, u.ciabra_customer_id
       FROM payments p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = $1 AND p.user_id = $2`,
      [payment_id, userId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pagamento não encontrado' });
    }

    const payment = paymentResult.rows[0];

    if (!payment.ciabra_charge_id) {
      return res.status(400).json({ 
        error: 'Cobrança ainda não foi criada no Ciabra. Gere a cobrança primeiro.' 
      });
    }

    console.log(`📥 [ciabra/payment-data] Buscando dados da invoice: ${payment.ciabra_charge_id}`);

    // Buscar dados atualizados da invoice
    const { getInvoiceDetails, getInstallmentPayments } = await import('../services/ciabra.js');
    const chargeData = await getInvoiceDetails(payment.ciabra_charge_id);
    
    console.log(`✅ [ciabra/payment-data] Dados da invoice recebidos:`, JSON.stringify(chargeData, null, 2));

    // Buscar dados completos do PIX/Boleto usando o endpoint de installments
    const installments = chargeData.installments || [];
    const firstInstallment = installments[0];
    const installmentId = firstInstallment?.id;

    let pixQrCode = payment.ciabra_pix_qr_code;
    let pixQrCodeUrl = payment.ciabra_pix_qr_code_url;
    let boletoUrl = payment.ciabra_boleto_url;
    let paymentUrl = payment.ciabra_payment_url || chargeData.url;

    if (installmentId) {
      try {
        console.log(`📥 [ciabra/payment-data] Buscando dados do installment: ${installmentId}`);
        const installmentData = await getInstallmentPayments(installmentId);
        console.log(`✅ [ciabra/payment-data] Dados do installment recebidos:`, JSON.stringify(installmentData, null, 2));

        // Extrair dados do PIX
        if (installmentData.pix) {
          pixQrCode = installmentData.pix.emv || installmentData.pix.qrCode || installmentData.pix.code;
          pixQrCodeUrl = installmentData.pix.location || installmentData.pix.qrCodeUrl || installmentData.pix.url;
          console.log(`✅ [ciabra/payment-data] PIX encontrado - EMV: ${pixQrCode ? pixQrCode.substring(0, 50) + '...' : 'não encontrado'}`);
        }

        // Extrair dados do Boleto
        if (installmentData.boleto) {
          boletoUrl = installmentData.boleto.url || installmentData.boleto.link;
          console.log(`✅ [ciabra/payment-data] Boleto encontrado - URL: ${boletoUrl || 'não encontrado'}`);
        }

        // Atualizar no banco
        await pool.query(
          `UPDATE payments 
           SET ciabra_pix_qr_code = $1,
               ciabra_pix_qr_code_url = $2,
               ciabra_boleto_url = $3,
               ciabra_payment_url = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $5`,
          [pixQrCode, pixQrCodeUrl, boletoUrl, paymentUrl, payment.id]
        );
        console.log(`✅ [ciabra/payment-data] Dados do PIX/Boleto atualizados no banco`);
      } catch (error) {
        console.warn('⚠️ [ciabra/payment-data] Não foi possível buscar dados do installment:', error.message);
        // Continuar com os dados que já temos no banco
      }
    } else {
      console.warn('⚠️ [ciabra/payment-data] InstallmentId não encontrado na resposta da invoice');
    }

    // Retornar dados atualizados
    res.json({
      message: 'Dados de pagamento atualizados',
      payment: {
        id: payment.id,
        amount: payment.amount,
        due_date: payment.due_date,
        status: payment.status,
        ciabra_charge_id: payment.ciabra_charge_id,
        ciabra_pix_qr_code: pixQrCode,
        ciabra_pix_qr_code_url: pixQrCodeUrl,
        ciabra_boleto_url: boletoUrl,
        payment_url: paymentUrl,
        installment_id: installmentId,
      },
    });
  } catch (error) {
    console.error('❌ [ciabra/payment-data] Erro ao buscar dados de pagamento:', error);
    res.status(500).json({ error: error.message || 'Erro ao buscar dados de pagamento' });
  }
});

export default router;
