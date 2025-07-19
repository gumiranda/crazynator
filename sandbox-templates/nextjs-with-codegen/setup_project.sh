#!/bin/bash

# Script de Setup para Projeto com Geração Automatizada de Código
echo "🚀 Inicializando projeto com sistema de geração automatizada..."

# Função para verificar se o servidor está rodando
function ping_server() {
    counter=0
    response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
    while [[ ${response} -ne 200 ]]; do
        let counter++
        if  (( counter % 20 == 0 )); then
            echo "⏳ Aguardando servidor iniciar..."
            sleep 0.1
        fi
        response=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000")
    done
    echo "✅ Servidor Next.js está rodando em http://localhost:3000"
}

# Navegar para o diretório do usuário
cd /home/user

# Verificar se é um projeto novo ou existente
if [ ! -f "package.json" ]; then
    echo "📦 Criando novo projeto Next.js com sistema de geração..."
    
    # Copiar template base
    cp -r /project-template/* . 2>/dev/null || true
    cp -r /project-template/.* . 2>/dev/null || true
    
    # Instalar dependências
    echo "📥 Instalando dependências..."
    npm install
    
    echo "🎯 Projeto criado com sucesso!"
    echo ""
    echo "📋 Comandos disponíveis para geração de código:"
    echo "  npm run generate          # Menu principal"
    echo "  npm run gen:component     # Gerar componente React"
    echo "  npm run gen:page          # Gerar página Next.js" 
    echo "  npm run gen:module        # Gerar módulo completo"
    echo "  npm run gen:trpc          # Gerar roteador tRPC"
    echo "  npm run gen:hook          # Gerar hook customizado"
    echo "  npm run gen:store         # Gerar store Zustand"
    echo "  npm run gen:ai            # Templates IA-otimizados"
    echo ""
else
    echo "📁 Projeto existente detectado"
fi

# Garantir que os templates estão atualizados
if [ -d "/project-template/plop-templates" ]; then
    echo "🔄 Atualizando templates de geração..."
    cp -r /project-template/plop-templates . 2>/dev/null || true
    cp /project-template/plopfile.js . 2>/dev/null || true
fi

# Iniciar o servidor em background
echo "🚀 Iniciando servidor Next.js..."
ping_server &
npm run dev -- --turbopack