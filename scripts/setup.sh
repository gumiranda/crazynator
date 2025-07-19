#!/bin/bash

# 🚀 Script de Setup do Ambiente de Desenvolvimento
# Este script configura automaticamente o ambiente para contribuição

set -e

echo "🚀 Configurando ambiente de desenvolvimento..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Node.js está instalado
check_node() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js encontrado: $NODE_VERSION"
        
        # Verificar versão mínima (18.x)
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_error "Node.js versão 18.x ou superior é necessária. Versão atual: $NODE_VERSION"
            exit 1
        fi
    else
        print_error "Node.js não encontrado. Por favor, instale Node.js 18.x ou superior."
        print_status "Visite: https://nodejs.org/"
        exit 1
    fi
}

# Verificar se npm está instalado
check_npm() {
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm encontrado: v$NPM_VERSION"
    else
        print_error "npm não encontrado. Geralmente vem com Node.js."
        exit 1
    fi
}

# Verificar se Git está instalado
check_git() {
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        print_success "Git encontrado: $GIT_VERSION"
    else
        print_error "Git não encontrado. Por favor, instale Git."
        print_status "Visite: https://git-scm.com/"
        exit 1
    fi
}

# Instalar dependências
install_dependencies() {
    print_status "Instalando dependências do projeto..."
    
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependências instaladas com sucesso!"
}

# Configurar arquivo de ambiente
setup_env() {
    if [ -f ".env.local" ]; then
        print_warning "Arquivo .env.local já existe. Pulando configuração."
    else
        if [ -f "env-example.txt" ]; then
            print_status "Criando arquivo .env.local a partir do exemplo..."
            cp env-example.txt .env.local
            print_success "Arquivo .env.local criado!"
            print_warning "IMPORTANTE: Configure suas variáveis de ambiente em .env.local"
        else
            print_warning "Arquivo env-example.txt não encontrado. Crie .env.local manualmente."
        fi
    fi
}

# Configurar Git hooks (se houver)
setup_git_hooks() {
    if [ -d ".githooks" ]; then
        print_status "Configurando Git hooks..."
        git config core.hooksPath .githooks
        chmod +x .githooks/*
        print_success "Git hooks configurados!"
    fi
}

# Verificar configuração do Git
check_git_config() {
    print_status "Verificando configuração do Git..."
    
    GIT_USERNAME=$(git config user.name 2>/dev/null || echo "")
    GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
    
    if [ -z "$GIT_USERNAME" ] || [ -z "$GIT_EMAIL" ]; then
        print_warning "Configuração do Git incompleta."
        echo "Por favor, configure seu nome e email:"
        echo "  git config --global user.name \"Seu Nome\""
        echo "  git config --global user.email \"seu.email@exemplo.com\""
    else
        print_success "Git configurado para: $GIT_USERNAME <$GIT_EMAIL>"
    fi
}

# Verificar se está em um repositório Git
check_git_repo() {
    if git rev-parse --git-dir > /dev/null 2>&1; then
        print_success "Repositório Git detectado"
        
        # Verificar se upstream está configurado
        if git remote get-url upstream > /dev/null 2>&1; then
            UPSTREAM_URL=$(git remote get-url upstream)
            print_success "Upstream configurado: $UPSTREAM_URL"
        else
            print_warning "Upstream não configurado."
            echo "Para contribuir, adicione o repositório original como upstream:"
            echo "  git remote add upstream https://github.com/gumiranda/c.git"
        fi
    else
        print_error "Este não é um repositório Git válido."
        exit 1
    fi
}

# Executar testes de verificação
run_checks() {
    print_status "Executando verificações..."
    
    # Verificar linting
    if npm run lint > /dev/null 2>&1; then
        print_success "Linting passou!"
    else
        print_warning "Problemas de linting encontrados. Execute 'npm run lint:fix' para corrigir."
    fi
    
    # Verificar tipos TypeScript
    if npm run type-check > /dev/null 2>&1; then
        print_success "Verificação de tipos passou!"
    else
        print_warning "Problemas de tipos encontrados. Verifique os erros com 'npm run type-check'."
    fi
    
    # Tentar build
    print_status "Testando build..."
    if npm run build > /dev/null 2>&1; then
        print_success "Build executado com sucesso!"
    else
        print_warning "Build falhou. Execute 'npm run build' para ver os erros."
    fi
}

# Imprimir próximos passos
print_next_steps() {
    echo ""
    echo "🎉 Setup concluído com sucesso!"
    echo ""
    echo "📋 Próximos passos:"
    echo "1. Configure suas variáveis de ambiente em .env.local"
    echo "2. Execute 'npm run dev' para iniciar o servidor de desenvolvimento"
    echo "3. Acesse http://localhost:3000 para ver o projeto"
    echo ""
    echo "📚 Comandos úteis:"
    echo "  npm run dev          - Servidor de desenvolvimento"
    echo "  npm run build        - Build de produção"
    echo "  npm run lint         - Verificar código"
    echo "  npm run lint:fix     - Corrigir problemas automaticamente"
    echo "  npm run format       - Formatar código"
    echo "  npm run type-check   - Verificar tipos TypeScript"
    echo ""
    echo "📖 Documentação:"
    echo "  README.md           - Informações gerais"
    echo "  CONTRIBUTING.md     - Guia de contribuição"
    echo "  docs/COMANDOS-UTEIS.md - Comandos Git e npm"
    echo ""
    echo "🤝 Para contribuir:"
    echo "1. Crie uma branch: git checkout -b feature/sua-feature"
    echo "2. Faça suas mudanças"
    echo "3. Commit: git commit -m 'feat: adiciona nova funcionalidade'"
    echo "4. Push: git push origin feature/sua-feature"
    echo "5. Abra um Pull Request no GitHub"
}

# Função principal
main() {
    echo "🔧 Verificando pré-requisitos..."
    check_node
    check_npm
    check_git
    check_git_repo
    check_git_config
    
    echo ""
    echo "📦 Configurando projeto..."
    install_dependencies
    setup_env
    setup_git_hooks
    
    echo ""
    echo "✅ Executando verificações finais..."
    run_checks
    
    print_next_steps
}

# Executar apenas se o script foi chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi