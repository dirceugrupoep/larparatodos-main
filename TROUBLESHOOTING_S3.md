# 🔧 Troubleshooting - Imagens S3/MinIO não Carregam

## 🎯 Problema: Logos e Capas das Associações não Aparecem

Se as imagens não estão carregando no site, siga estes passos:

## ✅ Verificação Rápida

### 1. Verificar se o MinIO está rodando

```bash
docker ps | grep minio
```

Deve aparecer algo como:
```
larparatodos-minio   Up X minutes (healthy)
```

Se não estiver rodando:
```bash
cd /opt/apps/larparatodos
docker compose up -d minio
```

### 2. Verificar se o bucket existe

```bash
docker exec larparatodos-minio mc ls myminio/
```

Deve aparecer:
```
[2026-01-XX XX:XX:XX UTC]     0B associations/
```

### 3. Testar acesso direto ao MinIO

```bash
curl -I http://127.0.0.1:9000/associations/
```

Deve retornar `200 OK` ou `403 Forbidden` (normal se não tiver arquivos).

### 4. Testar proxy Apache

```bash
curl -I http://larparatodoshabitacional.com.br/storage/
```

Deve retornar `200 OK` ou `404 Not Found` (se não tiver arquivos).

## 🔧 Soluções Comuns

### Problema 1: Proxy Apache não configurado

**Sintoma:** Imagens retornam 404 ou erro de conexão

**Solução:**

1. Verificar se o arquivo de proxy existe:
   ```bash
   ls -la /etc/httpd/conf.d/larparatodos-proxy.conf
   ```

2. Se não existir, criar:
   ```bash
   nano /etc/httpd/conf.d/larparatodos-proxy.conf
   ```

3. Cole esta configuração:

   ```apache
   <VirtualHost *:80>
     ServerName larparatodoshabitacional.com.br
     ServerAlias www.larparatodoshabitacional.com.br

     ProxyPreserveHost On

     # API -> Backend
     ProxyPass "/api" "http://127.0.0.1:3000/api"
     ProxyPassReverse "/api" "http://127.0.0.1:3000/api"

     # Storage -> MinIO (reescreve /storage para /associations)
     ProxyPass "/storage" "http://127.0.0.1:9000/associations"
     ProxyPassReverse "/storage" "http://127.0.0.1:9000/associations"

     # Frontend -> React
     ProxyPass "/" "http://127.0.0.1:8080/"
     ProxyPassReverse "/" "http://127.0.0.1:8080/"
   </VirtualHost>
   ```

4. Verificar sintaxe:
   ```bash
   apachectl configtest
   ```

5. Reiniciar Apache:
   ```bash
   systemctl restart httpd
   ```

### Problema 2: Módulos do Apache não habilitados

**Sintoma:** Erro 500 ao acessar /storage

**Solução:**

1. Verificar módulos:
   ```bash
   apachectl -M | grep -E 'proxy|rewrite'
   ```

2. Deve aparecer:
   - `proxy_module`
   - `proxy_http_module`
   - `rewrite_module`

3. Se não aparecer, habilitar no WHM:
   - WHM → Service Configuration → Apache Configuration
   - Ou editar `/etc/httpd/conf.modules.d/00-proxy.conf`

### Problema 3: S3_PUBLIC_URL incorreto

**Sintoma:** URLs das imagens estão erradas

**Solução:**

1. Verificar o .env:
   ```bash
   grep S3_PUBLIC_URL /opt/apps/larparatodos/.env
   ```

2. Deve estar:
   ```env
   S3_PUBLIC_URL=https://larparatodoshabitacional.com.br/storage
   ```

3. Se estiver diferente, corrigir e reiniciar:
   ```bash
   nano /opt/apps/larparatodos/.env
   # Corrigir S3_PUBLIC_URL
   docker compose restart backend
   ```

### Problema 4: Bucket não tem permissão de leitura pública

**Sintoma:** Imagens retornam 403 Forbidden

**Solução:**

1. Verificar permissões do bucket:
   ```bash
   docker exec larparatodos-minio mc anonymous get myminio/associations
   ```

2. Se não estiver público, configurar:
   ```bash
   docker exec larparatodos-minio mc anonymous set download myminio/associations
   ```

### Problema 5: Arquivo não existe no bucket

**Sintoma:** Imagem específica não carrega

**Solução:**

1. Listar arquivos no bucket:
   ```bash
   docker exec larparatodos-minio mc ls myminio/associations/
   ```

2. Verificar se o arquivo existe

3. Se não existir, fazer upload novamente pelo painel da associação

## 🧪 Teste Completo

Execute este script para diagnosticar tudo:

```bash
#!/bin/bash
echo "=== Teste S3/MinIO ==="

echo "1. Container MinIO:"
docker ps | grep minio || echo "❌ MinIO não está rodando"

echo "2. Health do MinIO:"
docker exec larparatodos-minio curl -f http://localhost:9000/minio/health/live && echo "✅ MinIO saudável" || echo "❌ MinIO com problemas"

echo "3. Bucket existe:"
docker exec larparatodos-minio mc ls myminio/associations/ && echo "✅ Bucket OK" || echo "❌ Bucket não encontrado"

echo "4. Acesso direto MinIO:"
curl -I http://127.0.0.1:9000/associations/ 2>&1 | head -1

echo "5. Proxy Apache /storage:"
curl -I http://larparatodoshabitacional.com.br/storage/ 2>&1 | head -1

echo "6. Variável S3_PUBLIC_URL:"
docker exec larparatodos-backend printenv S3_PUBLIC_URL || echo "❌ Não definida"
```

## 📝 Checklist de Verificação

- [ ] Container MinIO está rodando e saudável
- [ ] Bucket `associations` existe
- [ ] Bucket tem permissão de leitura pública
- [ ] Proxy Apache configurado em `/etc/httpd/conf.d/larparatodos-proxy.conf`
- [ ] Módulos proxy habilitados no Apache
- [ ] `S3_PUBLIC_URL` correto no `.env`
- [ ] Backend reiniciado após mudanças no `.env`
- [ ] Apache reiniciado após mudanças no proxy

## 🆘 Se Nada Funcionar

1. Ver logs do MinIO:
   ```bash
   docker logs larparatodos-minio --tail 100
   ```

2. Ver logs do backend:
   ```bash
   docker logs larparatodos-backend --tail 100 | grep -i s3
   ```

3. Ver logs do Apache:
   ```bash
   tail -100 /var/log/httpd/error_log
   ```

4. Testar upload manual:
   - Acesse o painel da associação
   - Tente fazer upload de uma nova imagem
   - Verifique os logs do backend durante o upload
