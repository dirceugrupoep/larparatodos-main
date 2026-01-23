import dotenv from 'dotenv';

dotenv.config();

const CIABRA_API_URL = process.env.CIABRA_API_URL || 'https://api.az.center';
const CIABRA_CLIENT_ID = process.env.CIABRA_CLIENT_ID;
const CIABRA_CLIENT_SECRET = process.env.CIABRA_CLIENT_SECRET;

/**
 * Gera o token de autenticação Basic (Base64)
 * Formato: Basic {base64(public:private)}
 */
function getAuthToken() {
  if (!CIABRA_CLIENT_ID || !CIABRA_CLIENT_SECRET) {
    throw new Error('Credenciais do Ciabra não configuradas');
  }

  // Combinar chave pública e privada no formato public:private
  const credentials = `${CIABRA_CLIENT_ID}:${CIABRA_CLIENT_SECRET}`;
  
  // Codificar em Base64
  const token = Buffer.from(credentials).toString('base64');
  
  return `Basic ${token}`;
}

/**
 * Verifica se as credenciais são válidas
 * GET /auth/applications/check
 */
export async function checkCredentials() {
  try {
    const authToken = getAuthToken();
    
    const response = await fetch(`${CIABRA_API_URL}/auth/applications/check`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao verificar credenciais: ${error}`);
    }

    const data = await response.json();
    console.log('✅ Credenciais do Ciabra validadas:', data);
    return data;
  } catch (error) {
    console.error('❌ Erro ao verificar credenciais do Ciabra:', error);
    throw error;
  }
}

/**
 * Cria ou busca um cliente no Ciabra
 * POST /invoices/applications/customers
 */
export async function createOrGetCustomer(customerData) {
  try {
    const authToken = getAuthToken();
    
    // Primeiro, tentar buscar cliente existente pelo documento
    // (A API pode não ter endpoint de busca, então criamos sempre)
    
    const payload = {
      fullName: customerData.name,
      document: customerData.document?.replace(/\D/g, ''), // Remove formatação
      email: customerData.email || undefined,
      phone: customerData.phone ? `+55${customerData.phone.replace(/\D/g, '')}` : undefined,
    };

    // Remover campos undefined
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const response = await fetch(`${CIABRA_API_URL}/invoices/applications/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro ao criar cliente no Ciabra:', error);
      throw new Error(`Erro ao criar cliente: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar/buscar cliente:', error);
    throw error;
  }
}

/**
 * Cria uma cobrança (invoice) no Ciabra
 * POST /invoices/applications/invoices
 * @param {Object} invoiceData - Dados da cobrança
 * @param {string} invoiceData.customerId - ID do cliente no Ciabra
 * @param {number} invoiceData.price - Valor em reais (não centavos)
 * @param {string} invoiceData.dueDate - Data de vencimento (ISO 8601)
 * @param {string} invoiceData.description - Descrição da cobrança
 * @param {string} invoiceData.externalId - ID externo (nosso payment_id)
 * @param {Array<string>} invoiceData.paymentTypes - ['PIX'] ou ['BOLETO'] ou ['PIX', 'BOLETO']
 * @returns {Promise<Object>} Dados da cobrança criada
 */
export async function createInvoice(invoiceData) {
  try {
    const authToken = getAuthToken();
    
    // URL do webhook
    const webhookUrl = process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
      ? `https://${process.env.DOMAIN}/api/ciabra/webhook`
      : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
        ? `${process.env.FRONTEND_URL}/api/ciabra/webhook`
        : 'https://larparatodoshabitacional.com.br/api/ciabra/webhook');

    const payload = {
      customerId: invoiceData.customerId,
      description: invoiceData.description || 'Contribuição mensal - Larparatodos',
      dueDate: invoiceData.dueDate, // ISO 8601 format
      installmentCount: 1,
      invoiceType: 'SINGLE',
      items: [
        {
          description: invoiceData.description || 'Contribuição mensal - Larparatodos',
          quantity: 1,
          price: invoiceData.price, // Valor em reais (não centavos)
        }
      ],
      price: invoiceData.price, // Valor em reais (não centavos)
      externalId: invoiceData.externalId?.toString() || undefined,
      paymentTypes: invoiceData.paymentTypes || ['PIX'], // ['PIX'] ou ['BOLETO'] ou ['PIX', 'BOLETO']
      webhooks: [
        {
          hookType: 'INVOICE_CREATED',
          url: webhookUrl,
        },
        {
          hookType: 'INVOICE_DELETED',
          url: webhookUrl,
        },
        {
          hookType: 'PAYMENT_GENERATED',
          url: webhookUrl,
        },
        {
          hookType: 'PAYMENT_CONFIRMED',
          url: webhookUrl,
        },
      ],
    };

    // Remover campos undefined
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    console.log(`📤 Criando invoice no Ciabra para cliente ${invoiceData.customerId}`);
    console.log(`📋 Payload enviado:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${CIABRA_API_URL}/invoices/applications/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      console.error('❌ Erro ao criar invoice no Ciabra:', errorData);
      console.error('📋 Status:', response.status, response.statusText);
      console.error('📋 Headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Erro ao criar invoice: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ Invoice criado com sucesso:', data.id);
    return data;
  } catch (error) {
    console.error('Erro ao criar invoice:', error);
    throw error;
  }
}

/**
 * Consulta os detalhes de uma invoice
 * GET /invoices/applications/invoices/:id
 * @param {string} invoiceId - ID da invoice no Ciabra
 * @returns {Promise<Object>} Dados da invoice
 */
export async function getInvoiceDetails(invoiceId) {
  try {
    const authToken = getAuthToken();

    const response = await fetch(`${CIABRA_API_URL}/invoices/applications/invoices/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao consultar invoice: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar invoice:', error);
    throw error;
  }
}

/**
 * Consulta os pagamentos de uma parcela (installment)
 * GET /payments/applications/installments/:installment_id
 * @param {string} installmentId - ID da parcela
 * @returns {Promise<Object>} Dados dos pagamentos
 */
export async function getInstallmentPayments(installmentId) {
  try {
    const authToken = getAuthToken();

    const response = await fetch(`${CIABRA_API_URL}/payments/applications/installments/${installmentId}`, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao consultar pagamentos: ${error}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao consultar pagamentos:', error);
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
  // O Ciabra menciona que cada webhook inclui um cabeçalho de assinatura
  // Por enquanto, logamos e aceitamos (implementar validação se necessário)
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

  // Tipos de eventos do Ciabra:
  // INVOICE_CREATED, INVOICE_DELETED, PAYMENT_GENERATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_REFUNDED
  const eventType = webhookData.hookType || webhookData.event || webhookData.type || 'UNKNOWN';
  
  // Extrair dados da invoice/pagamento
  const invoiceData = webhookData.invoice || webhookData.data || webhookData;
  const paymentData = webhookData.payment || webhookData.data || webhookData;
  
  console.log(`🔍 Identificado evento: ${eventType}`);

  // Extrair ID da invoice (pode estar em diferentes lugares)
  const invoiceId = invoiceData.id || invoiceData.invoiceId || webhookData.invoiceId || webhookData.id;
  
  // Extrair dados do pagamento se disponível
  const paymentId = paymentData.id || paymentData.paymentId || invoiceData.paymentId;

  return {
    eventType, // Tipo de evento (INVOICE_CREATED, PAYMENT_CONFIRMED, etc)
    invoiceId, // ID da invoice no Ciabra
    paymentId, // ID do pagamento (se disponível)
    chargeId: invoiceId, // Alias para compatibilidade
    status: statusMap[invoiceData.status] || statusMap[paymentData?.status] || invoiceData.status || 'pending',
    paidAt: paymentData?.paidAt || paymentData?.paid_at || paymentData?.confirmedAt || invoiceData.paidAt || invoiceData.paid_at,
    amount: invoiceData.price || paymentData?.amount || invoiceData.amount,
    pixQrCode: paymentData?.pix?.qrCode || paymentData?.pix?.qr_code || paymentData?.pixCode || invoiceData.pix?.qrCode,
    pixQrCodeUrl: paymentData?.pix?.qrCodeUrl || paymentData?.pix?.qr_code_url || paymentData?.pixUrl || invoiceData.pix?.qrCodeUrl,
    boletoUrl: paymentData?.boleto?.url || paymentData?.boletoUrl || invoiceData.boleto?.url,
    externalId: invoiceData.externalId || webhookData.externalId, // ID externo (nosso payment_id)
  };
}

/**
 * Função auxiliar para criar cobrança completa (cliente + invoice)
 * Esta função é usada pela rota /api/ciabra/charges
 */
export async function createCharge(chargeData) {
  try {
    // 1. Criar ou buscar cliente
    const customer = await createOrGetCustomer(chargeData.customer);
    
    // 2. Criar invoice
    const invoice = await createInvoice({
      customerId: customer.id,
      price: chargeData.amount, // Valor em reais
      dueDate: new Date(chargeData.due_date).toISOString(), // Converter para ISO 8601
      description: chargeData.description || 'Contribuição mensal - Larparatodos',
      externalId: chargeData.externalId?.toString(),
      paymentTypes: chargeData.payment_method === 'boleto' ? ['BOLETO'] : ['PIX'],
    });

    return invoice;
  } catch (error) {
    console.error('Erro ao criar cobrança completa:', error);
    throw error;
  }
}

/**
 * Função auxiliar para consultar status (compatibilidade)
 */
export async function getChargeStatus(chargeId) {
  try {
    const invoice = await getInvoiceDetails(chargeId);
    return invoice;
  } catch (error) {
    console.error('Erro ao consultar status:', error);
    throw error;
  }
}
