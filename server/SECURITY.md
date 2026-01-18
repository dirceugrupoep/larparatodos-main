# Segurança - Lar Para Todos

## Medidas de Segurança Implementadas

### ✅ Autenticação JWT
- Tokens JWT com expiração de 7 dias
- Validação robusta de tokens
- Verificação de formato Bearer
- Tratamento de erros específicos (expirado, inválido)

### ✅ Middleware de Autenticação
- `authenticateToken` protege rotas sensíveis
- Validação de token em todas as requisições protegidas
- Extração segura do token do header Authorization

### ✅ Hash de Senhas
- Bcrypt com salt rounds = 10
- Senhas nunca são armazenadas em texto plano
- Comparação segura de senhas no login

### ✅ Validação de Dados
- Zod para validação de schemas
- Sanitização de inputs (trim, toLowerCase)
- Limites de tamanho para prevenir DoS
- Validação de email e formato de dados

### ✅ Proteção contra SQL Injection
- Uso de prepared statements (pg com $1, $2, etc)
- Parâmetros sempre passados separadamente
- Nenhuma concatenação de strings SQL

### ✅ Rate Limiting
- Limite geral: 100 requests por IP a cada 15 minutos
- Limite de autenticação: 5 tentativas a cada 15 minutos
- Prevenção de brute force attacks

### ✅ Headers de Segurança (Helmet)
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- E outros headers de segurança HTTP

### ✅ CORS Configurado
- Origem permitida configurável via variável de ambiente
- Métodos HTTP permitidos explicitamente
- Headers permitidos controlados

### ✅ Limite de Payload
- Máximo de 10MB para JSON e URL-encoded
- Prevenção de ataques de tamanho excessivo

### ✅ Tratamento de Erros
- Não exposição de stack traces em produção
- Mensagens de erro genéricas para usuários
- Logs detalhados no servidor

## Rotas Protegidas

### Requerem Autenticação:
- `GET /api/contact` - Listar contatos
- `GET /api/dashboard/stats` - Estatísticas
- `GET /api/dashboard/recent-contacts` - Contatos recentes

### Públicas (mas com rate limiting):
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/login` - Login
- `POST /api/contact` - Criar contato

## Configuração de Segurança

### Variáveis de Ambiente Obrigatórias:
```env
JWT_SECRET=seu-secret-super-seguro-aqui  # OBRIGATÓRIO!
DB_PASSWORD=senha-forte-do-banco
```

⚠️ **IMPORTANTE**: Nunca use o valor padrão `your-secret-key` em produção!

## Boas Práticas Implementadas

1. ✅ Senhas com hash bcrypt
2. ✅ Tokens JWT com expiração
3. ✅ Validação de entrada rigorosa
4. ✅ Prepared statements (SQL injection safe)
5. ✅ Rate limiting
6. ✅ Headers de segurança
7. ✅ CORS configurado
8. ✅ Tratamento de erros seguro
9. ✅ Logs sem informações sensíveis

## Recomendações Adicionais para Produção

1. Usar HTTPS (SSL/TLS)
2. Configurar JWT_SECRET forte e único
3. Implementar refresh tokens
4. Adicionar logging de segurança (Winston, etc)
5. Monitoramento de tentativas de login falhadas
6. Backup regular do banco de dados
7. Firewall e regras de rede
8. Atualizações regulares de dependências

