@echo off
title Setup GitHub - TreinoAAB
color 0B

echo =============================================
echo  SETUP GITHUB - TREINO SUPORTE / TREINO AAB
echo  Repositorio: williansdavid/TreinoAAB
echo =============================================
echo.

cd /d C:\treinosuporte-main
echo Diretorio atual: %cd%
echo.

:: 1. VERIFICAR SE GIT ESTA INSTALADO
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] Git nao encontrado. Instale o Git em: https://git-scm.com/
    pause
    exit /b 1
)
echo [OK] Git encontrado.
echo.

:: 2. VERIFICAR SE .git JA EXISTE
if exist ".git" (
    echo [AVISO] Repositorio Git ja existe neste diretorio.
    set /p choice="Deseja REINICIAR o repositorio? (S/N): "
    if /i "!choice!"=="S" (
        rmdir /s /q ".git"
        echo [OK] .git removido.
        git init
    ) else (
        echo [OK] Mantendo repositorio existente.
    )
) else (
    git init
    echo [OK] Git inicializado.
)
echo.

:: 3. CRIAR .gitignore
echo [INFO] Criando .gitignore...
(
echo # Dependencias
echo node_modules/
echo .pnp
echo .pnp.js
echo.
echo # Producao / Build
echo dist/
echo build/
echo.
echo # Variaveis de Ambiente
echo .env
echo .env.local
echo .env.development.local
echo .env.test.local
echo .env.production.local
echo.
echo # Logs
echo npm-debug.log*
echo yarn-debug.log*
echo yarn-error.log*
echo.
echo # Editor / IDE
echo .vscode/
echo .idea/
echo *.suo
echo *.ntvs*
echo *.njsproj
echo *.sln
echo *.sw?
echo.
echo # Supabase
echo supabase/.temp/
echo supabase.temp/
echo .supabase/
echo supabase/config.toml
echo.
echo # Sistema
echo .DS_Store
echo Thumbs.db
) > .gitignore
echo [OK] .gitignore criado.
echo.

:: 4. CRIAR BRANCH E ADICIONAR ARQUIVOS
git checkout -b main
echo [OK] Branch main criada.
git add .
echo [OK] Arquivos adicionados ao stage.
echo.

:: 5. COMMIT INICIAL
git commit -m "feat: initial commit - TreinoSuporte full app structure"
echo [OK] Commit inicial realizado.
echo.

:: 6. REMOTE ORIGIN
git remote remove origin 2>nul
git remote add origin https://github.com/williansdavid/TreinoAAB.git
git branch -M main
echo [OK] Remote origin configurado.
echo.

:: 7. PUSH PARA GITHUB
echo [INFO] Enviando para o GitHub...
echo [INFO] Uma janela do navegador pode abrir para autenticacao.
echo.
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo =============================================
    echo  SUCESSO!
    echo  Projeto enviado para:
    echo  https://github.com/williansdavid/TreinoAAB
    echo =============================================
) else (
    echo.
    echo [ERRO] Falha ao enviar para o GitHub.
    echo Verifique sua conexao e credenciais.
)

echo.
pause