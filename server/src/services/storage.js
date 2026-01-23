import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Configuração do cliente S3 (compatível com MinIO)
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || 'http://localhost:9000',
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_KEY || 'minioadmin123',
  },
  forcePathStyle: true, // Necessário para MinIO
});

const BUCKET_NAME = process.env.S3_BUCKET || 'associations';

/**
 * Verifica se o bucket existe, se não, cria
 */
async function ensureBucketExists() {
  try {
    // Verificar se o bucket existe tentando fazer um HeadBucket
    const headCommand = new HeadBucketCommand({ Bucket: BUCKET_NAME });
    await s3Client.send(headCommand);
    console.log(`✅ Bucket ${BUCKET_NAME} já existe`);
    return true;
  } catch (error) {
    // Se o erro for 404 ou NotFound, o bucket não existe
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404 || error.Code === 'NoSuchBucket') {
      // Bucket não existe, criar
      try {
        console.log(`📦 Criando bucket ${BUCKET_NAME}...`);
        const createCommand = new CreateBucketCommand({ Bucket: BUCKET_NAME });
        await s3Client.send(createCommand);
        console.log(`✅ Bucket ${BUCKET_NAME} criado com sucesso!`);
        return true;
      } catch (createError) {
        // Se já existe (erro 409), está ok
        if (createError.$metadata?.httpStatusCode === 409 || createError.Code === 'BucketAlreadyOwnedByYou') {
          console.log(`✅ Bucket ${BUCKET_NAME} já existe (criado por outro processo)`);
          return true;
        }
        console.error(`❌ Erro ao criar bucket ${BUCKET_NAME}:`, createError.message || createError);
        return false;
      }
    }
    // Outro erro (permissão, conexão, etc)
    console.warn(`⚠️  Aviso ao verificar bucket ${BUCKET_NAME}:`, error.message || error);
    return false;
  }
}

// Verificar/criar bucket na inicialização
let bucketChecked = false;
export async function initializeBucket() {
  if (!bucketChecked) {
    await ensureBucketExists();
    bucketChecked = true;
  }
}

/**
 * Faz upload de um arquivo para o bucket S3
 * @param {Buffer} fileBuffer - Buffer do arquivo
 * @param {string} fileName - Nome do arquivo
 * @param {string} contentType - Tipo MIME do arquivo
 * @returns {Promise<string>} URL pública do arquivo
 */
export async function uploadToS3(fileBuffer, fileName, contentType) {
  try {
    // Garantir que o bucket existe antes de fazer upload
    await initializeBucket();
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Tornar o arquivo público
    });

    await s3Client.send(command);

    // Retornar URL pública
    // Para MinIO com proxy Apache, usar S3_PUBLIC_URL (já inclui /storage)
    // O proxy Apache mapeia /storage -> http://127.0.0.1:9000/associations
    const publicUrl = process.env.S3_PUBLIC_URL 
      ? `${process.env.S3_PUBLIC_URL}/${fileName}`
      : `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/${BUCKET_NAME}/${fileName}`;
    return publicUrl;
  } catch (error) {
    console.error('Erro ao fazer upload para S3:', error);
    throw new Error('Erro ao fazer upload do arquivo');
  }
}

/**
 * Deleta um arquivo do bucket S3
 * @param {string} fileName - Nome do arquivo (key)
 * @returns {Promise<void>}
 */
export async function deleteFromS3(fileName) {
  try {
    // Extrair apenas o nome do arquivo da URL completa se necessário
    const key = fileName.includes('/') ? fileName.split('/').pop() : fileName;

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Erro ao deletar do S3:', error);
    throw new Error('Erro ao deletar arquivo');
  }
}

/**
 * Gera uma URL assinada para acesso temporário ao arquivo
 * @param {string} fileName - Nome do arquivo (key)
 * @param {number} expiresIn - Tempo de expiração em segundos (padrão: 1 hora)
 * @returns {Promise<string>} URL assinada
 */
export async function getSignedUrlForFile(fileName, expiresIn = 3600) {
  try {
    const key = fileName.includes('/') ? fileName.split('/').pop() : fileName;

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Erro ao gerar URL assinada:', error);
    throw new Error('Erro ao gerar URL do arquivo');
  }
}

/**
 * Verifica se o bucket existe e está acessível
 * @returns {Promise<boolean>}
 */
export async function checkBucketConnection() {
  try {
    // Tentar fazer um upload de teste (arquivo vazio)
    const testKey = `test-${Date.now()}.txt`;
    await uploadToS3(Buffer.from('test'), testKey, 'text/plain');
    await deleteFromS3(testKey);
    return true;
  } catch (error) {
    console.error('Erro ao verificar conexão com bucket:', error);
    return false;
  }
}

