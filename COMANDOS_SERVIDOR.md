# 📋 COMANDOS DO SERVIDOR - REFERÊNCIA RÁPIDA

## 🚀 DEPLOY INICIAL (primeira vez)

```bash
# 1. Clonar repositório
cd /opt/apps
git clone https://github.com/dirceugrupoep/larparatodos-main.git larparatodos
cd larparatodos

# 2. Criar .env
cp .env.example .env
nano .env
# Editar DOMAIN, DB_PASSWORD, JWT_SECRET, S3_SECRET_KEY

# 3. Dar permissão ao script
chmod +x deploy-agora.sh

# 4. Executar deploy
./deploy-agora.sh
```

## 🔄 ATUALIZAR SISTEMA (depois de git push)

```bash
cd /opt/apps/larparatodos
./deploy-agora.sh
```

**OU manual:**

```bash
cd /opt/apps/larparatodos
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

## 👀 MONITORAR

### Ver containers rodando:
```bash
docker ps
```

### Ver logs em tempo real:
```bash
cd /opt/apps/larparatodos
docker compose -f docker-compose.prod.yml logs -f
```

### Ver log de um serviço específico:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 🛑 PARAR TUDO

```bash
cd /opt/apps/larparatodos
docker compose -f docker-compose.prod.yml down
```

## 🔧 CONFIGURAR APACHE (PRIMEIRA VEZ)

```bash
sudo nano /etc/httpd/conf.d/larparatodos-proxy.conf
```

Cole:
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

Reiniciar Apache:
```bash
sudo systemctl restart httpd
```

## 🐛 TROUBLESHOOTING

### Backend não responde:
```bash
docker logs larparatodos-backend --tail 200
docker exec larparatodos-backend env | grep -E 'DB_|JWT'
```

### Frontend não abre:
```bash
docker logs larparatodos-frontend --tail 200
curl -I http://127.0.0.1:8080
```

### Banco não conecta:
```bash
docker logs larparatodos-postgres --tail 100
docker exec larparatodos-postgres pg_isready -U postgres
```

### Ver todas as portas:
```bash
docker compose -f docker-compose.prod.yml ps
ss -lntp | grep -E ':(3000|8080|5432|9000|9001)'
```

### Rebuild completo (limpar cache):
```bash
cd /opt/apps/larparatodos
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

## 💾 BACKUP

### Backup banco de dados:
```bash
docker exec larparatodos-postgres pg_dump -U postgres larparatodos > backup_$(date +%Y%m%d).sql
```

### Restaurar backup:
```bash
cat backup_20260118.sql | docker exec -i larparatodos-postgres psql -U postgres larparatodos
```

## 🔒 FIREWALL (SEGURANÇA)

```bash
# Bloquear portas do Docker para internet (se precisar)
iptables -A INPUT -p tcp --dport 3000 -j DROP
iptables -A INPUT -p tcp --dport 5432 -j DROP
iptables -A INPUT -p tcp --dport 9000 -j DROP
iptables -A INPUT -p tcp --dport 9001 -j DROP
```

## ✅ CHECKLIST DEPLOY

- [ ] .env criado e configurado
- [ ] Portas do Apache liberadas no firewall
- [ ] arquivo larparatodos-proxy.conf criado
- [ ] Apache reiniciado
- [ ] `docker ps` mostra 4-5 containers UP
- [ ] Site abre em http://larparatodoshabitacional.com.br (SEM :8080)
- [ ] API responde em /api
- [ ] Login e cadastro funcionam

---

**IMPORTANTE:**

❌ **NÃO use** `docker compose up` (sem -f)
✅ **SEMPRE use** `docker compose -f docker-compose.prod.yml`

❌ **NÃO suba** `docker-compose.yml` (DEV)
✅ **APENAS** `docker-compose.prod.yml` (PRODUÇÃO)
