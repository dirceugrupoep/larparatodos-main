# 🏦 Configuração do Ciabra Invoice - Larparatodos

## 📋 Pré-requisitos

1. Conta ativa no Ciabra Invoice
2. Credenciais de API (Client ID e Client Secret)
3. Acesso ao painel do Ciabra para configurar webhook

## 🔧 Configuração no Servidor

### 1. Adicionar Variáveis no .env

No servidor, edite o arquivo `.env` e adicione:

```env
# Ciabra Invoice API
CIABRA_API_URL=https://api.ciabra.com.br
CIABRA_CLIENT_ID=seu_client_id_aqui
CIABRA_CLIENT_SECRET=seu_client_secret_aqui
CIABRA_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

**⚠️ IMPORTANTE:** Se as senhas tiverem caracteres `$`, troque por `$$` no .env (ex: `abc$def` → `abc$$def`)

### 2. Reiniciar os Containers

Após adicionar as variáveis:

```bash
cd /opt/apps/larparatodos
docker compose down
docker compose up -d --build
```

## 🔗 Configurar Webhook no Painel do Ciabra

### Passo 1: Acessar o Painel do Ciabra

1. Faça login no painel do Ciabra Invoice
2. Vá em **Configurações** → **Webhooks** (ou **Integrações**)

### Passo 2: Adicionar Webhook

Configure o webhook com:

- **URL do Webhook:**
  ```
  https://larparatodoshabitacional.com.br/api/ciabra/webhook
  ```

- **Eventos para escutar:**
  - ✅ Pagamento confirmado
  - ✅ Pagamento cancelado
  - ✅ Status de cobrança alterado
  - ✅ Cobrança vencida

- **Método:** POST
- **Formato:** JSON

### Passo 3: Copiar o Webhook Secret

Após criar o webhook, o Ciabra vai gerar um **Webhook Secret**.

Copie esse secret e adicione no `.env`:

```env
CIABRA_WEBHOOK_SECRET=secret_gerado_pelo_ciabra
```

## 🚀 Funcionamento do Sistema

### Geração Automática de Cobranças

O sistema gera automaticamente cobranças mensais para todos os usuários ativos baseado no dia de pagamento escolhido (10 ou 20).

#### Executar Manualmente

```bash
# Dentro do container do backend
docker exec -it larparatodos-backend npm run generate-charges
```

#### Configurar Cron (Recomendado)

Para executar automaticamente, configure um cron job no servidor:

```bash
# Editar crontab
crontab -e

# Adicionar linha para executar diariamente às 8h
0 8 * * * docker exec larparatodos-backend npm run generate-charges >> /var/log/larparatodos-charges.log 2>&1

# Adicionar linha para verificar status a cada hora
0 * * * * docker exec larparatodos-backend npm run check-payments >> /var/log/larparatodos-payments.log 2>&1

# Adicionar linha para atualizar vencidos diariamente à meia-noite
0 0 * * * docker exec larparatodos-backend node src/jobs/generateMonthlyCharges.js >> /var/log/larparatodos-overdue.log 2>&1
```

### Verificação de Status

O sistema verifica periodicamente o status das cobranças pendentes:

```bash
# Executar manualmente
docker exec -it larparatodos-backend npm run check-payments
```

## 👤 Para Usuários

### Escolher Dia de Pagamento

1. **No Cadastro:** Ao se cadastrar, escolha o dia 10 ou 20
2. **No Perfil:** Acesse "Meu Perfil" > "Dia de Pagamento" para alterar

⚠️ **Importante:** O dia escolhido será usado para todas as cobranças futuras.

### Pagar uma Cobrança

1. Acesse "Pagamentos" no dashboard
2. Para pagamentos pendentes, clique em:
   - **PIX:** Gera QR Code para pagamento instantâneo
   - **Boleto:** Gera boleto bancário para pagamento

### Status dos Pagamentos

- **Pendente:** Cobrança criada, aguardando pagamento
- **Pago:** Pagamento confirmado pelo Ciabra
- **Em Atraso (Overdue):** Vencido e não pago

## 🔍 Inadimplência

Usuários ficam inadimplentes quando:
- Têm pagamentos com status "Em Atraso" (overdue)
- O vencimento passou e o pagamento não foi confirmado

O sistema atualiza automaticamente o status baseado em:
- **Webhook do Ciabra** (tempo real)
- **Verificação periódica** (a cada hora)
- **Atualização de vencidos** (diariamente)

## 🛠️ Troubleshooting

### Cobrança não foi criada

1. Verifique se o usuário tem `payment_day` configurado
2. Verifique se já existe cobrança para o mês atual
3. Verifique logs: `docker logs larparatodos-backend | grep -i ciabra`

### Webhook não está funcionando

1. Verifique se a URL está correta no painel do Ciabra
2. Verifique se o servidor está acessível publicamente
3. Teste o webhook manualmente:
   ```bash
   curl -X POST https://larparatodoshabitacional.com.br/api/ciabra/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```
4. Verifique logs: `docker logs larparatodos-backend | grep webhook`

### Erro de autenticação

1. Verifique se `CIABRA_CLIENT_ID` e `CIABRA_CLIENT_SECRET` estão corretos
2. Verifique se as credenciais não expiraram
3. Verifique logs para detalhes do erro

### Imagens não carregam (S3/MinIO)

1. Verifique se o container MinIO está rodando:
   ```bash
   docker ps | grep minio
   ```

2. Verifique se o proxy Apache está configurado:
   ```bash
   curl -I http://larparatodoshabitacional.com.br/storage/
   ```

3. Verifique a configuração do Apache em `/etc/httpd/conf.d/larparatodos-proxy.conf`

4. Verifique se `S3_PUBLIC_URL` está correto no `.env`:
   ```env
   S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage
   ```

## 📚 Documentação

Para mais informações sobre a API do Ciabra, consulte:
- [Documentação Oficial](https://docs.ciabra.com.br)

## 🔐 Segurança

- **Nunca** commite credenciais no Git
- Use variáveis de ambiente para todas as configurações sensíveis
- Mantenha o `CIABRA_WEBHOOK_SECRET` seguro e use-o para validar webhooks
- Configure HTTPS para o webhook em produção (já configurado)

## ✅ Checklist de Configuração

- [ ] Credenciais do Ciabra adicionadas no `.env`
- [ ] Webhook configurado no painel do Ciabra
- [ ] Webhook Secret adicionado no `.env`
- [ ] Containers reiniciados após adicionar variáveis
- [ ] Teste de criação de cobrança funcionando
- [ ] Webhook recebendo notificações (verificar logs)
- [ ] Cron jobs configurados (opcional mas recomendado)
- [ ] Imagens do S3 carregando corretamente
