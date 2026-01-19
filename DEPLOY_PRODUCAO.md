# 🚀 DEPLOY PRODUÇÃO - BRAVULINK (SEM DEV)

## ✅ Sistema 100% Produção - Sem :8080

### 📋 Pré-requisitos
- Docker e Docker Compose instalados
- Apache rodando na porta 80
- Domínio configurado no DNS

---

## 🎯 PASSO A PASSO DEFINITIVO

### 1️⃣ PARAR TUDO E LIMPAR
```bash
cd /opt/apps/larparatodos

# Para containers dev antigos
docker compose down 2>/dev/null || true

# Para e remove todos containers do projeto
docker stop larparatodos-frontend larparatodos-backend larparatodos-dev larparatodos-postgres larparatodos-minio 2>/dev/null || true
docker rm -f larparatodos-frontend larparatodos-backend larparatodos-dev larparatodos-postgres larparatodos-minio larparatodos-minio-setup 2>/dev/null || true
```

### 2️⃣ CONFIGURAR .env (SE AINDA NÃO FEZ)
```bash
nano .env
```

Conteúdo mínimo:
```bash
DOMAIN=larparatodoshabitacional.com.br
DB_PASSWORD=SuaSenhaSegura123
JWT_SECRET=ChaveSecretaSuperSegura456
S3_SECRET_KEY=SenhaMinIOSegura789
```

### 3️⃣ SUBIR **APENAS PRODUÇÃO**
```bash
# IMPORTANTE: use -f para especificar o arquivo .prod
docker compose -f docker-compose.prod.yml up -d --build

# Verificar
docker ps
```

**Resultado esperado:**
```
larparatodos-frontend  (porta 127.0.0.1:8080)
larparatodos-backend   (porta 127.0.0.1:3000)
larparatodos-postgres  (porta 127.0.0.1:5432)
larparatodos-minio     (porta 127.0.0.1:9000/9001)
```

✅ **Nenhuma porta 0.0.0.0** - tudo interno!

---

## 🌐 CONFIGURAR APACHE (REMOVER :8080)

### 4️⃣ Criar arquivo de proxy Apache
```bash
nano /etc/httpd/conf.d/larparatodos-proxy.conf
```

Cole **exatamente**:
```apache
<VirtualHost *:80>
    ServerName larparatodoshabitacional.com.br
    ServerAlias www.larparatodoshabitacional.com.br

    ProxyPreserveHost On
    ProxyTimeout 300

    # Backend API em /api
    <Location /api>
        ProxyPass http://127.0.0.1:3000
        ProxyPassReverse http://127.0.0.1:3000
    </Location>

    # MinIO Storage em /storage
    <Location /storage>
        ProxyPass http://127.0.0.1:9000
        ProxyPassReverse http://127.0.0.1:9000
    </Location>

    # Frontend (tudo resto)
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/
</VirtualHost>
```

### 5️⃣ Reiniciar Apache
```bash
systemctl restart httpd
systemctl status httpd --no-pager
```

---

## ✅ TESTAR

### No servidor:
```bash
curl -I http://larparatodoshabitacional.com.br
curl -I http://larparatodoshabitacional.com.br/api
```

### No navegador:
```
http://larparatodoshabitacional.com.br
```

✅ **SEM :8080** - Site abre direto!

---

## 🔄 ATUALIZAR O SISTEMA

Quando fizer mudanças no código:

```bash
cd /opt/apps/larparatodos
git pull origin main

# Rebuild e restart
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 🐛 TROUBLESHOOTING

### Ver logs:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

### Backend não responde:
```bash
docker logs larparatodos-backend --tail 200
docker exec larparatodos-backend env | grep DB_
```

### Módulos Apache faltando:
```bash
apachectl -M | grep proxy
```

Precisa ter:
- `proxy_module`
- `proxy_http_module`
- `rewrite_module`

---

## 📌 IMPORTANTE

❌ **NÃO USE MAIS** `docker compose up` sem `-f`
✅ **SEMPRE USE** `docker compose -f docker-compose.prod.yml`

❌ **NÃO SUBA** container `larparatodos-dev`
✅ **APENAS** `larparatodos-frontend` e `larparatodos-backend`

---

## 🔒 SEGURANÇA

Todas as portas estão em **127.0.0.1** - só acessíveis via Apache.

Banco e MinIO **NÃO ficam expostos** na internet.

---

**Sistema 100% produção! 🎉**
