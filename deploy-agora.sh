#!/bin/bash
# ========================================
# DEPLOY PRODUÇÃO - LARPARATODOS
# REMOVE DEV E DEIXA SÓ PRODUÇÃO
# ========================================

set -e

echo "🚀 Iniciando deploy de PRODUÇÃO..."

cd /opt/apps/larparatodos

# 1. Parar tudo e limpar
echo ""
echo "1️⃣ Parando containers antigos..."
docker compose down 2>/dev/null || true
docker stop larparatodos-frontend larparatodos-backend larparatodos-dev larparatodos-postgres larparatodos-minio 2>/dev/null || true
docker rm -f larparatodos-frontend larparatodos-backend larparatodos-dev larparatodos-postgres larparatodos-minio larparatodos-minio-setup 2>/dev/null || true

# 2. Pull latest code
echo ""
echo "2️⃣ Atualizando código do Git..."
git pull origin main || echo "⚠️  Git pull falhou, continuando com código local"

# 3. Subir PRODUÇÃO
echo ""
echo "3️⃣ Subindo containers de PRODUÇÃO..."
docker compose -f docker-compose.prod.yml up -d --build

# 4. Aguardar containers ficarem prontos
echo ""
echo "4️⃣ Aguardando containers ficarem saudáveis..."
sleep 10

# 5. Mostrar status
echo ""
echo "5️⃣ Status dos containers:"
docker compose -f docker-compose.prod.yml ps

# 6. Verificar Apache
echo ""
echo "6️⃣ Verificando Apache..."
if systemctl is-active --quiet httpd; then
    echo "✅ Apache está rodando"
    
    # Verificar se o arquivo de proxy existe
    if [ -f /etc/httpd/conf.d/larparatodos-proxy.conf ]; then
        echo "✅ Arquivo de proxy Apache existe"
    else
        echo "⚠️  Arquivo de proxy Apache NÃO existe!"
        echo ""
        echo "Crie o arquivo de proxy:"
        echo "sudo nano /etc/httpd/conf.d/larparatodos-proxy.conf"
        echo ""
        echo "E adicione o conteúdo do DEPLOY_PRODUCAO.md"
    fi
else
    echo "⚠️  Apache não está rodando!"
fi

# 7. Testes rápidos
echo ""
echo "7️⃣ Testando endpoints..."
echo "Frontend (8080 interno):"
curl -I http://127.0.0.1:8080 2>&1 | head -n 1

echo "Backend (3000 interno):"
curl -I http://127.0.0.1:3000 2>&1 | head -n 1 || echo "⚠️  Backend pode estar inicializando"

# 8. Final
echo ""
echo "=========================================="
echo "✅ DEPLOY CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Acesse:"
echo "🌐 http://larparatodoshabitacional.com.br"
echo ""
echo "Ver logs:"
echo "docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Parar tudo:"
echo "docker compose -f docker-compose.prod.yml down"
echo ""
