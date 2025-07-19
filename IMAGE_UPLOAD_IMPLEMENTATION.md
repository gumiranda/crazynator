# Implementação de Upload de Imagens com Cloudflare R2

Este documento descreve a implementação completa da funcionalidade de upload de imagens para o prompt do usuário, utilizando **Cloudflare R2** para armazenamento e permitindo que o agente interprete imagens e screenshots.

## 🎯 Funcionalidades Implementadas

### 1. **Upload de Imagens com Cloudflare R2**
- Upload direto para Cloudflare R2 usando URLs presignadas
- Upload indireto através do servidor (opcional)
- Interface intuitiva para arrastar e soltar imagens
- Suporte a múltiplas imagens por mensagem
- Preview das imagens antes do envio
- Validação de tipos de arquivo (apenas imagens)
- Limite de tamanho (5MB por arquivo)

### 2. **Capacidades de Interpretação Visual**
- Análise de imagens por IA (GPT-4 Vision e Claude Opus)
- Interpretação de screenshots de erros
- Análise de mockups de UI
- Compreensão de diagramas e fluxogramas
- Geração de código baseada em designs visuais

### 3. **Segurança e Performance**
- Autenticação obrigatória para uploads
- URLs presignadas para uploads diretos e seguros
- Validação de tipos de arquivo no servidor
- Nomes de arquivo únicos (UUID)
- Armazenamento global distribuído com Cloudflare R2
- Zero taxas de egress (saída de dados)
- Cache automático e CDN integrada

## 📁 Arquivos Modificados/Criados

### **Schema do Banco de Dados**
- `prisma/schema.prisma`: Adicionado campo `images` como JSON array no modelo Message

### **Cloudflare R2 Integration**
- `src/lib/r2.ts`: Cliente Cloudflare R2 configurado
- `src/app/api/upload/route.ts`: API para upload direto ao R2
- `src/app/api/upload-url/route.ts`: API para gerar URLs presignadas
- `src/app/api/files/[...key]/route.ts`: API para servir arquivos do R2

### **Hooks Customizados**
- `src/hooks/useImageUpload.ts`: Hook para gerenciar uploads (direto e presignado)

### **Componentes de Interface**
- `src/modules/projects/ui/components/message-form.tsx`: Atualizado com funcionalidade de upload
- `src/modules/projects/ui/components/message-card.tsx`: Atualizado para exibir imagens
- `src/modules/projects/ui/components/messages-container.tsx`: Atualizado para passar dados de imagem

### **Processamento pelo Agente**
- `src/modules/messages/server/procedures.ts`: Atualizado para aceitar array de imagens
- `src/inngest/functions.ts`: Modificado para processar mensagens com imagens
- `src/inngest/claude-functions.ts`: Modificado para suporte a análise de imagens

## 🚀 Como Usar

### **Para o Usuário:**
1. Abra um projeto
2. Na caixa de mensagem, você pode:
   - Arrastar e soltar imagens diretamente
   - Clicar no ícone de imagem para selecionar arquivos
   - Digitar texto junto com as imagens
3. As imagens aparecerão como preview antes do envio
4. Envie a mensagem para que o agente analise as imagens

### **Tipos de Imagens Suportadas:**
- Screenshots de erros ou bugs
- Mockups de interface de usuário
- Diagramas e fluxogramas
- Wireframes e designs
- Capturas de tela de aplicações
- Imagens de referência para desenvolvimento

## 🛠 Configuração Necessária

### **1. Configurar Cloudflare R2**
1. **Criar conta no Cloudflare**: cloudflare.com
2. **Criar bucket R2**:
   - Acesse R2 Object Storage no dashboard
   - Clique em "Create bucket"
   - Escolha um nome único para seu bucket
   - Anote o nome do bucket

3. **Configurar CORS Policy**:
   ```json
   [
     {
       "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["Content-Type", "Authorization"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

4. **Criar API Token**:
   - Vá para "Manage R2 API tokens"
   - Clique em "Create API Token"
   - Defina permissões: Object Read & Write
   - Selecione seu bucket específico
   - Anote as credenciais geradas

### **2. Variáveis de Ambiente**
Crie um arquivo `.env` baseado no `env-example.txt`:

```bash
# Banco de dados (PostgreSQL)
DATABASE_URL='postgresql://user:password@host:port/database'

# URL da aplicação
NEXT_PUBLIC_APP_URL='http://localhost:3000'

# Chaves de API para IA
OPENAI_API_KEY='sk-proj-...'
ANTHROPIC_API_KEY='sk-ant-...'

# E2B para sandbox
E2B_API_KEY='e2b_...'

# Clerk para autenticação
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY='pk_test_...'
CLERK_SECRET_KEY='sk_test_...'
NEXT_PUBLIC_CLERK_SIGN_IN_URL='/sign-in'
NEXT_PUBLIC_CLERK_SIGN_UP_URL='/sign-up'
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL='/'
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL='/'

# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT='https://your-account-id.r2.cloudflarestorage.com'
CLOUDFLARE_R2_ACCESS_KEY_ID='your-access-key-id'
CLOUDFLARE_R2_SECRET_ACCESS_KEY='your-secret-access-key'
CLOUDFLARE_R2_BUCKET_NAME='your-bucket-name'
```

### **3. Migração do Banco de Dados**
```bash
# Gerar o cliente Prisma
npx prisma generate

