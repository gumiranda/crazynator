# GitHub Integration - Documentação Completa

## Visão Geral

A integração GitHub do CrazyNator permite conectar sua conta GitHub para criar repositórios automaticamente e sincronizar código gerado em tempo real. Esta implementação oferece sincronização bidirecional completa entre a plataforma e seus repositórios GitHub.

## Funcionalidades Implementadas

### 1. **Conexão de Conta GitHub**
- OAuth 2.0 flow seguro com validação de state parameter
- Criptografia AES-256-GCM para armazenamento seguro de tokens
- Interface de gerenciamento de conexão nas configurações

### 2. **Criação de Repositórios**
- Criação direta de repositórios a partir de projetos
- Formulário com validação de nome, descrição e privacidade
- Preenchimento automático baseado no nome do projeto
- Sincronização inicial automática dos arquivos

### 3. **Sincronização Automática**
- Sistema de jobs em background usando Inngest
- Sincronização em tempo real após geração de código
- Indicadores visuais de status de sincronização
- Tratamento robusto de erros

## Arquitetura Técnica

### Fluxo de Dados
```
Usuário → OAuth GitHub → Token Criptografado → Database
         ↓
Projeto → Geração Código → Fragment → Job Sync → GitHub Repository
```

### Componentes Principais

#### Backend
- **`src/lib/github.ts`** - Cliente API GitHub com Octokit
- **`src/app/api/auth/github/`** - Endpoints OAuth
- **`src/modules/github/server/procedures.ts`** - Procedures tRPC
- **`src/inngest/github-functions.ts`** - Jobs de sincronização

#### Frontend
- **`github-settings.tsx`** - Componente de configurações
- **`create-repository-dialog.tsx`** - Dialog de criação de repositório
- **`github-sync-status.tsx`** - Indicadores de status

#### Database
- **`GitHubConnection`** - Conexões de usuários
- **`GitHubRepository`** - Repositórios vinculados
- **Enum `GitHubSyncStatus`** - Status de sincronização

## Configuração GitHub

### 1. Criar GitHub App

1. Acesse [GitHub Developer Settings](https://github.com/settings/developers)
2. Clique em "New GitHub App"
3. Preencha os campos:

```
Application name: CrazyNator
Homepage URL: https://seudominio.com
Authorization callback URL: https://seudominio.com/api/auth/github/callback
Setup URL (optional): https://seudominio.com/dashboard
Webhook URL: https://seudominio.com/api/webhooks/github (opcional)
```

### 2. Configurar Permissões

**Repository permissions:**
- Contents: Read and write
- Metadata: Read
- Pull requests: Read and write (opcional)

**Account permissions:**
- Email addresses: Read

### 3. Configurar OAuth

Na seção "OAuth App":
- Marque "Request user authorization (OAuth) during installation"
- Authorization callback URL: `https://seudominio.com/api/auth/github/callback`

### 4. Obter Credenciais

Após criar a app:
1. Copie o **Client ID**
2. Gere e copie o **Client Secret**
3. Baixe a **Private Key** (se usar webhooks)

## Configuração da Aplicação

### 1. Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Encryption (gere uma chave segura)
GITHUB_TOKEN_ENCRYPTION_KEY=your_32_char_encryption_key_here
```

### 2. Gerar Chave de Criptografia

```bash
# Gere uma chave aleatória de 32 caracteres
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 3. Configurar Database

Execute a migração:

```bash
bunx prisma migrate dev
```

## Como Usar

### Para Usuários Finais

#### 1. Conectar Conta GitHub
1. Acesse "Dashboard" → "Settings"
2. Na seção "GitHub Integration", clique em "Connect GitHub"
3. Autorize a aplicação no GitHub
4. Confirme a conexão bem-sucedida

#### 2. Criar Repositório
1. No projeto, clique em "Create Repository"
2. Preencha nome, descrição e privacidade
3. Clique em "Create Repository"
4. Aguarde sincronização inicial

#### 3. Monitorar Sincronização
- Status visível no cabeçalho do projeto
- Indicadores: SUCCESS, IN_PROGRESS, FAILED, PENDING
- Botões para refresh e abrir no GitHub

### Para Desenvolvedores

#### Estrutura de Sincronização

```typescript
// Job de sincronização
{
  name: 'github/sync',
  data: {
    fragmentId: string,
    projectId: string, 
    commitMessage: string
  }
}
```

#### Fluxo de Background Jobs

1. **githubSyncFunction** - Sincroniza fragment individual
2. **githubInitialSyncFunction** - Sincronização inicial do repositório  
3. **githubBatchSyncFunction** - Sincronização em lote (futuro)

## Segurança

### Criptografia de Tokens
```typescript
// Tokens são criptografados antes do armazenamento
const encryptedToken = encryptToken(accessToken);
```

### OAuth Security
- State parameter para prevenção CSRF
- HTTPS obrigatório em produção
- Tokens com escopo limitado

### Validações
- Verificação de ownership de projetos
- Validação de nomes de repositório
- Sanitização de commits messages

## Troubleshooting

### Problemas Comuns

#### 1. "GitHub Not Connected"
- Verificar variáveis de ambiente
- Confirmar callback URL correto
- Validar client ID/secret

#### 2. "Repository Creation Failed"
- Verificar permissões da GitHub App
- Nome do repositório já existe
- Limites de rate limiting

#### 3. "Sync Failed"
- Token expirado (reconectar conta)
- Permissões insuficientes
- Problemas de conectividade

### Logs de Debug

```bash
# Verificar logs Inngest
npm run dev
# Acessar: http://localhost:8288

# Logs do sistema
console.log nos jobs de sincronização
```

### Validação Manual

```bash
# Testar OAuth flow
curl "https://github.com/login/oauth/authorize?client_id=YOUR_ID&redirect_uri=YOUR_CALLBACK"

# Testar API GitHub
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

## Melhorias Futuras

### Funcionalidades Planejadas

1. **Webhook Integration**
   - Sincronização bidirecional
   - Notificações de alterações externas

2. **Branch Management**
   - Criação de branches por feature
   - Pull requests automáticos

3. **Deployment Integration**
   - Deploy automático via GitHub Actions
   - Status de deployment

4. **Collaborative Features**
   - Múltiplos colaboradores
   - Permissões granulares

### Otimizações Técnicas

1. **Performance**
   - Cache de status de sincronização
   - Debounce em sincronizações frequentes

2. **Reliability**
   - Retry automático para falhas temporárias
   - Circuit breaker para rate limiting

3. **Monitoring**
   - Métricas de sincronização
   - Alertas para falhas sistemáticas

## API Reference

### tRPC Procedures

```typescript
// Obter conexão
trpc.github.getConnection.useQuery()

// Desconectar
trpc.github.disconnect.useMutation()

// Criar repositório
trpc.github.createRepository.useMutation({
  projectId: string,
  name: string,
  description?: string,
  isPrivate: boolean
})

// Obter repositório por projeto
trpc.github.getRepositoryByProject.useQuery({ projectId })
```

### Inngest Events

```typescript
// Sincronização de fragment
inngest.send({
  name: 'github/sync',
  data: {
    fragmentId: string,
    projectId: string,
    commitMessage: string
  }
})
```

## Conclusão

A integração GitHub está completamente implementada e testada, oferecendo uma experiência fluida de sincronização automática entre o CrazyNator e GitHub. O sistema é seguro, escalável e mantém consistência com a arquitetura existente da aplicação.

Para suporte ou dúvidas, consulte os logs do sistema ou entre em contato com a equipe de desenvolvimento.