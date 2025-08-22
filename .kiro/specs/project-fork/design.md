# Design Document

## Overview

A feature de fork de projetos permite que usuários criem cópias independentes de seus próprios projetos, incluindo todas as mensagens, fragmentos de código e configurações. O fork cria uma nova instância completamente separada que pode ser modificada sem afetar o projeto original.

## Architecture

### Database Schema Changes

O schema atual do Prisma será estendido para suportar forks:

```prisma
model Project {
  id        String   @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Novos campos para fork
  forkedFromId String?  // ID do projeto original (null se não for fork)
  forkedFrom   Project? @relation("ProjectForks", fields: [forkedFromId], references: [id])
  forks        Project[] @relation("ProjectForks")

  messages Message[]
}
```

### API Layer

Novos procedimentos tRPC serão adicionados ao `projectsRouter`:

- `fork` - Cria um fork de um projeto existente
- `getForkInfo` - Retorna informações sobre o fork (projeto original, data de fork)

### UI Components

Novos componentes serão criados:

- `ForkProjectDialog` - Modal para configurar o fork
- `ForkBadge` - Badge visual para identificar forks
- `ForkButton` - Botão para iniciar o fork

## Components and Interfaces

### 1. Backend Components

#### Fork Service (`src/lib/services/fork.ts`)

```typescript
interface ForkProjectInput {
  projectId: string;
  name?: string;
  description?: string;
}

interface ForkResult {
  forkedProject: Project;
  copiedMessages: number;
  copiedFragments: number;
}

class ForkService {
  async forkProject(input: ForkProjectInput, userId: string): Promise<ForkResult>;
  async validateForkPermissions(projectId: string, userId: string): Promise<boolean>;
  async copyProjectData(originalProject: Project, newProject: Project): Promise<void>;
}
```

#### tRPC Procedures

```typescript
// src/modules/projects/server/procedures.ts
fork: protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
      name: z.string().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Implementação do fork
  });

getForkInfo: protectedProcedure
  .input(
    z.object({
      projectId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    // Retorna informações do fork
  });
```

### 2. Frontend Components

#### ForkProjectDialog Component

```typescript
interface ForkProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForkComplete: (forkedProject: Project) => void;
}

// Localização: src/modules/projects/ui/components/fork-project-dialog.tsx
```

#### ForkBadge Component

```typescript
interface ForkBadgeProps {
  project: Project;
  showOriginalInfo?: boolean;
}

// Localização: src/modules/projects/ui/components/fork-badge.tsx
```

#### Updated ProjectHeader Component

O componente `ProjectHeader` será atualizado para incluir a opção de fork no dropdown menu.

#### Updated ProjectsList Component

O componente `ProjectsList` será atualizado para mostrar badges de fork.

## Data Models

### Project Model Extensions

```typescript
interface Project {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  forkedFromId?: string;
  forkedFrom?: Project;
  forks?: Project[];
  messages: Message[];
}
```

### Fork Metadata

```typescript
interface ForkInfo {
  isFork: boolean;
  originalProject?: {
    id: string;
    name: string;
    createdAt: Date;
  };
  forkedAt: Date;
  totalForks: number;
}
```

## Error Handling

### Validation Errors

- **Projeto não encontrado**: Quando o projeto a ser forkado não existe
- **Permissão negada**: Quando o usuário tenta forkar projeto de outro usuário
- **Nome duplicado**: Quando o nome do fork já existe para o usuário
- **Limite de forks**: Se implementarmos limite de forks por usuário

### Database Errors

- **Falha na transação**: Rollback automático se alguma parte do fork falhar
- **Constraint violations**: Tratamento de violações de chave única
- **Connection timeouts**: Retry logic para operações de banco

### Error Response Format

```typescript
interface ForkError {
  code: 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR' | 'INTERNAL_ERROR';
  message: string;
  details?: Record<string, any>;
}
```

## Testing Strategy

### Unit Tests

- **ForkService**: Testar lógica de cópia de dados
- **tRPC procedures**: Testar validações e permissões
- **UI Components**: Testar interações e estados

### Integration Tests

- **Database operations**: Testar transações completas de fork
- **API endpoints**: Testar fluxo completo via tRPC
- **UI flows**: Testar jornada completa do usuário

### Test Scenarios

1. **Fork bem-sucedido**: Projeto com mensagens e fragmentos
2. **Fork com nome customizado**: Validar personalização
3. **Fork de projeto sem mensagens**: Edge case
4. **Tentativa de fork por usuário não autorizado**: Teste de segurança
5. **Fork com nome duplicado**: Teste de validação
6. **Falha na cópia de dados**: Teste de rollback

### Performance Tests

- **Fork de projetos grandes**: Testar com muitas mensagens/fragmentos
- **Múltiplos forks simultâneos**: Testar concorrência
- **Tempo de resposta**: Garantir fork em < 5 segundos

## Implementation Flow

### Fork Process

1. **Validação**: Verificar permissões e dados de entrada
2. **Criação do projeto**: Criar novo projeto com referência ao original
3. **Cópia de mensagens**: Copiar todas as mensagens em lote
4. **Cópia de fragmentos**: Copiar fragmentos com novos IDs
5. **Atualização de referências**: Associar fragmentos às novas mensagens
6. **Finalização**: Retornar projeto forkado e redirecionar usuário

### Database Transaction

```sql
BEGIN;
  -- Criar novo projeto
  INSERT INTO Project (id, name, userId, forkedFromId, ...)

  -- Copiar mensagens
  INSERT INTO Message (id, content, role, type, projectId, ...)
  SELECT uuid(), content, role, type, $newProjectId, ...
  FROM Message WHERE projectId = $originalProjectId

  -- Copiar fragmentos
  INSERT INTO Fragment (id, messageId, sandboxUrl, title, files, ...)
  SELECT uuid(), $newMessageId, sandboxUrl, title, files, ...
  FROM Fragment WHERE messageId IN (...)

COMMIT;
```

## Security Considerations

### Authorization

- Usuários só podem forkar seus próprios projetos
- Validação de ownership em todas as operações
- Rate limiting para prevenir spam de forks

### Data Privacy

- Forks não expõem dados de outros usuários
- Sandbox URLs são copiadas mas podem estar expiradas
- Logs de fork não incluem conteúdo sensível

### Input Validation

- Sanitização de nomes de projeto
- Validação de tamanho de dados
- Prevenção de SQL injection via Prisma ORM
