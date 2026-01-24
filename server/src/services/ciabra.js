import dotenv from 'dotenv';

dotenv.config();

const CIABRA_API_URL = process.env.CIABRA_API_URL || 'https://api.az.center';
const CIABRA_CLIENT_ID = process.env.CIABRA_CLIENT_ID;
const CIABRA_CLIENT_SECRET = process.env.CIABRA_CLIENT_SECRET;

/**
 * Token de autenticação Basic fixo (fornecido pelo usuário)
 * IMPORTANTE: Hoje estamos usando o token já gerado manualmente (como no Insomnia).
 * No futuro, podemos voltar a gerar via CIABRA_CLIENT_ID/CIABRA_CLIENT_SECRET.
 */
function getAuthToken() {
  return 'Basic NTA3ZDE2YWY2MzE0M2ExNzAzMzI4ZTEyMTExZjVhOGRkMTY3OTkyZGQyYWQyNTQyMWRjNzozYTkxMDVlZDc4NWM5N2E2YWMwZg==';
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
 * @param {Object} customerData - Dados do cliente
 * @param {string} customerData.name - Nome completo
 * @param {string} customerData.document - CPF/CNPJ
 * @param {string} customerData.email - Email
 * @param {string} customerData.phone - Telefone
 * @param {string} customerData.ciabraCustomerId - ID do cliente no Ciabra (se já existe)
 * @param {string} [customerData.address] - Endereço (rua + número)
 * @param {string} [customerData.city] - Cidade
 * @param {string} [customerData.state] - UF
 * @param {string} [customerData.zipCode] - CEP
 * @returns {Promise<Object>} Dados do cliente no Ciabra
 */
export async function createOrGetCustomer(customerData) {
  try {
    console.log('🔵 [createOrGetCustomer] Iniciando criação/busca de cliente');
    console.log('🔵 [createOrGetCustomer] Dados recebidos:', JSON.stringify(customerData, null, 2));
    
    // Se já temos o ID do cliente no Ciabra, retornar direto (sem fazer chamada)
    if (customerData.ciabraCustomerId) {
      console.log(`✅ [createOrGetCustomer] Cliente já existe no Ciabra: ${customerData.ciabraCustomerId}`);
      console.log(`✅ [createOrGetCustomer] Retornando cliente existente sem chamada à API`);
      return { id: customerData.ciabraCustomerId };
    }

    console.log('🔵 [createOrGetCustomer] Cliente não existe ainda, criando novo cliente');
    const authToken = getAuthToken();
    console.log('🔵 [createOrGetCustomer] Token de autenticação obtido');

    // Endereço padrão caso o usuário ainda não tenha endereço completo cadastrado
    const defaultZip = '03318000';
    const defaultStreet = 'Rua Serra de Bragança, 124';
    const defaultNeighborhood = 'Vila Gomes Cardim';
    const defaultCity = 'São Paulo';
    const defaultState = 'SP';

    console.log('🔵 [createOrGetCustomer] Processando endereço...');
    const cleanZip = (customerData.zipCode || defaultZip).replace(/\D/g, '');
    const rawAddress = customerData.address || defaultStreet;
    const neighborhood = defaultNeighborhood;
    const city = customerData.city || defaultCity;
    const state = customerData.state || defaultState;
    console.log(`🔵 [createOrGetCustomer] CEP limpo: ${cleanZip}`);
    console.log(`🔵 [createOrGetCustomer] Endereço: ${rawAddress}`);
    console.log(`🔵 [createOrGetCustomer] Cidade: ${city}, Estado: ${state}`);

    // Montar objeto address no formato esperado pela API do Ciabra
    const address = {
      street: rawAddress,
      number: rawAddress.match(/\d+/)?.[0] || 'SN',
      neighborhood,
      city,
      state,
      zipCode: cleanZip,
    };
    console.log('🔵 [createOrGetCustomer] Objeto address montado:', JSON.stringify(address, null, 2));

    console.log('🔵 [createOrGetCustomer] Processando dados do cliente...');
    const cleanDocument = customerData.document?.replace(/\D/g, '');
    const cleanPhone = customerData.phone ? `+55${customerData.phone.replace(/\D/g, '')}` : undefined;
    console.log(`🔵 [createOrGetCustomer] Documento limpo: ${cleanDocument}`);
    console.log(`🔵 [createOrGetCustomer] Telefone formatado: ${cleanPhone || 'não fornecido'}`);

    const payload = {
      fullName: customerData.name,
      document: cleanDocument,
      email: customerData.email || undefined,
      phone: cleanPhone,
      address,
    };

    console.log('🔵 [createOrGetCustomer] Payload inicial montado:', JSON.stringify(payload, null, 2));

    // Remover campos undefined/null
    console.log('🔵 [createOrGetCustomer] Removendo campos undefined/null...');
    Object.keys(payload).forEach((key) => {
      if (payload[key] === undefined || payload[key] === null) {
        console.log(`🔵 [createOrGetCustomer] Removendo campo vazio: ${key}`);
        delete payload[key];
      }
    });

    console.log(`📤 [createOrGetCustomer] Enviando requisição para criar cliente: ${payload.fullName} (${payload.document})`);
    console.log(`📤 [createOrGetCustomer] URL: ${CIABRA_API_URL}/invoices/applications/customers`);
    console.log(`📤 [createOrGetCustomer] Payload final:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${CIABRA_API_URL}/invoices/applications/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    console.log(`🔵 [createOrGetCustomer] Resposta recebida - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ [createOrGetCustomer] Erro ao criar cliente no Ciabra:', error);
      console.error(`❌ [createOrGetCustomer] Status HTTP: ${response.status}`);
      throw new Error(`Erro ao criar cliente: ${error}`);
    }

    const data = await response.json();
    console.log(`✅ [createOrGetCustomer] Cliente criado com sucesso!`);
    console.log(`✅ [createOrGetCustomer] ID do cliente: ${data.id}`);
    console.log(`✅ [createOrGetCustomer] Dados completos:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ [createOrGetCustomer] Erro ao criar/buscar cliente:', error);
    console.error('❌ [createOrGetCustomer] Stack trace:', error.stack);
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
 * @param {Array<string|{type: string}>|string|{type: string}} invoiceData.paymentTypes - 'PIX' | 'BOLETO' ou array/objetos
 * @returns {Promise<Object>} Dados da cobrança criada
 */
export async function createInvoice(invoiceData) {
  try {
    console.log('🟢 [createInvoice] Iniciando criação de invoice');
    console.log('🟢 [createInvoice] Dados recebidos:', JSON.stringify(invoiceData, null, 2));
    
    const authToken = getAuthToken();
    console.log('🟢 [createInvoice] Token de autenticação obtido');
    
    // URL do webhook
    console.log('🟢 [createInvoice] Determinando URL do webhook...');
    const webhookUrl = process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
      ? `https://${process.env.DOMAIN}/api/ciabra/webhook`
      : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
        ? `${process.env.FRONTEND_URL}/api/ciabra/webhook`
        : 'https://larparatodoshabitacional.com.br/api/ciabra/webhook');
    console.log(`🟢 [createInvoice] URL do webhook: ${webhookUrl}`);

    // Limpar e normalizar descrição (remover datas longas)
    console.log('🟢 [createInvoice] Processando descrição...');
    let cleanDescription = invoiceData.description || 'Contribuição mensal - Larparatodos';
    console.log(`🟢 [createInvoice] Descrição original: ${cleanDescription}`);
    // Se a descrição contém uma data longa, simplificar
    if (cleanDescription.includes('GMT') || cleanDescription.includes('Coordinated Universal Time')) {
      cleanDescription = 'Contribuição mensal - Larparatodos';
      console.log('🟢 [createInvoice] Descrição simplificada (continha data longa)');
    }
    // Limitar tamanho da descrição
    if (cleanDescription.length > 200) {
      cleanDescription = cleanDescription.substring(0, 197) + '...';
      console.log('🟢 [createInvoice] Descrição truncada para 200 caracteres');
    }
    console.log(`🟢 [createInvoice] Descrição final: ${cleanDescription}`);

    // Garantir que o preço é numérico e válido
    console.log('🟢 [createInvoice] Validando preço...');
    console.log(`🟢 [createInvoice] Preço recebido (tipo: ${typeof invoiceData.price}): ${invoiceData.price}`);
    const priceNumber = Number(invoiceData.price);
    console.log(`🟢 [createInvoice] Preço convertido para número: ${priceNumber}`);
    console.log(`🟢 [createInvoice] É finito? ${Number.isFinite(priceNumber)}`);
    console.log(`🟢 [createInvoice] É maior que zero? ${priceNumber > 0}`);
    
    if (!Number.isFinite(priceNumber) || priceNumber <= 0) {
      console.error(`❌ [createInvoice] Preço inválido: ${invoiceData.price} (convertido: ${priceNumber})`);
      throw new Error(`Valor de invoice inválido (price): ${invoiceData.price}`);
    }
    console.log(`✅ [createInvoice] Preço validado: R$ ${priceNumber.toFixed(2)}`);

    // Normalizar paymentTypes para o formato esperado pela API:
    // sempre array de strings: ['PIX'] ou ['BOLETO'] ou ['PIX', 'BOLETO']
    console.log('🟢 [createInvoice] Normalizando paymentTypes...');
    console.log(`🟢 [createInvoice] paymentTypes recebido:`, JSON.stringify(invoiceData.paymentTypes));
    const rawPaymentTypes =
      Array.isArray(invoiceData.paymentTypes)
        ? invoiceData.paymentTypes
        : (invoiceData.paymentTypes
          ? [invoiceData.paymentTypes]
          : ['PIX']);
    console.log(`🟢 [createInvoice] paymentTypes após normalização inicial:`, JSON.stringify(rawPaymentTypes));

    const normalizedPaymentTypes = rawPaymentTypes.map((pt, index) => {
      console.log(`🟢 [createInvoice] Processando paymentType[${index}]:`, JSON.stringify(pt), `(tipo: ${typeof pt})`);
      // Se for string, usar diretamente
      if (typeof pt === 'string') {
        const upperPt = pt.toUpperCase();
        if (upperPt !== 'PIX' && upperPt !== 'BOLETO') {
          console.error(`❌ [createInvoice] paymentType inválido (deve ser PIX ou BOLETO):`, pt);
          throw new Error(`paymentTypes inválido: ${pt}. Deve ser 'PIX' ou 'BOLETO'`);
        }
        console.log(`🟢 [createInvoice] String válida, mantendo: ${upperPt}`);
        return upperPt;
      }
      // Se já vier como objeto, extrair a propriedade type
      if (pt && typeof pt === 'object' && pt.type) {
        const upperPt = String(pt.type).toUpperCase();
        if (upperPt !== 'PIX' && upperPt !== 'BOLETO') {
          console.error(`❌ [createInvoice] paymentType inválido (deve ser PIX ou BOLETO):`, pt.type);
          throw new Error(`paymentTypes inválido: ${pt.type}. Deve ser 'PIX' ou 'BOLETO'`);
        }
        console.log(`🟢 [createInvoice] Extraído de objeto: ${upperPt}`);
        return upperPt;
      }
      console.error(`❌ [createInvoice] paymentType inválido:`, JSON.stringify(pt));
      throw new Error(`paymentTypes inválido: ${JSON.stringify(pt)}`);
    });
    console.log(`✅ [createInvoice] paymentTypes normalizado (array de strings):`, JSON.stringify(normalizedPaymentTypes));

    // Construir payload base (exatamente como funcionou no Insomnia)
    console.log('🟢 [createInvoice] Construindo payload base...');
    const payload = {
      customerId: invoiceData.customerId,
      description: cleanDescription,
      dueDate: invoiceData.dueDate, // ISO 8601 format
      installmentCount: 1,
      invoiceType: 'SINGLE',
      items: [], // Array vazio (como no Insomnia que funcionou)
      price: priceNumber, // Valor em reais (não centavos)
      paymentTypes: normalizedPaymentTypes,
      // Notifications exatamente como no Insomnia (3 itens, sem INVOICE_CONFIRM_PAYMENT)
      notifications: [
        { type: 'INVOICE_GENERATED', channel: 'Email' },
        { type: 'INVOICE_CHANGED', channel: 'Email' },
        { type: 'SEND_INVOICE_REMINDER', channel: 'Email', period: 5 }
      ],
    };
    console.log('🟢 [createInvoice] Payload base montado:', JSON.stringify(payload, null, 2));

    // Adicionar externalId apenas se fornecido e válido
    console.log('🟢 [createInvoice] Verificando externalId...');
    if (invoiceData.externalId && invoiceData.externalId.toString().trim()) {
      payload.externalId = invoiceData.externalId.toString().trim();
      console.log(`🟢 [createInvoice] externalId adicionado: ${payload.externalId}`);
    } else {
      console.log('🟢 [createInvoice] externalId não fornecido ou inválido, pulando');
    }

    // Adicionar redirectTo (como no Insomnia que funcionou)
    console.log('🟢 [createInvoice] Adicionando redirectTo...');
    const redirectUrl = process.env.DOMAIN && process.env.DOMAIN !== 'localhost'
      ? `https://${process.env.DOMAIN}`
      : (process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('localhost')
        ? process.env.FRONTEND_URL
        : 'https://larparatodoshabitacional.com.br');
    payload.redirectTo = redirectUrl;
    console.log(`🟢 [createInvoice] redirectTo adicionado: ${redirectUrl}`);

    // Adicionar webhooks apenas se a URL for válida
    console.log('🟢 [createInvoice] Verificando webhooks...');
    if (webhookUrl && webhookUrl.startsWith('http')) {
      payload.webhooks = [
        {
          hookType: 'INVOICE_CREATED',
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
      ];
      console.log(`🟢 [createInvoice] Webhooks adicionados:`, JSON.stringify(payload.webhooks, null, 2));
    } else {
      console.log('🟢 [createInvoice] URL do webhook inválida, pulando webhooks');
    }

    // Remover campos undefined (não deve ter nenhum agora, mas por segurança)
    console.log('🟢 [createInvoice] Removendo campos undefined/null...');
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null) {
        console.log(`🟢 [createInvoice] Removendo campo vazio: ${key}`);
        delete payload[key];
      }
    });

    console.log(`📤 [createInvoice] Enviando requisição para criar invoice`);
    console.log(`📤 [createInvoice] Cliente ID: ${invoiceData.customerId}`);
    console.log(`📤 [createInvoice] URL: ${CIABRA_API_URL}/invoices/applications/invoices`);
    console.log(`📤 [createInvoice] Payload final completo:`, JSON.stringify(payload, null, 2));

    const response = await fetch(`${CIABRA_API_URL}/invoices/applications/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    console.log(`🟢 [createInvoice] Resposta recebida - Status: ${response.status} ${response.statusText}`);
    console.log(`🟢 [createInvoice] Headers da resposta:`, JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [createInvoice] Erro ao criar invoice no Ciabra');
      console.error(`❌ [createInvoice] Status HTTP: ${response.status} ${response.statusText}`);
      console.error(`❌ [createInvoice] Corpo da resposta (texto):`, errorText);
      let errorData;
      try {
        errorData = JSON.parse(errorText);
        console.error(`❌ [createInvoice] Corpo da resposta (JSON):`, JSON.stringify(errorData, null, 2));
      } catch {
        errorData = errorText;
        console.error(`❌ [createInvoice] Não foi possível parsear como JSON`);
      }
      console.error('❌ [createInvoice] Headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Erro ao criar invoice: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('✅ [createInvoice] Invoice criado com sucesso!');
    console.log(`✅ [createInvoice] ID da invoice: ${data.id}`);
    console.log(`✅ [createInvoice] Dados completos da resposta:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ [createInvoice] Erro ao criar invoice:', error);
    console.error('❌ [createInvoice] Mensagem:', error.message);
    console.error('❌ [createInvoice] Stack trace:', error.stack);
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
    console.log('🟡 [getInvoiceDetails] Consultando detalhes da invoice');
    console.log(`🟡 [getInvoiceDetails] Invoice ID: ${invoiceId}`);
    
    const authToken = getAuthToken();
    console.log('🟡 [getInvoiceDetails] Token de autenticação obtido');

    const url = `${CIABRA_API_URL}/invoices/applications/invoices/${invoiceId}`;
    console.log(`🟡 [getInvoiceDetails] URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`🟡 [getInvoiceDetails] Resposta recebida - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ [getInvoiceDetails] Erro ao consultar invoice: ${error}`);
      console.error(`❌ [getInvoiceDetails] Status HTTP: ${response.status}`);
      throw new Error(`Erro ao consultar invoice: ${error}`);
    }

    const data = await response.json();
    console.log('✅ [getInvoiceDetails] Detalhes da invoice obtidos com sucesso');
    console.log(`✅ [getInvoiceDetails] Dados:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ [getInvoiceDetails] Erro ao consultar invoice:', error);
    console.error('❌ [getInvoiceDetails] Stack trace:', error.stack);
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
    console.log('🟠 [getInstallmentPayments] Consultando pagamentos da parcela');
    console.log(`🟠 [getInstallmentPayments] Installment ID: ${installmentId}`);
    
    const authToken = getAuthToken();
    console.log('🟠 [getInstallmentPayments] Token de autenticação obtido');

    const url = `${CIABRA_API_URL}/payments/applications/installments/${installmentId}`;
    console.log(`🟠 [getInstallmentPayments] URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': authToken,
      },
      signal: AbortSignal.timeout(10000),
    });

    console.log(`🟠 [getInstallmentPayments] Resposta recebida - Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ [getInstallmentPayments] Erro ao consultar pagamentos: ${error}`);
      console.error(`❌ [getInstallmentPayments] Status HTTP: ${response.status}`);
      throw new Error(`Erro ao consultar pagamentos: ${error}`);
    }

    const data = await response.json();
    console.log('✅ [getInstallmentPayments] Pagamentos obtidos com sucesso');
    console.log(`✅ [getInstallmentPayments] Dados:`, JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('❌ [getInstallmentPayments] Erro ao consultar pagamentos:', error);
    console.error('❌ [getInstallmentPayments] Stack trace:', error.stack);
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
 * @param {Object} chargeData - Dados da cobrança
 * @param {Object} chargeData.customer - Dados do cliente (pode incluir ciabraCustomerId)
 * @param {number} chargeData.amount - Valor em reais
 * @param {string} chargeData.due_date - Data de vencimento
 * @param {string} chargeData.description - Descrição
 * @param {string} chargeData.externalId - ID externo (nosso payment_id)
 * @param {string} chargeData.payment_method - Método de pagamento ('pix' ou 'boleto')
 * @returns {Promise<Object>} Dados da invoice criada
 */
export async function createCharge(chargeData) {
  try {
    console.log('🟣 [createCharge] ========================================');
    console.log('🟣 [createCharge] Iniciando criação de cobrança completa');
    console.log('🟣 [createCharge] Dados recebidos:', JSON.stringify(chargeData, null, 2));
    
    // Garantir que o valor é numérico e válido antes de chamar o Ciabra
    console.log('🟣 [createCharge] Validando valor da cobrança...');
    console.log(`🟣 [createCharge] Amount recebido (tipo: ${typeof chargeData.amount}): ${chargeData.amount}`);
    const amountNumber = Number(chargeData.amount);
    console.log(`🟣 [createCharge] Amount convertido para número: ${amountNumber}`);
    console.log(`🟣 [createCharge] É finito? ${Number.isFinite(amountNumber)}`);
    console.log(`🟣 [createCharge] É maior que zero? ${amountNumber > 0}`);
    
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      console.error(`❌ [createCharge] Valor de cobrança inválido: ${chargeData.amount} (convertido: ${amountNumber})`);
      throw new Error(`Valor de cobrança inválido (amount): ${chargeData.amount}`);
    }
    console.log(`✅ [createCharge] Valor validado: R$ ${amountNumber.toFixed(2)}`);

    // 1. Criar ou buscar cliente (reutiliza se já tiver ciabraCustomerId)
    console.log('🟣 [createCharge] ========================================');
    console.log('🟣 [createCharge] PASSO 1: Criando/buscando cliente no Ciabra');
    console.log('🟣 [createCharge] Dados do cliente:', JSON.stringify(chargeData.customer, null, 2));
    const customer = await createOrGetCustomer(chargeData.customer);
    console.log('🟣 [createCharge] Cliente obtido:', JSON.stringify(customer, null, 2));
    console.log(`🟣 [createCharge] Cliente ID: ${customer.id}`);
    
    // 2. Criar invoice
    console.log('🟣 [createCharge] ========================================');
    console.log('🟣 [createCharge] PASSO 2: Criando invoice no Ciabra');
    console.log('🟣 [createCharge] Processando data de vencimento...');
    const dueDate = new Date(chargeData.due_date);
    console.log(`🟣 [createCharge] Data de vencimento original: ${chargeData.due_date}`);
    console.log(`🟣 [createCharge] Data de vencimento parseada: ${dueDate.toISOString()}`);
    const dueDateISO = dueDate.toISOString();
    console.log(`🟣 [createCharge] Data de vencimento em ISO 8601: ${dueDateISO}`);
    
    const paymentMethod = chargeData.payment_method || 'pix';
    const paymentTypesArray = paymentMethod === 'boleto' ? ['BOLETO'] : ['PIX'];
    console.log(`🟣 [createCharge] Método de pagamento: ${paymentMethod}`);
    console.log(`🟣 [createCharge] Payment types:`, JSON.stringify(paymentTypesArray));
    
    const invoiceData = {
      customerId: customer.id,
      price: amountNumber, // Valor em reais
      dueDate: dueDateISO, // Converter para ISO 8601
      description: chargeData.description || 'Contribuição mensal - Larparatodos',
      externalId: chargeData.externalId?.toString(),
      paymentTypes: paymentTypesArray,
    };
    console.log('🟣 [createCharge] Dados da invoice a serem enviados:', JSON.stringify(invoiceData, null, 2));
    
    const invoice = await createInvoice(invoiceData);
    console.log('🟣 [createCharge] Invoice criada:', JSON.stringify(invoice, null, 2));

    // Adicionar customerId à resposta para salvar no banco
    invoice.customerId = customer.id;
    console.log('🟣 [createCharge] customerId adicionado à resposta da invoice');

    console.log('🟣 [createCharge] ========================================');
    console.log('✅ [createCharge] Cobrança completa criada com sucesso!');
    console.log('✅ [createCharge] Resposta final:', JSON.stringify(invoice, null, 2));
    console.log('🟣 [createCharge] ========================================');
    return invoice;
  } catch (error) {
    console.error('❌ [createCharge] ========================================');
    console.error('❌ [createCharge] Erro ao criar cobrança completa');
    console.error('❌ [createCharge] Mensagem:', error.message);
    console.error('❌ [createCharge] Stack trace:', error.stack);
    console.error('❌ [createCharge] ========================================');
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
