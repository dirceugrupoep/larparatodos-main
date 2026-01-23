# 🔄 Atualização - API do Ciabra

## ✅ Mudanças Aplicadas

A integração com o Ciabra foi **completamente reescrita** para usar a API correta conforme a documentação oficial.

---

## 🔄 Principais Mudanças

### 1. **Autenticação** ❌ OAuth2 → ✅ Basic Auth

**Antes (incorreto):**
```javascript
// Tentava usar OAuth2
POST /oauth/token
Authorization: Bearer token
```

**Agora (correto):**
```javascript
// Basic Authentication com Base64
Authorization: Basic {base64(public:private)}
```

**Como funciona:**
- Combina `CIABRA_CLIENT_ID:CIABRA_CLIENT_SECRET`
- Codifica em Base64
- Usa como `Authorization: Basic {token}`

---

### 2. **Endpoints** ❌ `/api/v1/charges` → ✅ `/invoices/applications/invoices`

**Antes (incorreto):**
- `POST /api/v1/charges` - Criar cobrança
- `GET /api/v1/charges/:id` - Consultar cobrança

**Agora (correto):**
- `POST /invoices/applications/invoices` - Criar invoice
- `GET /invoices/applications/invoices/:id` - Consultar invoice
- `POST /invoices/applications/customers` - Criar cliente
- `GET /payments/applications/installments/:id` - Consultar pagamentos

---

### 3. **Estrutura de Dados**

**Antes:**
```javascript
{
  amount: 10000, // em centavos
  due_date: "2024-01-23",
  customer: { name, email, document, phone },
  payment_method: "pix"
}
```

**Agora:**
```javascript
{
  customerId: "uuid", // ID do cliente criado primeiro
  price: 100.00, // em reais (não centavos)
  dueDate: "2024-01-23T00:00:00.000Z", // ISO 8601
  paymentTypes: ["PIX"], // ou ["BOLETO"] ou ["PIX", "BOLETO"]
  externalId: "123", // nosso payment_id
  webhooks: [...] // webhooks por invoice
}
```

---

### 4. **Fluxo de Criação**

**Antes:**
1. Autenticar (OAuth2)
2. Criar cobrança diretamente

**Agora:**
1. Gerar token Basic Auth (Base64)
2. Criar cliente primeiro (`/invoices/applications/customers`)
3. Criar invoice com `customerId` (`/invoices/applications/invoices`)

---

### 5. **Webhooks**

**Antes:**
- Webhooks configurados globalmente no painel

**Agora:**
- Webhooks configurados **por invoice** no payload
- Cada invoice pode ter seus próprios webhooks
- Tipos: `INVOICE_CREATED`, `INVOICE_DELETED`, `PAYMENT_GENERATED`, `PAYMENT_CONFIRMED`

---

## 📋 Eventos de Webhook Atualizados

| Evento Antigo | Evento Novo | Descrição |
|---------------|-------------|-----------|
| `charge.created` | `INVOICE_CREATED` | Invoice criada |
| `charge.deleted` | `INVOICE_DELETED` | Invoice deletada |
| `payment.generated` | `PAYMENT_GENERATED` | Pagamento gerado |
| `payment.confirmed` | `PAYMENT_CONFIRMED` | Pagamento confirmado |
| - | `PAYMENT_RECEIVED` | Pagamento recebido |
| - | `PAYMENT_REFUNDED` | Pagamento estornado |

---

## 🚀 Como Aplicar

### 1. Atualizar `.env` no servidor:

```bash
cd /opt/apps/larparatodos
nano .env
```

**Verificar se está:**
```env
CIABRA_API_URL=https://api.az.center
CIABRA_CLIENT_ID=507d16af63143a1703328e12111f5a8dd167992dd2ad25421dc7
CIABRA_CLIENT_SECRET=3a9105ed785c97a6ac0f
```

### 2. Reconstruir e reiniciar backend:

```bash
docker compose build --no-cache backend
docker compose restart backend
```

### 3. Testar credenciais:

```bash
# Testar endpoint de verificação
curl -X GET https://larparatodoshabitacional.com.br/api/ciabra/check \
  -H "Authorization: Bearer {seu_token_jwt}"
```

**Ou acesse:** `https://larparatodoshabitacional.com.br/api/ciabra/check` (precisa estar autenticado)

---

## ✅ Funcionalidades Implementadas

1. ✅ **Basic Authentication** - Geração automática de token Base64
2. ✅ **Verificação de credenciais** - Endpoint `/api/ciabra/check`
3. ✅ **Criação de cliente** - Automática antes de criar invoice
4. ✅ **Criação de invoice** - Com webhooks configurados
5. ✅ **Consulta de invoice** - Detalhes completos
6. ✅ **Consulta de pagamentos** - Por installment
7. ✅ **Processamento de webhooks** - Todos os tipos de eventos

---

## 🔧 Estrutura da Resposta da API

### Criar Invoice:
```json
{
  "id": "uuid",
  "customerId": "uuid",
  "price": 100.00,
  "dueDate": "2024-01-23T00:00:00.000Z",
  "installments": [
    {
      "id": "uuid",
      "payments": [
        {
          "id": "uuid",
          "pix": {
            "qrCode": "...",
            "qrCodeUrl": "..."
          },
          "boleto": {
            "url": "..."
          }
        }
      ]
    }
  ]
}
```

---

## 📝 Notas Importantes

1. **Valor em Reais**: A API do Ciabra espera valores em **reais** (não centavos)
2. **Data ISO 8601**: A data deve estar no formato `YYYY-MM-DDTHH:mm:ss.sssZ`
3. **Cliente Primeiro**: Sempre criar cliente antes de criar invoice
4. **Webhooks por Invoice**: Cada invoice tem seus próprios webhooks
5. **External ID**: Usamos nosso `payment_id` como `externalId` para rastrear

---

## 🧪 Testar

Após aplicar as mudanças:

1. **Verificar credenciais:**
   ```bash
   curl https://larparatodoshabitacional.com.br/api/ciabra/check
   ```

2. **Criar uma cobrança** no painel de pagamentos
3. **Verificar logs:**
   ```bash
   docker compose logs -f backend | grep Ciabra
   ```

---

## ✅ Checklist

- [ ] `.env` atualizado com `CIABRA_API_URL=https://api.az.center`
- [ ] Backend reconstruído
- [ ] Backend reiniciado
- [ ] Credenciais verificadas (`/api/ciabra/check`)
- [ ] Teste de criação de cobrança funcionando
- [ ] Webhooks configurados no painel do Ciabra (se necessário)

---

**A integração agora está usando a API correta do Ciabra conforme a documentação oficial!** 🎉
