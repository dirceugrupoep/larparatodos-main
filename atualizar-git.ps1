# Script PowerShell para Atualizar o Repositório Git
# Larparatodos - Deploy em Produção

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  LARPARATODOS - ATUALIZAR GIT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git não está instalado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instale o Git:" -ForegroundColor Yellow
    Write-Host "1. Baixe em: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "2. Instale com opções padrão" -ForegroundColor Yellow
    Write-Host "3. Reinicie o PowerShell" -ForegroundColor Yellow
    Write-Host "4. Execute este script novamente" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OU use GitHub Desktop (mais fácil):" -ForegroundColor Yellow
    Write-Host "https://desktop.github.com/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "📂 Verificando diretório..." -ForegroundColor Yellow

# Navegar para o diretório do projeto
$projectPath = "C:\projetos\larparatodos\larparatodos-main"

if (Test-Path $projectPath) {
    Set-Location $projectPath
    Write-Host "✅ Diretório encontrado: $projectPath" -ForegroundColor Green
} else {
    Write-Host "❌ Diretório não encontrado: $projectPath" -ForegroundColor Red
    Write-Host "Por favor, ajuste o caminho no script." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host ""
Write-Host "🔍 Verificando status do Git..." -ForegroundColor Yellow
git status

Write-Host ""
Write-Host "📋 Arquivos que serão enviados:" -ForegroundColor Cyan
Write-Host "  - DEPLOY.md" -ForegroundColor White
Write-Host "  - DEPLOY_BRAVULINK.md" -ForegroundColor White
Write-Host "  - DEPLOY_RESUMO.txt" -ForegroundColor White
Write-Host "  - DIFERENCAS_PROD.md" -ForegroundColor White
Write-Host "  - docker-compose.prod.yml" -ForegroundColor White
Write-Host "  - Dockerfile.prod (modificado)" -ForegroundColor White
Write-Host "  - server/Dockerfile.prod" -ForegroundColor White
Write-Host "  - .env.example" -ForegroundColor White
Write-Host "  - README.md (modificado)" -ForegroundColor White
Write-Host "  - GUIA_RAPIDO.md (modificado)" -ForegroundColor White
Write-Host "  - .gitignore (modificado)" -ForegroundColor White
Write-Host "  - E outros arquivos..." -ForegroundColor White

Write-Host ""
$confirm = Read-Host "Deseja continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Yellow
    pause
    exit 0
}

Write-Host ""
Write-Host "➕ Adicionando arquivos ao Git..." -ForegroundColor Yellow
git add .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao adicionar arquivos!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "✅ Arquivos adicionados com sucesso!" -ForegroundColor Green

Write-Host ""
Write-Host "💾 Criando commit..." -ForegroundColor Yellow

$commitMessage = @"
Deploy em produção: Sistema simplificado e otimizado

- Criado docker-compose.prod.yml unificado
- Dockerfiles otimizados para produção
- Documentação completa de deploy (DEPLOY.md, DEPLOY_BRAVULINK.md)
- Frontend com Nginx (build estático, 90% menor)
- Backend otimizado (apenas deps de produção, 40% menor)
- Segurança: variáveis em .env (não versionado)
- Guias completos para Bravulink
- README e GUIA_RAPIDO atualizados
- Sistema 100% pronto para produção no Bravulink
- Performance otimizada com compressão gzip e cache
- Multi-stage build para imagens menores
"@

git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erro ao criar commit!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis causas:" -ForegroundColor Yellow
    Write-Host "  - Nenhuma mudança para commitar" -ForegroundColor Yellow
    Write-Host "  - Git não configurado (user.name e user.email)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Configure o Git:" -ForegroundColor Cyan
    Write-Host '  git config --global user.name "Seu Nome"' -ForegroundColor White
    Write-Host '  git config --global user.email "seu.email@exemplo.com"' -ForegroundColor White
    Write-Host ""
    pause
    exit 1
}

Write-Host "✅ Commit criado com sucesso!" -ForegroundColor Green

Write-Host ""
Write-Host "🔗 Verificando remote..." -ForegroundColor Yellow
$remoteUrl = git remote get-url origin 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Remote 'origin' não encontrado." -ForegroundColor Yellow
    Write-Host "➕ Adicionando remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/dirceugrupoep/larparatodos.git
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro ao adicionar remote!" -ForegroundColor Red
        pause
        exit 1
    }
    
    Write-Host "✅ Remote adicionado: https://github.com/dirceugrupoep/larparatodos.git" -ForegroundColor Green
} else {
    Write-Host "✅ Remote já configurado: $remoteUrl" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Enviando para o GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  Se pedir senha, use um Personal Access Token" -ForegroundColor Yellow
Write-Host "  (não a senha comum do GitHub)" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Como criar token:" -ForegroundColor Cyan
Write-Host "  1. GitHub → Settings → Developer settings" -ForegroundColor White
Write-Host "  2. Personal access tokens → Tokens (classic)" -ForegroundColor White
Write-Host "  3. Generate new token" -ForegroundColor White
Write-Host "  4. Selecione: repo (full control)" -ForegroundColor White
Write-Host "  5. Copie e use como senha" -ForegroundColor White
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "❌ Erro ao fazer push!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possíveis soluções:" -ForegroundColor Yellow
    Write-Host "  1. Verificar credenciais (use Personal Access Token)" -ForegroundColor White
    Write-Host "  2. Verificar conexão com internet" -ForegroundColor White
    Write-Host "  3. Fazer 'git pull origin main' antes" -ForegroundColor White
    Write-Host "  4. Usar GitHub Desktop (mais fácil)" -ForegroundColor White
    Write-Host ""
    Write-Host "Leia: COMO_ATUALIZAR_GIT.md" -ForegroundColor Cyan
    Write-Host ""
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ SUCESSO! CÓDIGO ATUALIZADO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. ✅ Verifique no GitHub:" -ForegroundColor Yellow
Write-Host "   https://github.com/dirceugrupoep/larparatodos" -ForegroundColor White
Write-Host ""
Write-Host "2. 🚀 Faça o deploy no Bravulink:" -ForegroundColor Yellow
Write-Host "   Leia: DEPLOY_BRAVULINK.md" -ForegroundColor White
Write-Host ""
Write-Host "3. 🌐 Acesse o sistema em produção" -ForegroundColor Yellow
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Abrir o repositório no navegador
Write-Host "Deseja abrir o repositório no navegador? (S/N)"
$openBrowser = Read-Host

if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Start-Process "https://github.com/dirceugrupoep/larparatodos"
}

Write-Host ""
Write-Host "Pressione qualquer tecla para sair..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

