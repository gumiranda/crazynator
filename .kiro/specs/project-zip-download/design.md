# Design Document

## Overview

A funcionalidade de download ZIP permite que usuários façam download completo de seus projetos como arquivos compactados. O sistema conecta-se ao sandbox E2B ativo do projeto para extrair todos os arquivos do sistema de arquivos do sandbox, gera um arquivo ZIP e disponibiliza para download através de uma interface integrada.

## Architecture

### High-Level Flow

1. **UI Trigger**: Botão "Download ZIP" no header do projeto
2. **API Processing**: Nova API route `/api/projects/[projectId]/download` que:
   - **Validação**: Verifica permissões do usuário via Clerk auth
   - **Localização do Sandbox**:
     - Busca o fragmento mais recente com `sandboxUrl` não nulo
     - Extrai `sandboxId` da URL usando regex: `hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '')`
   - **Conexão E2B**:
     - Usa `Sandbox.connect(sandboxId)` da E2B SDK
     - Configura timeout usando `sandbox.setTimeout(SANDBOX_TIMEOUT_MS)`
   - **Listagem de Arquivos**:
     - Executa `sandbox.files.list('/', { recursive: true })` para obter todos os arquivos
     - Filtra arquivos vs diretórios usando `file.isDir`
   - **Leitura de Conteúdo**:
     - Para cada arquivo: `sandbox.files.read(filePath)`
     - Processa em batches para evitar sobrecarga de memória
   - **Geração ZIP**:
     - Usa JSZip para criar arquivo em memória
     - Adiciona arquivos mantendo estrutura: `zip.file(relativePath, content)`
   - **Download**: Retorna stream com headers apropriados
3. **Client Handling**: Interface reativa com estados de loading e feedback

### Technology Stack

- **Backend**: Next.js API Routes com Node.js streams
- **E2B Integration**: E2B SDK para acesso ao sandbox e sistema de arquivos
- **ZIP Generation**: `jszip` library para criação de arquivos ZIP
- **Authentication**: Clerk para validação de usuário
- **Database**: Prisma para localizar sandbox ativo do projeto
- **Frontend**: React com estados de loading e error handling

## Components and Interfaces

### 1. API Route Structure

```typescript
// /api/projects/[projectId]/download/route.ts
interface DownloadRequest {
  projectId: string;
  userId: string; // from auth
}

interface DownloadResponse {
  // Binary ZIP file stream
  // Headers: Content-Type: application/zip
  // Headers: Content-Disposition: attachment; filename="project-name-timestamp.zip"
}
```

### 2. UI Components

#### ProjectHeader Enhancement

- Adicionar botão "Download ZIP" ao lado do status de conexão
- Estados: normal, loading, error
- Responsivo para mobile e desktop

#### Download Button Component

```typescript
interface DownloadButtonProps {
  projectId: string;
  projectName: string;
  disabled?: boolean;
}

interface DownloadState {
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}
```

### 3. Service Layer

#### E2B Sandbox Integration

```typescript
interface SandboxFileSystem {
  sandboxId: string;
  files: SandboxFile[];
}

interface SandboxFile {
  path: string;
  content: string;
  isDirectory: boolean;
  size: number;
}

interface ProjectSandboxData {
  id: string;
  name: string;
  sandboxId: string;
  sandboxUrl: string;
  files: SandboxFile[];
}

// Função para extrair sandboxId da URL E2B
function extractSandboxId(sandboxUrl: string): string {
  // URL format: https://3000-sandboxId.e2b.app
  const url = new URL(sandboxUrl);
  const hostname = url.hostname;
  return hostname.replace(/^\d+-/, '').replace(/\.e2b\.app$/, '');
}

// Implementação detalhada da coleta de arquivos
async function collectSandboxFiles(sandboxId: string): Promise<SandboxFile[]> {
  const sandbox = await Sandbox.connect(sandboxId);
  await sandbox.setTimeout(SANDBOX_TIMEOUT_MS);

  // Lista todos os arquivos recursivamente
  const fileList = await sandbox.files.list('/', { recursive: true });

  const files: SandboxFile[] = [];

  // Processa arquivos em batches para evitar sobrecarga
  const BATCH_SIZE = 10;
  for (let i = 0; i < fileList.length; i += BATCH_SIZE) {
    const batch = fileList.slice(i, i + BATCH_SIZE);

    const batchPromises = batch
      .filter((file) => !file.isDir) // Apenas arquivos, não diretórios
      .map(async (file) => {
        try {
          const content = await sandbox.files.read(file.path);
          return {
            path: file.path,
            content: content,
            isDirectory: false,
            size: content.length,
          };
        } catch (error) {
          console.warn(`Failed to read file ${file.path}:`, error);
          return null;
        }
      });

    const batchResults = await Promise.all(batchPromises);
    files.push(...(batchResults.filter(Boolean) as SandboxFile[]));
  }

  return files;
}

// Geração do arquivo ZIP
async function generateProjectZip(files: SandboxFile[], projectName: string): Promise<Buffer> {
  const JSZip = require('jszip');
  const zip = new JSZip();

  // Adiciona cada arquivo ao ZIP mantendo a estrutura
  files.forEach((file) => {
    // Remove leading slash para paths relativos
    const relativePath = file.path.startsWith('/') ? file.path.slice(1) : file.path;
    zip.file(relativePath, file.content);
  });

  // Gera o buffer do ZIP
  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });
}
```

