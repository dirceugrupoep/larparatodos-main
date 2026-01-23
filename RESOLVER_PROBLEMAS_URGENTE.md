# 🚨 Resolver Problemas Urgentes

## ❌ Problemas Identificados

1. **Imagens não carregam** - Frontend precisa ser reconstruído
2. **Erro DNS do Ciabra** - URL pode estar incorreta ou problema de rede

---

## ✅ SOLUÇÃO 1: Imagens (CRÍTICO - Fazer Primeiro)

### O Problema:
O Nginx ainda está tentando servir `/storage/` do sistema de arquivos, mas as imagens estão no MinIO.

### A Solução:
**Reconstruir o frontend** para aplicar a nova configuração do Nginx que faz proxy para o MinIO.

### Passos:

```bash
# 1. Ir para o diretório do projeto
cd /opt/apps/larparatodos

# 2. Parar o frontend
docker compose stop frontend

# 3. Reconstruir o frontend (SEM CACHE para garantir que aplica as mudanças)
docker compose build --no-cache frontend

# 4. Subir o frontend novamente
docker compose up -d frontend

# 5. Verificar se funcionou
docker compose logs -f frontend | grep storage
```

**Teste:**
```bash
# Testar acesso a uma imagem
curl -I http://127.0.0.1:8080/storage/logo_3_1769201207201.jpg
```

**Deve retornar `200 OK` em vez de `404 Not Found`.**

---

## ✅ SOLUÇÃO 2: Ciabra DNS

### O Problema:
O container não consegue resolver `api.ciabra.com.br`. Pode ser:
- URL incorreta
- Container sem acesso à internet
- DNS não configurado

### Passos de Diagnóstico:

#### 1. Testar DNS do Container

```bash
# Testar se o domínio resolve
docker exec larparatodos-backend nslookup api.ciabra.com.br

# Se não resolver, testar acesso à internet
docker exec larparatodos-backend ping -c 3 8.8.8.8

# Testar resolução DNS genérica
docker exec larparatodos-backend nslookup google.com
```

#### 2. Verificar URL Correta

**IMPORTANTE:** A URL `api.ciabra.com.br` pode estar incorreta!

**Onde verificar:**
1. **Painel do Ciabra** → Configurações → API
2. **Documentação:** https://docs.ciabra.com.br
3. **Suporte do Ciabra**

**Possíveis URLs corretas:**
- `https://ciabra.com.br/api`
- `https://app.ciabra.com.br/api`
- `https://api.ciabra.com.br/v1`
- Outra URL fornecida pelo Ciabra

#### 3. Se a URL Estiver Incorreta

```bash
# Editar .env
cd /opt/apps/larparatodos
nano .env

# Atualizar CIABRA_API_URL com a URL correta
# Exemplo:
# CIABRA_API_URL=https://ciabra.com.br/api

# Salvar (CTRL+O, Enter, CTRL+X)

# Reiniciar backend
docker compose restart backend
```

#### 4. Se a URL Estiver Correta

O problema pode ser de rede. Verifique:
- Firewall do servidor
- Configurações de rede do Docker
- Acesso à internet do container

**Testar conectividade:**
```bash
# Testar se consegue acessar a API
docker exec larparatodos-backend curl -I https://api.ciabra.com.br
```

---

## 📋 Checklist Rápido

### Para Imagens:
- [ ] Frontend reconstruído com `--no-cache`
- [ ] Teste de acesso a imagem retorna `200 OK`
- [ ] Imagens aparecem no site

### Para Ciabra:
- [ ] URL verificada na documentação/painel do Ciabra
- [ ] DNS testado (`nslookup api.ciabra.com.br`)
- [ ] Acesso à internet testado (`ping 8.8.8.8`)
- [ ] URL atualizada no `.env` (se necessário)
- [ ] Backend reiniciado após mudanças

---

## 🚀 Ordem de Execução

1. **PRIMEIRO:** Resolver problema das imagens (reconstruir frontend)
2. **SEGUNDO:** Diagnosticar problema do Ciabra (verificar URL)

---

## 💡 Dica

**Para o Ciabra:** O erro `ENOTFOUND` geralmente significa que:
- A URL está incorreta (mais provável)
- O container não tem acesso à internet
- Há firewall bloqueando

**Ação imediata:** Verifique a URL correta no painel do Ciabra ou na documentação oficial!

---

## 📞 Se Nada Funcionar

### Para Imagens:
1. Verificar se MinIO está rodando: `docker ps | grep minio`
2. Verificar se bucket tem arquivos: `docker exec larparatodos-minio mc ls myminio/associations/`
3. Verificar configuração do Nginx: `docker exec larparatodos-frontend cat /etc/nginx/conf.d/default.conf | grep storage`

### Para Ciabra:
1. Entre em contato com o suporte do Ciabra para confirmar a URL da API
2. Verifique se há restrições de IP ou whitelist
3. Verifique se o servidor tem acesso à internet

---

**Prioridade:** Resolver primeiro as imagens (reconstruir frontend), depois diagnosticar o Ciabra! 🎯
