# 🚀 Guia de Deploy - Larparatodos no Bravulink

## 📋 Pré-requisitos no Servidor

Certifique-se de que o servidor Bravulink tem:
- Docker instalado (versão 20.10+)
- Docker Compose instalado (versão 2.0+)
- Git instalado
- Portas disponíveis: 80, 3000, 5432, 9000, 9001

## 🔧 Passo a Passo do Deploy

### 1️⃣ Preparar o Código para Git

No seu computador local, inicialize o Git (se ainda não fez):

```bash
cd C:\projetos\larparatodos\larparatodos-main
git init
git add .
git commit -m "Initial commit - Sistema Larparatodos completo"
```

Suba para um repositório Git (GitHub, GitLab, Bitbucket, etc.):

```bash
# Exemplo com GitHub
git remote add origin https://github.com/seu-usuario/larparatodos.git
git branch -M main
git push -u origin main
```

### 2️⃣ No Servidor Bravulink

Conecte-se ao servidor via SSH:

```bash
ssh seu-usuario@seu-servidor-bravulink.com
```

Clone o repositório:

```bash
# Escolha um diretório (exemplo: /home/seu-usuario ou /var/www)
cd /home/seu-usuario
git clone https://github.com/seu-usuario/larparatodos.git
cd larparatodos
```

### 3️⃣ Configurar Variáveis de Ambiente

Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
nano .env  # ou vim .env
```

**IMPORTANTE**: Edite o arquivo `.env` e altere:

```bash
# Substitua pelo seu domínio real
DOMAIN=seu-dominio.com.br

# TROQUE ESTAS SENHAS POR SENHAS FORTES!
DB_PASSWORD=SuaSenhaPostgresAqui123!@#
JWT_SECRET=UmaChaveMuitoSeguraEAleatoria987$%^
S3_SECRET_KEY=SenhaMinioDiferenteAqui456&*()
```

**Dica**: Para gerar senhas seguras, use:

```bash
openssl rand -base64 32
```

### 4️⃣ Build e Iniciar os Containers

Execute o Docker Compose:

```bash
# Build das imagens
docker-compose -f docker-compose.prod.yml build

# Iniciar todos os serviços
docker-compose -f docker-compose.prod.yml up -d
```

### 5️⃣ Verificar Status

Verifique se todos os containers estão rodando:

```bash
docker-compose -f docker-compose.prod.yml ps
```

Você deve ver 5 containers:
- ✅ larparatodos-postgres (running)
- ✅ larparatodos-minio (running)
- ✅ larparatodos-backend (running)
- ✅ larparatodos-frontend (running)
- ⏹️ larparatodos-minio-setup (exited - normal)

Verificar logs se houver problemas:

```bash
# Logs de todos os serviços
docker-compose -f docker-compose.prod.yml logs

# Logs de um serviço específico
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

### 6️⃣ Acessar o Sistema

Abra o navegador e acesse:

- **Frontend**: http://seu-dominio.com.br
- **Backend API**: http://seu-dominio.com.br:3000
- **MinIO Console**: http://seu-dominio.com.br:9001
  - Usuário: minioadmin
  - Senha: a que você definiu em `S3_SECRET_KEY`

### 7️⃣ Login Inicial

**Usuário Admin Padrão:**
- Email: `admin@larparatodos.com`
- Senha: `admin123`

**⚠️ IMPORTANTE**: Altere a senha do admin imediatamente após o primeiro login!

## 🔄 Atualizações do Sistema

Quando fizer alterações no código:

```bash
# No servidor
cd /home/seu-usuario/larparatodos

# Puxar últimas alterações do Git
git pull origin main

# Rebuild e restart dos containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

## 🛑 Parar o Sistema

```bash
docker-compose -f docker-compose.prod.yml stop
```

## 🗑️ Remover Completamente

**⚠️ CUIDADO**: Isso apaga os dados!

```bash
docker-compose -f docker-compose.prod.yml down -v
```

## 🔒 Configuração de HTTPS (SSL)

Para produção, é recomendado usar HTTPS. Você pode:

### Opção 1: Usar Nginx Proxy Manager

1. Instale o Nginx Proxy Manager
2. Configure um proxy reverso para:
   - `seu-dominio.com.br` → `http://localhost:80` (Frontend)
   - `api.seu-dominio.com.br` → `http://localhost:3000` (Backend)
3. Ative SSL com Let's Encrypt

### Opção 2: Usar Traefik

Adicione Traefik ao docker-compose.prod.yml para gerenciamento automático de SSL.

## 📊 Backup do Banco de Dados

### Fazer Backup

```bash
docker exec larparatodos-postgres pg_dump -U postgres larparatodos > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
cat backup_20240118_120000.sql | docker exec -i larparatodos-postgres psql -U postgres larparatodos
```

## 🐛 Troubleshooting

### Erro: "Port already in use"

```bash
# Verificar quais portas estão em uso
sudo lsof -i :80
sudo lsof -i :3000

# Parar serviços conflitantes ou alterar portas no .env
```

### Erro: "Cannot connect to database"

```bash
# Verificar logs do postgres
docker-compose -f docker-compose.prod.yml logs postgres

# Verificar se o container está saudável
docker-compose -f docker-compose.prod.yml ps postgres
```

### Erro: "CORS Policy"

Certifique-se de que `FRONTEND_URL` no backend corresponde ao domínio real.

### Container reiniciando constantemente

```bash
# Ver logs detalhados
docker logs larparatodos-backend --tail 100
```

## 📞 Suporte

Para problemas ou dúvidas:
- Verifique os logs: `docker-compose -f docker-compose.prod.yml logs`
- Consulte a DOCUMENTACAO.md para detalhes técnicos
- Entre em contato com o suporte técnico

## 🎯 Checklist de Deploy

- [ ] Git repository criado e código enviado
- [ ] Servidor com Docker e Docker Compose instalados
- [ ] Código clonado no servidor
- [ ] Arquivo `.env` criado e senhas alteradas
- [ ] Portas 80, 3000, 5432, 9000, 9001 liberadas no firewall
- [ ] Docker Compose build executado com sucesso
- [ ] Containers iniciados e rodando
- [ ] Frontend acessível no navegador
- [ ] Login admin funcionando
- [ ] Senha do admin alterada
- [ ] Backup inicial do banco criado
- [ ] Monitoramento configurado (opcional)

## 🚀 Otimizações Adicionais (Opcional)

### 1. Limite de Recursos

Adicione limites de CPU/memória ao docker-compose.prod.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
```

### 2. Health Checks

Já incluídos para postgres e minio. Adicione para backend se necessário.

### 3. Log Rotation

Configure logrotate para gerenciar logs do Docker:

```bash
sudo nano /etc/docker/daemon.json
```

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### 4. Monitoramento

Considere adicionar:
- Portainer (interface web para Docker)
- Grafana + Prometheus (métricas)
- Uptime Kuma (monitoramento de uptime)

---

✅ **Deploy Completo!** O sistema estará rodando e pronto para uso.

