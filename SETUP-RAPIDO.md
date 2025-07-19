# ⚡ Setup Rápido para Contribuidores

Este é um guia rápido para configurar o ambiente e começar a contribuir em poucos minutos.

## 🚀 Setup Automático (Recomendado)

```bash
# 1. Clone seu fork
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO

# 2. Execute o script de setup automático
./scripts/setup.sh
```

O script fará automaticamente:
- ✅ Verificação de pré-requisitos (Node.js, npm, Git)
- ✅ Instalação de dependências
- ✅ Configuração de arquivos de ambiente
- ✅ Verificação de configuração Git
- ✅ Testes de build e linting

## 🔧 Setup Manual

Se preferir configurar manualmente:

```bash
# 1. Clone e configure
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO
git remote add upstream https://github.com/gumiranda/c.git

# 2. Instale dependências
npm install

# 3. Configure ambiente
cp env-example.txt .env.local

# 4. Inicie desenvolvimento
npm run dev
```

## 📝 Primeiro Pull Request

```bash
# 1. Crie uma branch
git checkout -b feature/minha-primeira-contribuicao

# 2. Faça suas mudanças
# ... edite arquivos ...

# 3. Commit e push
git add .
git commit -m "feat: minha primeira contribuição"
git push origin feature/minha-primeira-contribuicao

# 4. Abra PR no GitHub
```

## 🆘 Problemas Comuns

### Node.js não encontrado
```bash
# Instale Node.js 18+ de https://nodejs.org/
node --version  # deve retornar v18.x.x ou superior
```

### Erro de permissão no script
```bash
chmod +x scripts/setup.sh
```

### Dependências não instalam
```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Build falha
```bash
# Verifique erros
npm run lint
npm run type-check
npm run build
```

## 📋 Checklist Rápido

- [ ] Node.js 18+ instalado
- [ ] Git configurado (nome e email)
- [ ] Fork do repositório criado
- [ ] Clone local feito
- [ ] Upstream adicionado
- [ ] Dependências instaladas
- [ ] .env.local configurado
- [ ] `npm run dev` funcionando

## 🔗 Links Úteis

- [README completo](README.md)
- [Guia de contribuição](CONTRIBUTING.md)
- [Comandos úteis](docs/COMANDOS-UTEIS.md)
- [Templates de Issues](.github/ISSUE_TEMPLATE/)
- [Template de PR](.github/pull_request_template.md)

---

💡 **Dica**: Execute `./scripts/setup.sh` sempre que clonar o projeto em uma nova máquina!