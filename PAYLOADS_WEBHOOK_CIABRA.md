# 📦 Payloads dos Webhooks do Ciabra

## ✅ **SIM! Cada evento envia um payload diferente**

O Ciabra envia payloads diferentes para cada tipo de evento, e **o sistema identifica automaticamente** qual evento é através do campo `event` ou `type` no payload.

---

## 🔍 Como o Sistema Identifica o Evento

O sistema lê o campo `event` ou `type` do payload para saber qual evento é:

```javascript
const eventType = payload.event || payload.type || 'charge.updated';
```

**Exemplos de valores:**
- `charge.created` ou `cobrança.criada`
- `charge.deleted` ou `cobrança.deletada`
- `payment.generated` ou `pagamento.gerado`
- `payment.confirmed` ou `pagamento.confirmado`

---

## 📋 Estrutura dos Payloads (Exemplos)

### 1. **Cobrança criada** (`charge.created`)

```json
{
  "event": "charge.created",
  "id": "charge_123456",
  "status": "pending",
  "amount": 10000,
  "pix": {
    "qr_code": "00020126580014BR.GOV.BCB.PIX...",
    "qr_code_url": "https://ciabra.com.br/qr/abc123"
  },
  "boleto": {
    "url": "https://ciabra.com.br/boleto/xyz789"
  },
  "created_at": "2026-01-23T10:00:00Z"
}
```

**O que o sistema faz:**
- Salva QR Code PIX
- Salva URL do boleto
- Atualiza status para `pending`

---

### 2. **Cobrança deletada** (`charge.deleted`)

```json
{
  "event": "charge.deleted",
  "id": "charge_123456",
  "status": "cancelled",
  "deleted_at": "2026-01-23T11:00:00Z"
}
```

**O que o sistema faz:**
- Marca pagamento como `cancelled`
- Não precisa de mais dados

---

### 3. **Pagamento gerado** (`payment.generated`)

```json
{
  "event": "payment.generated",
  "id": "charge_123456",
  "status": "pending",
  "pix": {
    "qr_code": "00020126580014BR.GOV.BCB.PIX...",
    "qr_code_url": "https://ciabra.com.br/qr/abc123"
  },
  "boleto": {
    "url": "https://ciabra.com.br/boleto/xyz789"
  }
}
```

**O que o sistema faz:**
- Atualiza QR Code PIX (se mudou)
- Atualiza URL do boleto (se mudou)

---

### 4. **Pagamento confirmado** (`payment.confirmed`) ⭐

```json
{
  "event": "payment.confirmed",
  "id": "charge_123456",
  "status": "paid",
  "amount": 10000,
  "paid_at": "2026-01-23T12:00:00Z",
  "payment_method": "pix"
}
```

**O que o sistema faz:**
- Marca como `paid`
- Salva `paid_date`
- Verifica se usuário ainda tem outros vencidos
- Se não tiver mais vencidos, usuário volta a ser adimplente

---

## 🧠 Como o Sistema Processa

### Passo 1: Recebe o Payload
```javascript
const payload = req.body; // JSON do Ciabra
```

### Passo 2: Identifica o Tipo de Evento
```javascript
const eventType = payload.event || payload.type || 'charge.updated';
// Exemplo: "charge.created", "payment.confirmed", etc.
```

### Passo 3: Extrai os Dados
```javascript
const chargeData = payload.data || payload.charge || payload;
const chargeId = chargeData.id || chargeData.charge_id;
const status = chargeData.status;
const pixQrCode = chargeData.pix?.qr_code;
// etc...
```

### Passo 4: Processa Especificamente
```javascript
if (eventType.includes('charge.created')) {
  // Lógica para cobrança criada
} else if (eventType.includes('payment.confirmed')) {
  // Lógica para pagamento confirmado
}
// etc...
```

---

## 🔄 Estruturas Alternativas

O Ciabra pode enviar payloads em formatos diferentes. O sistema suporta:

### Formato 1: Evento no topo
```json
{
  "event": "charge.created",
  "data": {
    "id": "charge_123",
    "status": "pending"
  }
}
```

### Formato 2: Tudo junto
```json
{
  "type": "charge.created",
  "id": "charge_123",
  "status": "pending"
}
```

### Formato 3: Com objeto charge
```json
{
  "event": "charge.created",
  "charge": {
    "id": "charge_123",
    "status": "pending"
  }
}
```

**O sistema tenta todos os formatos!** 🎯

---

## 📊 Logs para Debug

O sistema registra logs detalhados:

```javascript
console.log('📨 Webhook recebido do Ciabra - Payload completo:', JSON.stringify(payload, null, 2));
console.log('📋 Processando evento: charge.created, chargeId: charge_123, status: pending');
console.log('📦 Evento: Cobrança criada');
```

**Para ver os logs:**
```bash
docker compose logs -f backend | grep webhook
```

---

## ✅ Resumo

| Pergunta | Resposta |
|----------|----------|
| **Cada evento envia payload diferente?** | ✅ SIM |
| **O sistema identifica automaticamente?** | ✅ SIM |
| **Como identifica?** | Lê o campo `event` ou `type` |
| **Suporta formatos diferentes?** | ✅ SIM (3 formatos) |
| **Tem logs detalhados?** | ✅ SIM |

---

## 🎯 Conclusão

**Você não precisa se preocupar!** O sistema:

1. ✅ Recebe qualquer payload do Ciabra
2. ✅ Identifica automaticamente o tipo de evento
3. ✅ Extrai os dados corretamente (tentando vários formatos)
4. ✅ Processa cada evento de forma específica
5. ✅ Atualiza o banco de dados adequadamente
6. ✅ Registra logs detalhados para debug

**Basta configurar os 4 webhooks no painel do Ciabra apontando para o mesmo endpoint!** 🚀
