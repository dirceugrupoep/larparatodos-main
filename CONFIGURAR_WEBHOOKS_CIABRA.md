# 🔗 Configuração de Webhooks do Ciabra

## 📋 Credenciais do Ciabra

Você já tem as credenciais:

- **Chave Pública (CIABRA_CLIENT_ID):** `507d16af63143a1703328e12111f5a8dd167992dd2ad25421dc7`
- **Chave Secreta (CIABRA_CLIENT_SECRET):** `3a9105ed785c97a6ac0f`

Essas credenciais já estão configuradas no `.env.prod`.

---

## 🔔 Configuração dos Webhooks

### ⚠️ Importante: Um Endpoint para Todos os Eventos

**Você pode usar o mesmo endpoint para todos os eventos!**

O sistema está preparado para receber **todos os tipos de eventos** no mesmo endpoint e processar cada um adequadamente.

### 📍 URL do Webhook

Use esta URL para **todos os eventos**:

```
https://larparatodoshabitacional.com.br/api/ciabra/webhook
```

---

## 🎯 Eventos que Devem ser Configurados

No painel do Ciabra, configure os seguintes eventos para usar o **mesmo endpoint**:

### 1. Cobrança criada
- **Endpoint:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
- **Status:** Ativo ✅

### 2. Cobrança deletada
- **Endpoint:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
- **Status:** Ativo ✅

### 3. Pagamento gerado
- **Endpoint:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
- **Status:** Ativo ✅

### 4. Pagamento confirmado ⭐ (Mais importante)
- **Endpoint:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
- **Status:** Ativo ✅

---

## 📝 Passo a Passo no Painel do Ciabra

1. **Acesse:** Painel do Ciabra → **Webhooks**

2. **Para cada evento:**
   - Clique no ícone de editar (lápis) ao lado do evento
   - Cole a URL: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Ative o toggle "Ativo"
   - Clique em "Salvar"

3. **Repita para todos os 4 eventos:**
   - Cobrança criada
   - Cobrança deletada
   - Pagamento gerado
   - Pagamento confirmado

---

## 🔐 Webhook Secret

**⚠️ IMPORTANTE:** O Ciabra **não fornece** um Webhook Secret separado. O sistema está configurado para funcionar sem essa validação.

O endpoint de webhook já está criado e funcionando em:
```
POST https://larparatodoshabitacional.com.br/api/ciabra/webhook
```

Você só precisa configurar os eventos no painel do Ciabra apontando para este endpoint.

---

## ✅ Como o Sistema Processa os Eventos

O endpoint `/api/ciabra/webhook` processa automaticamente:

- **Pagamento confirmado:** Atualiza o status do pagamento para `paid` e marca a data de pagamento
- **Cobrança criada:** Pode atualizar informações da cobrança
- **Cobrança deletada:** Pode marcar como cancelado
- **Pagamento gerado:** Pode atualizar QR Code PIX ou URL do boleto

---

## 🧪 Testar o Webhook

Após configurar, você pode testar:

1. **Criar uma cobrança** no sistema
2. **Verificar os logs** do backend:
   ```bash
   docker compose logs -f backend | grep webhook
   ```

3. **Verificar no banco** se o pagamento foi atualizado:
   ```sql
   SELECT id, status, ciabra_charge_id FROM payments ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📋 Checklist

- [ ] Credenciais adicionadas no `.env` (já feito ✅)
- [ ] Webhook "Cobrança criada" configurado
- [ ] Webhook "Cobrança deletada" configurado
- [ ] Webhook "Pagamento gerado" configurado
- [ ] Webhook "Pagamento confirmado" configurado ⭐
- [ ] Todos os webhooks ativados
- [ ] Webhook Secret adicionado (se disponível)
- [ ] Backend reiniciado após adicionar secret

---

## 🚨 Troubleshooting

### Webhook não está recebendo notificações

1. Verifique se a URL está correta (com `https://`)
2. Verifique se o Apache está configurado para proxy `/api/ciabra/webhook`
3. Verifique os logs: `docker compose logs backend | grep webhook`
4. Teste a URL manualmente:
   ```bash
   curl -X POST https://larparatodoshabitacional.com.br/api/ciabra/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Erro de assinatura inválida

- Se configurou `CIABRA_WEBHOOK_SECRET`, verifique se está correto
- Se não configurou, o sistema aceita webhooks sem validação (menos seguro)

---

## 📚 Documentação Adicional

- Ver `CONFIGURAR_CIABRA.md` para mais detalhes sobre a integração
- Ver `EXPLICACAO_ENV.md` para entender as variáveis de ambiente
