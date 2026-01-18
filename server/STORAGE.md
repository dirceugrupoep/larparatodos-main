# Sistema de Armazenamento de Imagens

Este projeto usa **MinIO** (compatível com S3) para armazenar imagens das associações em um bucket.

## Configuração

### Desenvolvimento (MinIO)

O MinIO está configurado no `docker-compose.yml` e é iniciado automaticamente.

- **Endpoint interno**: `http://minio:9000` (usado pelo backend)
- **Endpoint público**: `http://localhost:9000` (acessível pelo frontend)
- **Console**: `http://localhost:9001` (interface web do MinIO)
- **Credenciais padrão**:
  - Usuário: `minioadmin`
  - Senha: `minioadmin123`
- **Bucket**: `associations`

### Produção (AWS S3)

Para usar AWS S3 em produção, configure as variáveis de ambiente:

```env
S3_ENDPOINT=https://s3.amazonaws.com
S3_PUBLIC_URL=https://s3.amazonaws.com
S3_ACCESS_KEY=sua-access-key
S3_SECRET_KEY=sua-secret-key
S3_BUCKET=nome-do-bucket
S3_REGION=us-east-1
S3_USE_SSL=true
```

## Estrutura

- `src/services/storage.js` - Serviço de armazenamento (abstração S3/MinIO)
- `src/routes/association-upload.js` - Rotas de upload de imagens

## Funcionalidades

- ✅ Upload de logo da associação
- ✅ Upload de capa da associação
- ✅ Validação de tipo de arquivo (apenas imagens)
- ✅ Limite de tamanho (5MB)
- ✅ Exclusão automática de arquivos antigos ao fazer upload de novos
- ✅ URLs públicas para acesso direto às imagens

## Acesso ao Console MinIO

1. Acesse: http://localhost:9001
2. Faça login com as credenciais padrão
3. Visualize e gerencie os arquivos no bucket `associations`

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `S3_ENDPOINT` | Endpoint interno do S3/MinIO | `http://minio:9000` |
| `S3_PUBLIC_URL` | URL pública acessível pelo frontend | `http://localhost:9000` |
| `S3_ACCESS_KEY` | Chave de acesso | `minioadmin` |
| `S3_SECRET_KEY` | Chave secreta | `minioadmin123` |
| `S3_BUCKET` | Nome do bucket | `associations` |
| `S3_REGION` | Região do S3 | `us-east-1` |
| `S3_USE_SSL` | Usar SSL | `false` |

