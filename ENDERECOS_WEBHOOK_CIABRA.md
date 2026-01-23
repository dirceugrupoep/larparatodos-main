# 🔗 Endereços de Webhook para Configurar no Ciabra

## ✅ **RESPOSTA RÁPIDA:**

**Use o MESMO endereço para TODOS os 4 eventos:**

```
https://larparatodoshabitacional.com.br/api/ciabra/webhook
```

---

## 📋 Configuração no Painel do Ciabra

### Para cada um dos 4 eventos, configure:

| Evento | Endpoint (URL) | Status |
|--------|---------------|--------|
| **Cobrança criada** | `https://larparatodoshabitacional.com.br/api/ciabra/webhook` | ✅ Ativo |
| **Cobrança deletada** | `https://larparatodoshabitacional.com.br/api/ciabra/webhook` | ✅ Ativo |
| **Pagamento gerado** | `https://larparatodoshabitacional.com.br/api/ciabra/webhook` | ✅ Ativo |
| **Pagamento confirmado** | `https://larparatodoshabitacional.com.br/api/ciabra/webhook` | ✅ Ativo |

---

## 🎯 Por Que o Mesmo Endereço?

O sistema está preparado para receber **todos os tipos de eventos** no mesmo endpoint e processar cada um adequadamente:

- ✅ Identifica automaticamente o tipo de evento
- ✅ Processa cada evento de forma específica
- ✅ Atualiza o banco de dados conforme necessário
- ✅ Logs detalhados para cada tipo de evento

---

## 🔧 O Que Cada Evento Faz no Sistema

### 1. **Cobrança criada** (`charge.created`)
- **O que faz:** Atualiza QR Code PIX e URL do boleto quando a cobrança é criada
- **Atualiza no banco:** `ciabra_pix_qr_code`, `ciabra_pix_qr_code_url`, `ciabra_boleto_url`

### 2. **Cobrança deletada** (`charge.deleted`)
- **O que faz:** Marca o pagamento como cancelado
- **Atualiza no banco:** `status = 'cancelled'`

### 3. **Pagamento gerado** (`payment.generated`)
- **O que faz:** Atualiza QR Code PIX ou URL do boleto quando gerado
- **Atualiza no banco:** `ciabra_pix_qr_code`, `ciabra_pix_qr_code_url`, `ciabra_boleto_url`

### 4. **Pagamento confirmado** (`payment.confirmed`) ⭐
- **O que faz:** Marca o pagamento como pago e atualiza a data de pagamento
- **Atualiza no banco:** `status = 'paid'`, `paid_date = data_do_pagamento`
- **Verifica:** Se o usuário ainda tem outros pagamentos vencidos (volta a ser adimplente se não tiver)

---

## 📝 Passo a Passo no Painel do Ciabra

1. **Acesse:** Painel do Ciabra → **Webhooks**

2. **Para "Cobrança criada":**
   - Clique no ícone de editar (lápis)
   - Cole: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Ative o toggle "Ativo"
   - Clique em "Salvar"

3. **Repita para os outros 3 eventos:**
   - Cobrança deletada
   - Pagamento gerado
   - Pagamento confirmado

**Todos usam a mesma URL!**

---

## ✅ Como Funciona

1. **Ciabra envia notificação** → POST para `/api/ciabra/webhook`
2. **Sistema identifica o evento** → Lê o campo `event` ou `type` no payload
3. **Extrai os dados** → Suporta diferentes formatos de payload
4. **Processa especificamente** → Cada evento tem sua lógica
5. **Atualiza o banco** → Modifica a tabela `payments`
6. **Retorna sucesso** → Ciabra sabe que recebemos

> 📖 **Quer entender melhor os payloads?** Veja `PAYLOADS_WEBHOOK_CIABRA.md`

---

## 🧪 Testar

Após configurar:

1. **Crie uma cobrança** no sistema (via painel do usuário)
2. **Verifique os logs:**
   ```bash
   docker compose logs -f backend | grep webhook
   ```
3. **Verifique no banco:**
   ```sql
   SELECT id, status, ciabra_charge_id, ciabra_pix_qr_code_url 
   FROM payments 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## 🚨 Importante

- ✅ O endpoint **já está criado e funcionando**
- ✅ O código **já processa todos os eventos**
- ✅ O banco de dados **já está preparado**
- ✅ Você só precisa **configurar no painel do Ciabra**

**Não precisa criar nada novo!** Só configurar os 4 webhooks apontando para o mesmo endpoint.

---

## 📍 URL Completa

```
https://larparatodoshabitacional.com.br/api/ciabra/webhook
```

**Use esta URL para todos os 4 eventos!** 🎯
