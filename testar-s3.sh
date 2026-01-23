#!/bin/bash
# ========================================
# TESTAR MINIO/S3 - DIAGNÓSTICO COMPLETO
# ========================================

echo "🔍 TESTANDO CONFIGURAÇÃO DO MINIO/S3..."
echo ""

# 1. Verificar se containers estão rodando
echo "1️⃣ Verificando containers..."
if docker ps | grep -q "larparatodos-minio"; then
    echo "✅ Container MinIO está rodando"
else
    echo "❌ Container MinIO NÃO está rodando!"
    echo "   Execute: docker compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# 2. Verificar saúde do MinIO
echo ""
echo "2️⃣ Verificando saúde do MinIO..."
HEALTH=$(docker inspect --format='{{.State.Health.Status}}' larparatodos-minio 2>/dev/null)
if [ "$HEALTH" = "healthy" ]; then
    echo "✅ MinIO está saudável"
else
    echo "⚠️  MinIO status: $HEALTH"
fi

# 3. Testar acesso direto ao MinIO (interno)
echo ""
echo "3️⃣ Testando acesso direto ao MinIO (porta 9000)..."
if curl -s -I http://127.0.0.1:9000/minio/health/live | grep -q "200 OK"; then
    echo "✅ MinIO responde na porta 9000"
else
    echo "❌ MinIO NÃO responde na porta 9000"
fi

# 4. Verificar se bucket existe
echo ""
echo "4️⃣ Verificando bucket 'associations'..."
BUCKET_CHECK=$(docker exec larparatodos-minio mc ls myminio/ 2>/dev/null | grep associations || echo "not_found")
if [ "$BUCKET_CHECK" != "not_found" ]; then
    echo "✅ Bucket 'associations' existe"
else
    echo "⚠️  Bucket 'associations' pode não existir"
    echo "   Criando bucket..."
    docker exec larparatodos-minio mc alias set myminio http://localhost:9000 minioadmin "$S3_SECRET_KEY" 2>/dev/null
    docker exec larparatodos-minio mc mb myminio/associations 2>/dev/null
    docker exec larparatodos-minio mc anonymous set download myminio/associations 2>/dev/null
    echo "✅ Bucket criado"
fi

# 5. Testar upload de arquivo
echo ""
echo "5️⃣ Testando upload de arquivo de teste..."
TEST_FILE="/tmp/test-minio-$(date +%s).txt"
echo "Teste MinIO - $(date)" > $TEST_FILE

# Upload via mc (MinIO Client)
docker exec -i larparatodos-minio sh -c "cat > /tmp/test.txt && mc cp /tmp/test.txt myminio/associations/test.txt" < $TEST_FILE 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Upload de teste funcionou"
    
    # Testar download
    if curl -s http://127.0.0.1:9000/associations/test.txt | grep -q "Teste MinIO"; then
        echo "✅ Download direto funciona"
    else
        echo "❌ Download direto falhou"
    fi
    
    # Limpar arquivo de teste
    docker exec larparatodos-minio mc rm myminio/associations/test.txt 2>/dev/null
else
    echo "❌ Upload de teste falhou"
fi

rm -f $TEST_FILE

# 6. Testar proxy Apache (se estiver rodando)
echo ""
echo "6️⃣ Testando proxy Apache..."
if systemctl is-active --quiet httpd 2>/dev/null; then
    echo "Apache está rodando"
    
    # Testar /storage
    if curl -s -I http://127.0.0.1/storage/ 2>/dev/null | grep -q "200\|403"; then
        echo "✅ Proxy /storage está funcionando"
    else
        echo "❌ Proxy /storage NÃO está funcionando"
        echo "   Verifique: /etc/httpd/conf.d/larparatodos-proxy.conf"
    fi
else
    echo "⚠️  Apache não está rodando ou não é systemd"
fi

# 7. Verificar variáveis de ambiente do backend
echo ""
echo "7️⃣ Verificando variáveis de ambiente do backend..."
S3_ENDPOINT=$(docker exec larparatodos-backend printenv S3_ENDPOINT 2>/dev/null)
S3_PUBLIC_URL=$(docker exec larparatodos-backend printenv S3_PUBLIC_URL 2>/dev/null)
S3_BUCKET=$(docker exec larparatodos-backend printenv S3_BUCKET 2>/dev/null)

if [ ! -z "$S3_ENDPOINT" ]; then
    echo "✅ S3_ENDPOINT: $S3_ENDPOINT"
else
    echo "❌ S3_ENDPOINT não definido!"
fi

if [ ! -z "$S3_PUBLIC_URL" ]; then
    echo "✅ S3_PUBLIC_URL: $S3_PUBLIC_URL"
else
    echo "❌ S3_PUBLIC_URL não definido!"
fi

if [ ! -z "$S3_BUCKET" ]; then
    echo "✅ S3_BUCKET: $S3_BUCKET"
else
    echo "❌ S3_BUCKET não definido!"
fi

# 8. Verificar logs recentes do MinIO
echo ""
echo "8️⃣ Últimas linhas do log do MinIO:"
docker logs larparatodos-minio --tail 10 2>&1 | grep -v "GET /minio/health" | head -n 5

# Resumo final
echo ""
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo ""
echo "Se tudo estiver ✅, o MinIO está funcionando!"
echo ""
echo "Para testar upload real:"
echo "1. Acesse o painel da associação"
echo "2. Vá em Configurações"
echo "3. Faça upload de um logo"
echo "4. Verifique se a imagem aparece"
echo ""
echo "Ver logs completos:"
echo "  docker logs larparatodos-minio"
echo "  docker logs larparatodos-backend"
echo ""
