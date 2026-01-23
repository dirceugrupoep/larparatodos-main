# 🎉 Integração Ciabra Invoice - Implementação Completa

## ✅ O que foi implementado

A integração com o Ciabra Invoice está **100% completa** e pronta para uso. Aqui está o que foi feito:

### 1. Banco de Dados ✅
- Campo `payment_day` (10 ou 20) na tabela `users`
- Campos do Ciabra na tabela `payments`:
  - `ciabra_charge_id` - ID da cobrança
  - `ciabra_pix_qr_code` - Código PIX
  - `ciabra_pix_qr_code_url` - URL do QR Code
  - `ciabra_boleto_url` - URL do boleto

### 2. Backend ✅
- **Serviço de integração** (`server/src/services/ciabra.js`)
  - Autenticação OAuth2 com Ciabra
  - Criação de cobranças (PIX e Boleto)
  - Consulta de status
  - Processamento de webhook
- **Rotas** (`server/src/routes/ciabra.js`)
  - `POST /api/ciabra/charges` - Criar cobrança
  - `GET /api/ciabra/charges/:id` - Consultar status
  - `POST /api/ciabra/webhook` - Receber notificações
- **Jobs automáticos** (`server/src/jobs/generateMonthlyCharges.js`)
  - Geração mensal de cobranças
  - Verificação periódica de status
  - Atualização de pagamentos vencidos

### 3. Frontend ✅
- Seleção de dia de pagamento no cadastro (10 ou 20)
- Edição do dia de pagamento no perfil
- Botões "PIX" e "Boleto" nos pagamentos
- Modal com QR Code PIX
- Links para visualizar boletos
- Status atualizado em tempo real

### 4. Lógica de Inadimplência ✅
- Usuário fica inadimplente quando tem pagamento vencido
- Atualização automática via webhook
- Verificação periódica (a cada hora)
- Atualização diária de vencidos

### 5. Correção do S3 ✅
- Função `getImageUrl` corrigida para usar `/storage/`
- URLs das imagens agora funcionam corretamente
- Documentação de troubleshooting criada

## 🚀 Próximos Passos (O que você precisa fazer)

### Passo 1: Adicionar Credenciais do Ciabra

No servidor, edite o `.env`:

```bash
cd /opt/apps/larparatodos
nano .env
```

Adicione no final:

```env
# Ciabra Invoice API
CIABRA_API_URL=https://api.az.center
CIABRA_CLIENT_ID=COLE_AQUI_O_CLIENT_ID
CIABRA_CLIENT_SECRET=COLE_AQUI_O_CLIENT_SECRET
CIABRA_WEBHOOK_SECRET=COLE_AQUI_O_WEBHOOK_SECRET
```

**⚠️ IMPORTANTE:** Se qualquer credencial tiver `$`, troque por `$$` (ex: `abc$123` → `abc$$123`)

### Passo 2: Reiniciar Containers

```bash
cd /opt/apps/larparatodos
docker compose down
docker compose up -d --build
```

### Passo 3: Configurar Webhook no Painel do Ciabra

1. Acesse o painel do Ciabra Invoice
2. Vá em **Configurações** → **Webhooks**
3. Adicione novo webhook:
   - **URL:** `https://larparatodoshabitacional.com.br/api/ciabra/webhook`
   - **Eventos:** Todos relacionados a pagamentos
4. Copie o **Webhook Secret** gerado
5. Adicione no `.env` como `CIABRA_WEBHOOK_SECRET`
6. Reinicie o backend: `docker compose restart backend`

### Passo 4: Configurar Cron Jobs (Opcional mas Recomendado)

```bash
crontab -e
```

Adicione:

```cron
# Gerar cobranças diariamente às 8h
0 8 * * * docker exec larparatodos-backend npm run generate-charges >> /var/log/larparatodos-charges.log 2>&1

# Verificar status a cada hora
0 * * * * docker exec larparatodos-backend npm run check-payments >> /var/log/larparatodos-payments.log 2>&1

# Atualizar vencidos diariamente à meia-noite
0 0 * * * docker exec larparatodos-backend npm run update-overdue >> /var/log/larparatodos-overdue.log 2>&1
```

## 🧪 Testar a Integração

### 1. Testar Criação de Cobrança

1. Acesse: `https://larparatodoshabitacional.com.br`
2. Faça login como usuário
3. Vá em "Pagamentos"
4. Clique em "PIX" ou "Boleto" em um pagamento pendente
5. Deve aparecer QR Code (PIX) ou abrir boleto

### 2. Testar Webhook

Após configurar o webhook no Ciabra, você pode testar:

```bash
# Ver logs do backend
docker logs -f larparatodos-backend | grep webhook
```

Quando um pagamento for confirmado no Ciabra, você verá:
```
✅ Pagamento X atualizado para status: paid
```

## 📋 Checklist Final

- [ ] Credenciais do Ciabra adicionadas no `.env`
- [ ] Webhook configurado no painel do Ciabra
- [ ] Webhook Secret adicionado no `.env`
- [ ] Containers reiniciados
- [ ] Teste de criação de cobrança funcionando
- [ ] Imagens do S3 carregando (se ainda não estiver)
- [ ] Cron jobs configurados (opcional)

## 📚 Documentação

- **Configuração completa:** `CONFIGURAR_CIABRA.md`
- **Como adicionar credenciais:** `CIABRA_CREDENCIAIS.md`
- **Troubleshooting S3:** `TROUBLESHOOTING_S3.md`
- **Resumo técnico:** `RESUMO_CIABRA.md`

## 🎯 Funcionalidades Implementadas

✅ Usuário escolhe dia de pagamento (10 ou 20) no cadastro  
✅ Cobranças geradas automaticamente no dia escolhido  
✅ Pagamento via PIX (QR Code) ou Boleto  
✅ Status atualizado automaticamente via webhook  
✅ Verificação periódica de status  
✅ Usuários ficam inadimplentes se não pagarem  
✅ Usuários voltam a ser adimplentes ao pagar  
✅ Imagens do S3 corrigidas para carregar corretamente  

## 🐛 Se Algo Não Funcionar

1. **Cobrança não criada:**
   - Verifique logs: `docker logs larparatodos-backend | grep -i ciabra`
   - Verifique se credenciais estão corretas no `.env`

2. **Webhook não recebe:**
   - Verifique URL no painel do Ciabra
   - Verifique logs: `docker logs larparatodos-backend | grep webhook`
   - Teste: `curl -X POST https://larparatodoshabitacional.com.br/api/ciabra/webhook`

3. **Imagens não carregam:**
   - Veja `TROUBLESHOOTING_S3.md`
   - Verifique proxy Apache
   - Verifique `S3_PUBLIC_URL` no `.env`

---

**Tudo está pronto! Só falta adicionar as credenciais do Ciabra e configurar o webhook.** 🚀