## Data Models

### Database Queries

O sistema utilizará Prisma para localizar o sandbox ativo do projeto:

```typescript
// Buscar projeto e fragmento mais recente com sandbox ativo
const projectData = await prisma.project.findUnique({
  where: {
    id: projectId,
    userId: userId,
  },
  include: {
    messages: {
      include: {
        fragments: {
          where: {
            sandboxUrl: {
              not: null,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    },
  },
});
```

### ZIP Structure

```
project-name-timestamp.zip
├── package.json
├── tsconfig.json
├── next.config.js
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/
│   └── lib/
├── public/
│   └── assets/
├── node_modules/ (NAO INCLUIR)
└── [toda a estrutura do sandbox E2B]
```

## Error Handling

### Client-Side Errors

- **Network Errors**: Retry mechanism com exponential backoff
- **Permission Errors**: Redirect para login ou mensagem de acesso negado
- **File Size Errors**: Mensagem informativa sobre limite de tamanho
- **Timeout Errors**: Mensagem de timeout com opção de retry

### Server-Side Errors

- **Authentication Failures**: 401 Unauthorized
- **Project Not Found**: 404 Not Found
- **Database Errors**: 500 Internal Server Error com logging
- **ZIP Generation Errors**: 500 com fallback para download individual

### Error Recovery

- Implementar retry automático para falhas temporárias
- Fallback para download de fragmentos individuais se ZIP completo falhar
- Logging detalhado para debugging

## Testing Strategy

### Unit Tests

- **ZIP Generation**: Testar criação de arquivos ZIP com diferentes estruturas
- **File Collection**: Testar coleta de dados do projeto e fragmentos
- **Error Handling**: Testar todos os cenários de erro
- **Authentication**: Testar validação de permissões

### Integration Tests

- **API Route**: Testar endpoint completo com dados reais
- **Database Integration**: Testar queries com diferentes estruturas de projeto
- **File Download**: Testar processo completo de download

### E2E Tests

- **User Flow**: Testar fluxo completo do usuário
- **Mobile/Desktop**: Testar responsividade
- **Different Project Types**: Testar com projetos de diferentes tamanhos
- **Error Scenarios**: Testar comportamento em cenários de erro

### Performance Tests

- **Large Projects**: Testar com projetos grandes (muitos fragmentos)
- **Concurrent Downloads**: Testar múltiplos downloads simultâneos
- **Memory Usage**: Monitorar uso de memória durante geração ZIP
- **Response Time**: Garantir tempos de resposta aceitáveis

## Security Considerations

### Authentication & Authorization

- Validar que o usuário tem acesso ao projeto
- Implementar rate limiting para prevenir abuse
- Validar tamanho máximo do projeto para download

### Data Protection

- Não incluir dados sensíveis no ZIP (tokens, senhas)
- Sanitizar nomes de arquivos para prevenir path traversal
- Implementar timeout para prevenir DoS

### File Safety

- Validar conteúdo dos arquivos antes de incluir no ZIP
- Limitar tamanho total do ZIP gerado
- Implementar whitelist de tipos de arquivo permitidos
