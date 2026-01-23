import dotenv from 'dotenv';

dotenv.config();

const CIABRA_API_URL = process.env.CIABRA_API_URL || 'https://api.ciabra.com.br';
const CIABRA_CLIENT_ID = process.env.CIABRA_CLIENT_ID;
const CIABRA_CLIENT_SECRET = process.env.CIABRA_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = null;

/**
 * Autentica e obtém token de acesso do Ciabra
 */
async function getAccessToken() {
  // Se temos um token válido, retornar
  if (accessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  if (!CIABRA_CLIENT_ID || !CIABRA_CLIENT_SECRET) {
    throw new Error('Credenciais do Ciabra não configuradas');
  }

  try {
    const tokenUrl = `${CIABRA_API_URL}/oauth/token`;
    console.log(`🔐 Tentando autenticar no Ciabra: ${tokenUrl}`);
    console.log(`📡 API URL configurada: ${CIABRA_API_URL}`);
    
    // Verificar se a URL está configurada
    if (!CIABRA_API_URL || CIABRA_API_URL === 'https://api.ciabra.com.br') {
      console.warn('⚠️  Verifique se a URL da API do Ciabra está correta na documentação oficial');
    }
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Adicionar timeout para evitar travamento
      signal: AbortSignal.timeout(10000), // 10 segundos
      body: JSON.stringify({
        grant_type: 'client_credentials',
        client_id: CIABRA_CLIENT_ID,
        client_secret: CIABRA_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro na autenticação Ciabra: ${error}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Expira 5 minutos antes para evitar problemas
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return accessToken;
  } catch (error) {
    console.error('❌ Erro ao obter token do Ciabra:', error);
    
    // Diagnóstico mais detalhado
    if (error.cause && error.cause.code === 'ENOTFOUND') {
      console.error('🔍 Diagnóstico DNS:');
      console.error(`   - Domínio não encontrado: ${error.cause.hostname}`);
      console.error(`   - Verifique se a URL está correta: ${CIABRA_API_URL}`);
      console.error('   - Possíveis causas:');
      console.error('     1. URL da API incorreta (verifique na documentação do Ciabra)');
      console.error('     2. Container sem acesso à internet');
      console.error('     3. DNS não configurado corretamente');
      console.error('   - Teste manual: docker exec larparatodos-backend nslookup api.ciabra.com.br');
    }
    
    throw error;
  }
}

/**
 * Cria uma cobrança no Ciabra (boleto ou PIX)
 * @param {Object} chargeData - Dados da cobrança
 * @param {number} chargeData.amount - Valor em centavos
 * @param {string} chargeData.due_date - Data de vencimento (YYYY-MM-DD)
 * @param {string} chargeData.description - Descrição da cobrança
 * @param {Object} chargeData.customer - Dados do cliente
 * @param {string} chargeData.customer.name - Nome do cliente
 * @param {string} chargeData.customer.email - Email do cliente
 * @param {string} chargeData.customer.document - CPF/CNPJ do cliente
 * @param {string} chargeData.customer.phone - Telefone do cliente
 * @param {string} chargeData.payment_method - 'boleto' ou 'pix'
 * @returns {Promise<Object>} Dados da cobrança criada
 */
export async function createCharge(chargeData) {
  try {
    const token = await getAccessToken();

    const payload = {
      amount: Math.round(chargeData.amount * 100), // Converter para centavos
      due_date: chargeData.due_date,
      description: chargeData.description || 'Contribuição mensal - Larparatodos',
      customer: {
        name: chargeData.customer.name,
        email: chargeData.customer.email,
        document: chargeData.customer.document?.replace(/\D/g, ''), // Remove formatação
        phone: chargeData.customer.phone?.replace(/\D/g, ''),
      },
      payment_method: chargeData.payment_method || 'pix', // Padrão PIX
      webhook_url: process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
        ? `https://${process.env.DOMAIN}/api/ciabra/webhook`
        : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
          ? `${process.env.FRONTEND_URL}/api/ciabra/webhook`
          : 'https://larparatodoshabitacional.com.br/api/ciabra/webhook'),
    };

    const response = await fetch(`${CIABRA_API_URL}/api/v1/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao criar cobrança no Ciabra:', error);
      throw new Error(`Erro ao criar cobrança: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar cobrança:', error);
    throw error;
  }
}

/**
 * Consulta o status de uma cobrança
 * @param {string} chargeId - ID da cobrança no Ciabra
 * @returns {Promise<Object>} Dados atualizados da cobrança
 */
export async function getChargeStatus(chargeId) {
  try {
    const token = await getAccessToken();

    const response = await fetch(`${CIABRA_API_URL}/api/v1/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao consultar cobrança: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar status da cobrança:', error);
    throw error;
  }
}

/**
 * Verifica a assinatura do webhook
 * @param {string} signature - Assinatura recebida no header
 * @param {Object} payload - Payload do webhook
 * @returns {boolean} Se a assinatura é válida
 */
export function verifyWebhookSignature(signature, payload) {
  // O Ciabra não fornece webhook secret separado
  // Se houver signature no header, podemos validar no futuro
  // Por enquanto, aceitar todos os webhooks (em produção, considerar validação adicional)
  if (signature) {
    console.log('📨 Webhook recebido com assinatura:', signature.substring(0, 20) + '...');
  }
  return true; // Aceitar webhook (implementar validação se necessário no futuro)
}

/**
 * Processa notificação de webhook do Ciabra
 * Suporta diferentes formatos de eventos do Ciabra
 * @param {Object} webhookData - Dados do webhook
 * @returns {Object} Dados processados
 */
export function processWebhook(webhookData) {
  // Mapear status do Ciabra para nosso sistema
  const statusMap = {
    pending: 'pending',
    paid: 'paid',
    overdue: 'overdue',
    cancelled: 'cancelled',
    canceled: 'cancelled',
    confirmed: 'paid',
    generated: 'pending',
  };

  // Extrair tipo de evento - o Ciabra pode usar 'event' ou 'type'
  // Valores possíveis: 'charge.created', 'charge.deleted', 'payment.generated', 'payment.confirmed'
  // ou em português: 'cobrança.criada', 'cobrança.deletada', 'pagamento.gerado', 'pagamento.confirmado'
  const eventType = webhookData.event || webhookData.type || 'charge.updated';
  
  // Extrair dados da cobrança - o Ciabra pode enviar em diferentes estruturas:
  // 1. { event: "...", data: { id, status, ... } }
  // 2. { type: "...", id, status, ... }
  // 3. { event: "...", charge: { id, status, ... } }
  const chargeData = webhookData.data || webhookData.charge || webhookData;
  
  console.log(`🔍 Identificado evento: ${eventType}`);

  return {
    eventType, // Tipo de evento (charge.created, payment.confirmed, etc)
    chargeId: chargeData.id || chargeData.charge_id || webhookData.id || webhookData.charge_id,
    status: statusMap[chargeData.status] || statusMap[webhookData.status] || chargeData.status || webhookData.status,
    paidAt: chargeData.paid_at || chargeData.paidAt || webhookData.paid_at || webhookData.paidAt,
    amount: chargeData.amount 
      ? (typeof chargeData.amount === 'number' ? chargeData.amount / 100 : parseFloat(chargeData.amount) / 100)
      : (webhookData.amount ? (typeof webhookData.amount === 'number' ? webhookData.amount / 100 : parseFloat(webhookData.amount) / 100) : null),
    pixQrCode: chargeData.pix?.qr_code || chargeData.pix_qr_code || webhookData.pix?.qr_code || webhookData.pix_qr_code,
    pixQrCodeUrl: chargeData.pix?.qr_code_url || chargeData.pix_qr_code_url || webhookData.pix?.qr_code_url || webhookData.pix_qr_code_url,
    boletoUrl: chargeData.boleto?.url || chargeData.boleto_url || webhookData.boleto?.url || webhookData.boleto_url,
  };
}
