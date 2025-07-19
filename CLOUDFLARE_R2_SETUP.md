# 🔧 Configuração Rápida do Cloudflare R2

Este guia mostra como configurar o Cloudflare R2 em poucos minutos para usar a funcionalidade de upload de imagens.

## 📋 Pré-requisitos

- Conta no Cloudflare (gratuita) - [cloudflare.com](https://cloudflare.com)
- Projeto Next.js já configurado

## 🚀 Passo a Passo

### 1. **Criar Bucket R2**

1. Acesse o [Dashboard Cloudflare](https://dash.cloudflare.com)
2. No menu lateral, clique em **"R2 Object Storage"**
3. Clique em **"Create bucket"**
4. Escolha um nome único (ex: `meu-projeto-images`)
5. Deixe as outras opções padrão
6. Clique em **"Create bucket"**

### 2. **Configurar CORS Policy**

1. No bucket criado, vá para a aba **"Settings"**
2. Role até **"CORS Policy"**
3. Clique em **"Add CORS Policy"**
4. Cole esta configuração:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["Content-Type", "Authorization"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

5. **Importante**: Substitua `your-domain.com` pelo seu domínio de produção
6. Clique em **"Save"**

### 3. **Gerar API Token**

1. Na página do R2, clique em **"Manage R2 API tokens"**
2. Clique em **"Create API token"**
3. Configure assim:
   - **Token name**: `meu-projeto-uploads`
   - **Permissions**: `Object Read & Write`
   - **Specify bucket**: Selecione seu bucket
   - **TTL**: Deixe padrão ou configure conforme necessário
4. Clique em **"Create API token"**

### 4. **Copiar Credenciais**

Na próxima tela, você verá 4 valores importantes:

```bash
# Anote estes valores:
Token Value: [não é usado neste projeto]
Access Key ID: xxxxxxxxxx
Secret Access Key: xxxxxxxxxx  
Endpoint: https://xxxxxxxxxx.r2.cloudflarestorage.com
```

### 5. **Configurar Variáveis de Ambiente**

No seu arquivo `.env`:

```bash
# Cloudflare R2 Configuration
CLOUDFLARE_R2_ENDPOINT='https://xxxxxxxxxx.r2.cloudflarestorage.com'
CLOUDFLARE_R2_ACCESS_KEY_ID='seu-access-key-id'
CLOUDFLARE_R2_SECRET_ACCESS_KEY='sua-secret-access-key'
CLOUDFLARE_R2_BUCKET_NAME='nome-do-seu-bucket'
```

### 6. **Testar Configuração**

```bash
# Gerar cliente Prisma
npx prisma generate

# Aplicar migrations
npx prisma db push

# Iniciar projeto
npm run dev
```

## ✅ Verificar se Funciona

1. Abra `http://localhost:3000`
2. Faça login
3. Crie um projeto
4. Tente fazer upload de uma imagem
5. Verifique se aparece no bucket R2

## 🐛 Problemas Comuns

### **Erro CORS**
- Verifique se adicionou `http://localhost:3000` na CORS policy
- Confirme se salvou a policy

### **Credenciais inválidas**
- Verifique se copiou corretamente o Access Key ID e Secret
- Confirme se o endpoint está correto

### **Bucket não encontrado**
- Verifique se o nome do bucket no `.env` está correto
- Confirme se o token tem acesso ao bucket específico

### **Upload falha**
- Verifique se o arquivo é uma imagem válida
- Confirme se o arquivo tem menos de 5MB

## 💰 Custo

O Cloudflare R2 é muito econômico:

- **Armazenamento**: $0.015 por GB/mês
- **Operações**: Primeira milhão grátis/mês
- **Egress**: **GRATUITO** (grande vantagem!)

Para um projeto pequeno/médio, o custo é praticamente zero.

## 🔒 Segurança

Para produção, considere:

1. **Domínio personalizado**: Configure um domínio próprio
2. **CORS restritivo**: Remova `*` e especifique domínios exatos
3. **Rate limiting**: Configure limites de upload
4. **Autenticação**: Já implementada com Clerk

## 📞 Suporte

Se tiver problemas:

1. Verifique a documentação: [developers.cloudflare.com/r2/](https://developers.cloudflare.com/r2/)
2. Consulte os logs do browser (F12)
3. Verifique os logs do Next.js no terminal

---

**✨ Pronto!** Sua aplicação agora pode fazer upload de imagens para o Cloudflare R2 com performance global e zero taxas de egress!