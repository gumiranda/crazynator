# Dockerfile para Sandbox com Sistema de Geração de Código
FROM node:20-bookworm

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    curl \
    git \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# Criar usuário e diretório
RUN useradd -m -s /bin/bash user
WORKDIR /home/user

# Copiar arquivos de configuração
COPY setup_project.sh /setup_project.sh
COPY project-template/ /home/user/
RUN chmod +x /setup_project.sh

# Configurar propriedades dos arquivos
RUN chown -R user:user /home/user

# Instalar dependências globais
RUN npm install -g npm@latest

USER user

# Instalar dependências do projeto
RUN npm install

# Expor porta do Next.js
EXPOSE 3000