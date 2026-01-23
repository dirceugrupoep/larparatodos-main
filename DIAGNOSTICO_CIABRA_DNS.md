# 🔍 Diagnóstico - Erro DNS do Ciabra

## ❌ Erro Atual

```
getaddrinfo ENOTFOUND api.ciabra.com.br
```

O container do backend não consegue resolver o DNS de `api.ciabra.com.br`.

---

## 🔧 Soluções a Tentar

### 1. Verificar se o Domínio Está Correto

O domínio `api.ciabra.com.br` pode estar incorreto. Verifique na documentação oficial do Ciabra qual é a URL correta da API.

**Possíveis URLs:**
- `https://api.ciabra.com.br` (atual)
- `https://ciabra.com.br/api`
- `https://app.ciabra.com.br/api`
- `https://api.ciabra.com.br/v1`
- Outra URL fornecida pela documentação

**Como verificar:**
1. Acesse a documentação do Ciabra: https://docs.ciabra.com.br
2. Procure pela "Base URL" ou "API Endpoint"
3. Atualize `CIABRA_API_URL` no `.env` se necessário

---

### 2. Testar DNS do Container

```bash
# Entrar no container
docker exec -it larparatodos-backend sh

# Testar resolução DNS
nslookup api.ciabra.com.br

# Ou
ping -c 3 api.ciabra.com.br
```

**Se não resolver:**
- O domínio pode não existir
- O container pode não ter acesso à internet
- DNS servers podem não estar funcionando

---

### 3. Verificar Acesso à Internet

```bash
# Testar se o container tem acesso à internet
docker exec larparatodos-backend ping -c 3 8.8.8.8

# Testar resolução DNS genérica
docker exec larparatodos-backend nslookup google.com
```

**Se não funcionar:**
- O container não tem acesso à internet
- Verifique configurações de rede do Docker
- Verifique firewall do servidor

---

### 4. Verificar DNS Servers no Docker Compose

O `docker-compose.yml` já tem DNS servers configurados:

```yaml
backend:
  dns:
    - 8.8.8.8
    - 8.8.4.4
```

**Para aplicar:**
```bash
docker compose down
docker compose up -d backend
```

---

### 5. Testar URL Manualmente

```bash
# Testar se a URL responde
docker exec larparatodos-backend curl -v https://api.ciabra.com.br/oauth/token

# Ou testar apenas conectividade
docker exec larparatodos-backend curl -I https://api.ciabra.com.br
```

**Se retornar erro de DNS:**
- O domínio não existe ou está incorreto
- Verifique a documentação do Ciabra

**Se retornar erro de conexão:**
- Problema de rede/firewall
- Verifique configurações do servidor

---

### 6. Verificar URL na Documentação do Ciabra

Acesse: https://docs.ciabra.com.br/getting-started

Procure por:
- "Base URL"
- "API Endpoint"
- "API URL"
- "Endpoint da API"

**Se a URL for diferente, atualize no `.env`:**

```bash
# Editar .env
nano /opt/apps/larparatodos/.env

# Atualizar CIABRA_API_URL com a URL correta
CIABRA_API_URL=https://url-correta-aqui

# Reiniciar backend
docker compose restart backend
```

---

## 🧪 Script de Diagnóstico Completo

Execute este script para diagnosticar tudo:

```bash
#!/bin/bash

echo "🔍 Diagnóstico DNS do Ciabra"
echo "=============================="
echo ""

echo "1. Testando DNS do container..."
docker exec larparatodos-backend nslookup api.ciabra.com.br || echo "❌ DNS não resolve"

echo ""
echo "2. Testando acesso à internet..."
docker exec larparatodos-backend ping -c 2 8.8.8.8 || echo "❌ Sem acesso à internet"

echo ""
echo "3. Testando resolução DNS genérica..."
docker exec larparatodos-backend nslookup google.com || echo "❌ DNS não funciona"

echo ""
echo "4. Testando conectividade com API..."
docker exec larparatodos-backend curl -I https://api.ciabra.com.br 2>&1 | head -5

echo ""
echo "5. Verificando configuração no .env..."
docker exec larparatodos-backend printenv | grep CIABRA

echo ""
echo "✅ Diagnóstico completo!"
```

---

## 📋 Checklist

- [ ] Verificar URL correta na documentação do Ciabra
- [ ] Testar DNS do container (`nslookup api.ciabra.com.br`)
- [ ] Testar acesso à internet (`ping 8.8.8.8`)
- [ ] Verificar DNS servers no `docker-compose.yml`
- [ ] Reiniciar backend após mudanças
- [ ] Testar URL manualmente (`curl https://api.ciabra.com.br`)

---

## 🚨 Se Nada Funcionar

1. **Verifique a documentação oficial do Ciabra** para confirmar a URL correta
2. **Entre em contato com o suporte do Ciabra** para confirmar:
   - URL da API
   - Se há restrições de IP
   - Se precisa de whitelist
3. **Verifique se o servidor tem acesso à internet** e se não há firewall bloqueando

---

## 💡 Possível Solução Rápida

Se a URL estiver incorreta, atualize no `.env`:

```bash
# No servidor
cd /opt/apps/larparatodos
nano .env

# Altere CIABRA_API_URL para a URL correta
# Exemplo (se for diferente):
# CIABRA_API_URL=https://ciabra.com.br/api

# Salve e reinicie
docker compose restart backend
```

---

**O problema mais provável é que a URL `api.ciabra.com.br` esteja incorreta. Verifique na documentação oficial do Ciabra!** 🔍
