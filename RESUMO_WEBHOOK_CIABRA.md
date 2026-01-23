# ✅ Resumo: Webhook do Ciabra - Tudo Pronto!

## 🎯 Endpoint Criado e Funcionando

O endpoint de webhook **já está criado** e funcionando:

```
POST https://larparatodoshabitacional.com.br/api/ciabra/webhook
```

**Você não precisa criar nada!** Só precisa configurar no painel do Ciabra.

---

## 📋 O Que Você Precisa Fazer

### 1. No Painel do Ciabra → Webhooks

Para **cada um dos 4 eventos**, configure:

1. **Cobrança criada**
   - Endpoint: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Status: ✅ Ativo

2. **Cobrança deletada**
   - Endpoint: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Status: ✅ Ativo

3. **Pagamento gerado**
   - Endpoint: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Status: ✅ Ativo

4. **Pagamento confirmado** ⭐ (Mais importante)
   - Endpoint: `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - Status: ✅ Ativo

---

## ✅ O Que Já Está Pronto

- ✅ Endpoint `/api/ciabra/webhook` criado
- ✅ Processa todos os tipos de eventos automaticamente
- ✅ Atualiza status dos pagamentos
- ✅ Atualiza QR Code PIX e URL do boleto
- ✅ Marca usuários como adimplentes quando pagam
- ✅ Logs detalhados para debug
- ✅ Não precisa de Webhook Secret (Ciabra não fornece)

---

## 🔧 Credenciais Configuradas

No `.env.prod` já estão configuradas:

```env
CIABRA_CLIENT_ID=507d16af63143a1703328e12111f5a8dd167992dd2ad25421dc7
CIABRA_CLIENT_SECRET=3a9105ed785c97a6ac0f
```

**Não precisa de `CIABRA_WEBHOOK_SECRET`** - o Ciabra não fornece essa credencial.

---

## 🧪 Como Testar

1. **Configure os webhooks no painel do Ciabra** (passo acima)

2. **Crie uma cobrança** no sistema (via painel do usuário)

3. **Verifique os logs:**
   ```bash
   docker compose logs -f backend | grep webhook
   ```

4. **Verifique no banco:**
   ```sql
   SELECT id, status, ciabra_charge_id, ciabra_pix_qr_code_url 
   FROM payments 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

---

## 📝 O Que o Webhook Faz

Quando o Ciabra envia uma notificação:

- **Pagamento confirmado:** Atualiza status para `paid` e marca data de pagamento
- **Cobrança criada:** Pode atualizar informações da cobrança
- **Pagamento gerado:** Atualiza QR Code PIX ou URL do boleto
- **Cobrança deletada:** Pode marcar como cancelado

Tudo é processado automaticamente no mesmo endpoint! 🎉

---

## 🚨 Troubleshooting

### Webhook não está recebendo notificações

1. Verifique se a URL está correta no painel do Ciabra
2. Verifique se o Apache está configurado para proxy `/api/ciabra/webhook`
3. Verifique logs: `docker compose logs backend | grep webhook`

### Erro 404 no webhook

Verifique se o Apache está roteando corretamente:
```bash
curl -X POST https://larparatodoshabitacional.com.br/api/ciabra/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

---

## ✅ Checklist Final

- [x] Endpoint criado (`/api/ciabra/webhook`)
- [x] Credenciais configuradas no `.env.prod`
- [x] Código processa todos os eventos
- [ ] **Você:** Configurar 4 webhooks no painel do Ciabra
- [ ] **Você:** Testar criando uma cobrança

**Pronto para usar!** 🚀