# Aplicar as mudanças no esquema
npx prisma db push
```

### **4. Instalar Dependências**
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
# ou
bun install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🔧 Estrutura Técnica

### **Fluxo de Upload com URLs Presignadas (Recomendado)**
1. **Frontend**: Usuário seleciona/arrasta imagens
2. **Validação**: Tipo e tamanho verificados no frontend
3. **Requisição**: Frontend solicita URL presignada
4. **Geração**: Servidor gera URL presignada válida por 1 hora
5. **Upload Direto**: Arquivo enviado diretamente para Cloudflare R2
6. **Retorno**: URL do arquivo armazenado no R2

### **Fluxo de Upload Indireto (Alternativo)**
1. **Frontend**: Usuário seleciona imagens
2. **Upload**: Arquivo enviado para servidor Next.js
3. **Processamento**: Servidor valida e envia para R2
4. **Retorno**: URL do arquivo no R2

### **Processamento pelo Agente**
1. **Recepção**: tRPC recebe mensagem com array de URLs de imagens
2. **Formatação**: URLs das imagens incluídas no contexto da mensagem
3. **Análise**: GPT-4.1 ou Claude Opus analisam as imagens via URLs
4. **Resposta**: Agente gera código/soluções baseadas nas imagens

### **Vantagens do Cloudflare R2**
- **Zero egress fees**: Sem cobrança por download de dados
- **Performance global**: CDN integrada da Cloudflare
- **Compatibilidade S3**: Usa SDKs AWS existentes
- **Escalabilidade**: Sem limites de armazenamento
- **Segurança**: URLs presignadas com expiração

## 🎨 Interface de Usuário

### **Componentes Visuais:**
- Área de drag & drop com feedback visual
- Preview das imagens com botão de remoção
- Ícone de imagem na barra de ferramentas
- Indicador de loading durante upload
- Exibição das imagens nas mensagens do usuário

### **Estados de Interface:**
- **Normal**: Campo de texto padrão
- **Dragging**: Highlight da área de drop
- **Uploading**: Spinner de loading (presigned é mais rápido)
- **Preview**: Miniaturas das imagens
- **Error**: Mensagens de erro para uploads inválidos

## 🔒 Segurança

### **Validações Implementadas:**
- Autenticação obrigatória (Clerk)
- Tipos de arquivo permitidos: jpg, jpeg, png, gif, webp
- Tamanho máximo: 5MB por arquivo
- URLs presignadas com expiração (1 hora)
- Validação no servidor e cliente

### **Proteções:**
- URLs presignadas temporárias e específicas
- Nomes de arquivo únicos (UUID)
- CORS policy restritiva configurável
- Não execução de arquivos enviados
- Metadata de upload incluindo userId

## 📝 Exemplos de Uso

### **1. Debug de Erro:**
```
Usuário: [Upload de screenshot do erro] "Help me fix this error"
Agente: "I can see a TypeError in your React component on line 15. The issue is..."
```

### **2. Implementação de Design:**
```
Usuário: [Upload de mockup] "Implement this design"
Agente: "I can see a modern dashboard layout with a sidebar. Let me create the components..."
```

### **3. Análise de Código:**
```
Usuário: [Upload de código com highlight] "Why isn't this working?"
Agente: "Looking at your code, I can see the issue in the highlighted section..."
```

## 🚀 Próximos Passos para Deploy

1. **Configure Cloudflare R2**:
   - Crie bucket e configure CORS
   - Gere API tokens
   - Configure domínio personalizado (opcional)

2. **Configure as variáveis de ambiente**
3. **Execute a migração do banco**: `npx prisma db push`
4. **Teste o upload**: Faça upload de uma imagem de teste
5. **Verifique o processamento**: Envie uma mensagem com imagem
6. **Monitore os logs**: Verifique se o agente está processando corretamente

## 🐛 Solução de Problemas

### **Upload falha:**
- Verifique se as credenciais R2 estão corretas
- Confirme se o bucket existe e está acessível
- Verifique a CORS policy do bucket
- Confirme se a autenticação está funcionando

### **Agente não interpreta imagens:**
- Confirme se `OPENAI_API_KEY` ou `ANTHROPIC_API_KEY` estão configuradas
- Verifique se as URLs das imagens estão acessíveis
- Monitore os logs do Inngest
- Verifique se `NEXT_PUBLIC_APP_URL` está correto

### **Imagens não aparecem:**
- Verifique se a API `/api/files/[...key]` está funcionando
- Confirme se o bucket R2 está acessível
- Teste o acesso direto às URLs das imagens

## ✅ Status da Implementação

- ✅ **Schema do banco atualizado**
- ✅ **Cliente Cloudflare R2 configurado**
- ✅ **APIs de upload implementadas (direto e presignado)**
- ✅ **API para servir arquivos do R2**
- ✅ **Interface de usuário completa**
- ✅ **Processamento pelo agente configurado**
- ✅ **Suporte a múltiplas imagens**
- ✅ **Validação e segurança**
- ✅ **URLs presignadas para performance**
- ⏳ **Aguardando configuração do Cloudflare R2**
- ⏳ **Aguardando configuração das variáveis de ambiente**
- ⏳ **Aguardando migração do banco**

A implementação está **100% completa** em código. Apenas a configuração do Cloudflare R2 e das variáveis de ambiente é necessária para ativação completa da funcionalidade.

## 💰 Vantagens de Custo

- **Zero egress fees**: Economia significativa em downloads
- **Preços competitivos**: Armazenamento mais barato que S3
- **CDN incluída**: Performance global sem custo adicional
- **Sem surpresas**: Preços previsíveis e transparentes