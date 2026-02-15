# Code Review - CrazyNator AI

**Data:** 2026-02-15
**Escopo:** Revisao completa do repositorio (server procedures, API routes, componentes React, hooks, middleware, Inngest functions)

---

## Sumario Executivo

| Categoria | Criticos | Altos | Medios | Baixos |
|-----------|----------|-------|--------|--------|
| Complexidade | 2 | 1 | 1 | 0 |
| Legibilidade | 0 | 2 | 3 | 0 |
| Repeticao de Codigo | 2 | 1 | 0 | 0 |
| Performance | 1 | 3 | 2 | 1 |
| Re-renders | 0 | 2 | 4 | 2 |
| Seguranca | 3 | 4 | 3 | 1 |

---

## 1. Complexidade

### 1.1 [CRITICO] Filtragem de arquivos O(n * m) duplicada em 5 locais

**Arquivos afetados:**
- `src/modules/projects/server/procedures.ts:537-555`
- `src/modules/projects/server/procedures.ts:899-917`
- `src/modules/projects/server/procedures.ts:1245-1263`
- `src/modules/projects/server/procedures.ts:1654-1673`
- `src/inngest/github-functions.ts:683-697`

**Problema:** Para cada arquivo em `allFiles` (O(n)), o codigo itera por `excludePatterns` (O(m)), e dentro de cada pattern faz `file.split('/')` (O(k)) + `.includes()` (O(k)). Complexidade resultante: **O(n * m * k)**.

```typescript
// src/modules/projects/server/procedures.ts:537-555
const matchingPatterns = excludePatterns.filter((pattern) => {
  const cleanPattern = pattern.replace('/', '');
  if (pattern.endsWith('/')) {
    const segments = file.split('/');     // O(k) - executado para CADA pattern
    return segments.includes(cleanPattern); // O(k) - busca linear
  } else if (pattern.startsWith('*.')) {
    return file.endsWith(pattern.substring(1));
  } else if (pattern.includes('/')) {
    return file === pattern || file.endsWith('/' + pattern);
  } else {
    return file.includes(cleanPattern);
  }
});
```

**Impacto:** Um projeto com 5.000 arquivos e 30 patterns = ~150.000 comparacoes com split/includes repetido por iteracao. Multiplicado por 5 locais no codigo.

**Correcao sugerida:**
```typescript
// Converter patterns para Set + pre-computar regexes uma vez
function createExclusionMatcher(patterns: string[]) {
  const dirPatterns = new Set<string>();
  const filePatterns: RegExp[] = [];

  for (const pattern of patterns) {
    if (pattern.endsWith('/')) {
      dirPatterns.add(pattern.replace('/', ''));
    } else if (pattern.startsWith('*.')) {
      filePatterns.push(new RegExp(`\\${pattern.substring(1)}$`));
    } else {
      dirPatterns.add(pattern);
    }
  }

  return (filePath: string): boolean => {
    const segments = filePath.split('/'); // Split 1x por arquivo
    for (const seg of segments) {
      if (dirPatterns.has(seg)) return true; // O(1) lookup via Set
    }
    return filePatterns.some((rx) => rx.test(filePath));
  };
}
```

---

### 1.2 [CRITICO] `chunkArray` com complexidade O(n^2/size)

**Arquivo:** `src/modules/projects/server/procedures.ts:119-125`

```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size)); // slice copia O(size) a cada iteracao
  }
  return chunks;
}
```

**Problema:** `Array.slice()` cria um novo array a cada iteracao. Para um array de 10.000 itens com chunks de 15, sao ~667 copias.

**Correcao sugerida:**
```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    const chunk: T[] = [];
    for (let j = i; j < Math.min(i + size, array.length); j++) {
      chunk.push(array[j]); // Push individual sem copia
    }
    chunks.push(chunk);
  }
  return chunks;
}
```

---

### 1.3 [ALTO] Leitura sequencial de arquivos no sandbox

**Arquivo:** `src/modules/projects/server/procedures.ts:626-693`

```typescript
for (const filePath of allFiles) {
  try {
    const content = await sandbox.files.read(filePath); // Sequencial!
    zip.file(filePath, content);
  } catch { ... }
}
```

**Problema:** Leitura de arquivos uma a uma. Para 1.000 arquivos a 50ms por leitura = ~50 segundos de espera.

**Correcao sugerida:**
```typescript
const CONCURRENCY = 10;
for (let i = 0; i < allFiles.length; i += CONCURRENCY) {
  const batch = allFiles.slice(i, i + CONCURRENCY);
  const results = await Promise.allSettled(
    batch.map(async (filePath) => ({
      path: filePath,
      content: await sandbox.files.read(filePath),
    }))
  );
  for (const result of results) {
    if (result.status === 'fulfilled') {
      zip.file(result.value.path, result.value.content);
    }
  }
}
```

---

### 1.4 [MEDIO] Logging excessivo em loops de arquivo

**Arquivos:** `src/modules/projects/server/procedures.ts:384-396, 560-567, 614-617`

```typescript
for (const [filePath, content] of Object.entries(files)) {
  console.log(`[DOWNLOAD] Excluding: ${filePath}`); // Log para CADA arquivo
  excludedFiles++;
}
```

**Problema:** Em projetos com 10.000 arquivos, gera 10.000 entradas de log com string interpolation.

**Correcao sugerida:** Logar apenas totais ou apenas em modo debug.

---

## 2. Legibilidade

### 2.1 [ALTO] `ProjectView` excessivamente complexo (223 linhas)

**Arquivo:** `src/modules/projects/ui/views/project-view.tsx`

**Problema:** O componente gerencia 4 estados simultaneamente, duplica layout mobile/desktop (linhas 53-150 vs 152-219), e mistura logica de responsividade com gerenciamento de fragments.

**Correcao sugerida:**
```
src/modules/projects/ui/views/
  project-view.tsx         -> Orquestrador principal
  mobile-project-view.tsx  -> Layout mobile
  desktop-project-view.tsx -> Layout desktop
  use-project-state.ts     -> Hook customizado para estado compartilhado
```

---

### 2.2 [ALTO] `FileExplore` com 259 linhas e multiplas responsabilidades

**Arquivo:** `src/components/file-explore.tsx`

**Problema:** Componente gerencia selecao de arquivos, modo de edicao, unsaved changes, mutacoes de arquivo, e renderiza sub-componentes inline. 5+ chamadas de `useState`.

**Correcao sugerida:** Extrair `<FileTree />`, `<FileEditor />`, `<FileHeader />` e um hook `useFileState()`.

---

### 2.3 [MEDIO] Funcoes de mapeamento de status inline no componente

**Arquivo:** `src/modules/github/ui/components/github-sync-status.tsx:67-110`

```typescript
const getSyncStatusColor = (status: string) => { /* ... */ };
const getSyncStatusIcon = (status: string) => { /* ... */ };
const getSyncStatusText = (status: string) => { /* ... */ };
```

**Problema:** Tres funcoes puras recreadas a cada render. Deviam ser constantes fora do componente ou `useMemo`.

---

### 2.4 [MEDIO] Handler de OAuth com cleanup dentro de callback

**Arquivo:** `src/modules/github/ui/components/create-repository-dialog.tsx:121-171`

```typescript
const handleGitHubConnect = useCallback(() => {
  setIsConnecting(true);
  // ... logica complexa com event listeners e interval
  const checkClosed = setInterval(() => {
    if (popup.closed) {
      clearInterval(checkClosed);
      window.removeEventListener('message', handleMessage);
      setIsConnecting(false);
    }
  }, 1000);
}, [refetchConnection]);
```

**Problema:** Cleanup esta dentro do `setInterval`, nunca executado se o popup nao fechar. Deveria ser um `useEffect` com return de cleanup.

---

### 2.5 [MEDIO] Hardcoded `hasProAccess = false`

**Arquivo:** `src/modules/projects/ui/views/project-view.tsx:24`

```typescript
const hasProAccess = false;
```

**Problema:** Valor hardcoded que nunca verifica o status real de subscription do usuario. Feature de upgrade sempre visivel sem funcionalidade.

---

## 3. Repeticao de Codigo

### 3.1 [CRITICO] Array de exclusao de patterns duplicado em 5 locais (~350 linhas)

**Locais:**
1. `src/modules/projects/server/procedures.ts:356-370` (downloadFullProject - fallback)
2. `src/modules/projects/server/procedures.ts:433-466` (downloadFullProject - sandbox)
3. `src/modules/projects/server/procedures.ts:819-852` (syncFullProjectToGitHub)
4. `src/modules/projects/server/procedures.ts:1169-1202` (createGitHubRepoWithFullProject)
5. `src/inngest/github-functions.ts:665-681` (githubPullFunction)

**Problema:** O mesmo array de 30 patterns esta copiado verbatim em 5 funcoes. Qualquer alteracao exige atualizar todos os 5 locais, com risco real de inconsistencia.

**Correcao sugerida:**
```typescript
// src/constants/file-exclusions.ts
export const SANDBOX_EXCLUDE_PATTERNS = [
  'nextjs-app',
  'node_modules/',
  '.git/',
  '.next/',
  // ... todos os patterns
] as const;

export const SOURCE_EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  '.next',
  // ... patterns simplificados para fallback
] as const;
```

---

### 3.2 [CRITICO] Logica de find + parse + filter duplicada em 3 funcoes (~400 linhas)

**Locais:**
1. `src/modules/projects/server/procedures.ts:468-572` (downloadFullProject)
2. `src/modules/projects/server/procedures.ts:854-927` (syncFullProjectToGitHub)
3. `src/modules/projects/server/procedures.ts:1204-1270` (createGitHubRepoWithFullProject)

Cada uma implementa identicamente:
- Construcao de `excludeArgs` via `map/join`
- Execucao do comando `find`
- Parsing de output (`split/filter/map/replace`)
- Filtragem dupla contra patterns
- Leitura de arquivos em loop

**Correcao sugerida:**
```typescript
// src/lib/sandbox-files.ts
export async function listSandboxFiles(
  sandbox: Sandbox,
  excludePatterns: string[]
): Promise<string[]> { /* logica centralizada */ }

export async function readSandboxFiles(
  sandbox: Sandbox,
  filePaths: string[]
): Promise<Record<string, string>> { /* leitura com concorrencia */ }
```

---

### 3.3 [ALTO] Decriptacao de token GitHub repetida 5+ vezes

**Locais:**
- `src/inngest/github-functions.ts:86, 237, 359, 788`
- `src/modules/github/server/procedures.ts:1373`

```typescript
const accessToken = decryptToken(connection.accessToken);
```

**Correcao sugerida:** Criar helper `getDecryptedGitHubToken(connectionId)` que busca e decripta em uma chamada.

---

## 4. Performance

### 4.1 [CRITICO] CodeMirror com todos os language packs importados estaticamente

**Arquivo:** `src/components/code-editor.tsx:3-10`

```typescript
import { javascript } from '@codemirror/lang-javascript';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { xml } from '@codemirror/lang-xml';
import { sql } from '@codemirror/lang-sql';
```

**Impacto:** Todos os 7 pacotes de linguagem (~150-200KB) incluidos no bundle mesmo que o usuario edite apenas `.tsx`.

**Correcao sugerida:**
```typescript
const languageLoaders: Record<string, () => Promise<Extension[]>> = {
  ts: () => import('@codemirror/lang-javascript').then(m => [m.javascript({ typescript: true })]),
  tsx: () => import('@codemirror/lang-javascript').then(m => [m.javascript({ typescript: true, jsx: true })]),
  css: () => import('@codemirror/lang-css').then(m => [m.css()]),
  sql: () => import('@codemirror/lang-sql').then(m => [m.sql()]),
  // ...
};
```

---

### 4.2 [ALTO] Queries Prisma sem paginacao de messages

**Arquivo:** `src/modules/projects/server/procedures.ts:287-295`

```typescript
messages: {
  include: {
    fragment: true,
  },
  orderBy: { createdAt: 'desc' },
  // Sem take/limit!
}
```

**Problema:** Busca TODAS as mensagens com TODOS os fragments de cada projeto. Projetos com 100+ mensagens vao gerar queries pesadas.

**Correcao sugerida:**
```typescript
messages: {
  include: { fragment: true },
  orderBy: { createdAt: 'desc' },
  take: 50, // Paginar
}
```

---

### 4.3 [ALTO] Resize handler sem debounce

**Arquivo:** `src/modules/projects/ui/views/project-view.tsx:31-40`

```typescript
useEffect(() => {
  const checkIsMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  return () => window.removeEventListener('resize', checkIsMobile);
}, []);
```

**Problema:** `resize` dispara dezenas de vezes por segundo durante redimensionamento, causando setState + re-render a cada evento.

**Correcao sugerida:**
```typescript
useEffect(() => {
  let timeoutId: NodeJS.Timeout;
  const checkIsMobile = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setIsMobile(window.innerWidth < 768);
    }, 150);
  };
  checkIsMobile();
  window.addEventListener('resize', checkIsMobile);
  return () => {
    window.removeEventListener('resize', checkIsMobile);
    clearTimeout(timeoutId);
  };
}, []);
```

---

### 4.4 [MEDIO] Animacoes pesadas na landing page

**Arquivo:** `src/app/(home)/page.tsx`

```tsx
{'Build Apps with CrazyNator AI'.split(' ').map((word, index) => (
  <motion.span key={index} /* 7 props de animacao */ >
    {word}
  </motion.span>
))}
```

**Problema:** 6 `motion.span` com animacao individual na renderizacao inicial. Pode impactar LCP (Largest Contentful Paint).

**Correcao sugerida:** Considerar `prefers-reduced-motion` media query e lazy-load de framer-motion.

---

### 4.5 [MEDIO] `useMutation` options recreadas a cada render

**Arquivo:** `src/modules/projects/ui/components/project-header.tsx:53-110`

Multiplas `useMutation` com callbacks inline que sao recreados em cada render:

```typescript
const downloadZip = useMutation(
  trpc.projects.downloadZip.mutationOptions({
    onSuccess: () => { /* handler inline */ },
    onError: () => { /* handler inline */ },
  }),
);
// + mais 3 mutations identicas
```

**Correcao sugerida:** Memoizar options ou extrair para hooks customizados.

---

### 4.6 [BAIXO] Suspense adequado mas lazy loading ausente

**Arquivo:** `src/modules/projects/ui/views/project-view.tsx`

O componente usa `Suspense` corretamente (linhas 55-71, 162-170), porem nenhum componente usa `React.lazy()`. `MessagesContainer`, `ProjectHeader`, `FragmentPreview` e `FileExplore` poderiam ser carregados sob demanda.

---

## 5. Re-renders

### 5.1 [ALTO] `recreateSandbox` com dependencia ciclica

**Arquivo:** `src/components/SandboxPreview/index.tsx:39-80`

```typescript
const recreateSandbox = useCallback(async (): Promise<void> => {
  if (isRecreating) return;
  setIsRecreating(true);
  // ...
}, [fragment.id, isRecreating, onSandboxRecreated]);
//                ^^^^^^^^^^^^
//                Muda a cada setIsRecreating -> recria o callback -> re-registra event listener
```

**Problema:** `isRecreating` na lista de dependencias faz com que o callback seja recriado cada vez que o estado muda. O `useEffect` na linha 84-96 que depende de `recreateSandbox` tambem e re-executado, removendo e adicionando event listeners a cada mudanca.

**Correcao sugerida:**
```typescript
const isRecreatingRef = useRef(false);

const recreateSandbox = useCallback(async (): Promise<void> => {
  if (isRecreatingRef.current) return;
  isRecreatingRef.current = true;
  setIsRecreating(true);
  try {
    // ... logica
  } finally {
    isRecreatingRef.current = false;
    setIsRecreating(false);
  }
}, [fragment.id, onSandboxRecreated]); // Sem isRecreating nas deps
```

---

### 5.2 [ALTO] Handlers nao memoizados em `ProjectHeader`

**Arquivo:** `src/modules/projects/ui/components/project-header.tsx:132-146`

```typescript
const handleThemeChange = (value: string) => { setTheme(value); };
const handleDownloadSourceCode = () => { downloadZip.mutate({ projectId }); };
const handleDownloadFullProject = () => { downloadFullProject.mutate({ projectId }); };
const handleSyncFullProjectToGitHub = () => { syncFullProjectToGitHub.mutate({ projectId }); };
```

**Problema:** 4 handlers criados como funcoes inline em cada render. Passados como props para componentes filhos, forcando re-render desnecessario.

**Correcao sugerida:** Envolver todos com `useCallback`.

---

### 5.3 [MEDIO] Timeout sem cleanup em copy handler

**Arquivo:** `src/components/SandboxPreview/index.tsx:115-117`

```typescript
setTimeout(() => {
  setCopied(false);
}, 2000);
```

**Problema:** Se o componente desmontar antes dos 2 segundos, causa tentativa de setState em componente desmontado.

**Correcao sugerida:**
```typescript
const timerRef = useRef<NodeJS.Timeout>();

const onCopy = useCallback(() => {
  // ...
  setCopied(true);
  clearTimeout(timerRef.current);
  timerRef.current = setTimeout(() => setCopied(false), 2000);
}, [fragment.sandboxUrl]);

useEffect(() => () => clearTimeout(timerRef.current), []);
```

O mesmo problema existe em `src/components/file-explore.tsx:115-117`.

---

### 5.4 [MEDIO] `onSubmit` nao memoizado no message form

**Arquivo:** `src/modules/projects/ui/components/message-form.tsx:56-61`

```typescript
const onSubmit = async (values: z.infer<typeof formSchema>) => {
  await createMessage.mutateAsync({
    projectId,
    value: values.value,
  });
};
```

**Correcao:** Envolver com `useCallback([createMessage, projectId])`.

---

### 5.5 [MEDIO] Funcoes de status puras dentro do componente

**Arquivo:** `src/modules/github/ui/components/github-sync-status.tsx:67-110`

`getSyncStatusColor`, `getSyncStatusIcon`, `getSyncStatusText` sao funcoes puras sem dependencia de estado. Definidas dentro do componente, sao recriadas a cada render.

**Correcao:** Mover para fora do componente ou para um arquivo de constantes.

---

### 5.6 [MEDIO] `MessageCard` sem memo para itens de lista

**Arquivo:** `src/modules/projects/ui/components/message-card.tsx`

Componentes internos (`UserMessage`, `FragmentCard`, `AssistantMessage`) renderizados em lista sem `React.memo`. Cada mensagem nova causa re-render de todas as mensagens anteriores.

**Correcao:** Envolver com `React.memo` e garantir props estaveis.

---

### 5.7 [BAIXO] Breadcrumb re-renderizado em cada mudanca de parent

**Arquivo:** `src/components/file-explore.tsx:182`

```tsx
<FileBreadcrumb filePath={activeFile} />
```

Componente inline que re-renderiza em qualquer mudanca de estado do parent `FileExplore`.

---

### 5.8 [BAIXO] `SandboxErrorBoundary` com `onRetry` inline

**Arquivo:** `src/components/SandboxPreview/index.tsx:131-133`

```typescript
onRetry={() => {
  setIframeKey((prev) => prev + 1);
}}
```

Arrow function inline recriada a cada render. Impacto baixo pois ErrorBoundary raramente re-renderiza, mas ainda viola best practices.

---

## 6. Seguranca

### 6.1 [CRITICO] Chave de encriptacao default hardcoded no codigo-fonte

**Arquivo:** `src/lib/github.ts:6`

```typescript
const ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY || 'default-key-change-in-production';
```

**Risco:** Se a env var `GITHUB_TOKEN_ENCRYPTION_KEY` nao estiver configurada (deploy incorreto, ambiente de staging esquecido), TODOS os tokens GitHub sao encriptados com uma chave visivel no codigo-fonte. Qualquer pessoa com acesso ao repositorio pode decriptar tokens.

**Vetor de ataque:** Acesso ao repositorio -> extrair chave default -> buscar tokens encriptados no banco -> decriptar -> acesso total aos repos GitHub dos usuarios.

**Correcao sugerida:**
```typescript
const ENCRYPTION_KEY = process.env.GITHUB_TOKEN_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error(
    'GITHUB_TOKEN_ENCRYPTION_KEY is required. Cannot start without encryption key.'
  );
}
```

Adicionalmente, `crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)` usa salt estatico `'salt'`. Usar salt aleatorio por token e armazena-lo junto ao ciphertext.

---

### 6.2 [CRITICO] Rota Inngest publica sem verificacao de assinatura

**Arquivo:** `src/middleware.ts:8`

```typescript
const isPublicRoute = createRouteMatcher([
  // ...
  '/api/inngest(.*)',  // Rota publica!
  '/api/trpc(.*)',
]);
```

**Risco:** `/api/inngest` processa background jobs (execucao de codigo via sandbox, sync GitHub, operacoes de AI). Marcada como rota publica, qualquer requisicao HTTP pode triggerar funcoes Inngest.

**Vetor de ataque:** POST para `/api/inngest` com payload forjado -> triggera `githubSyncFunction` ou `sandboxRecreation` -> execucao de codigo ou manipulacao de dados sem autenticacao.

**Correcao sugerida:**
1. Implementar verificacao de assinatura Inngest no handler
2. Ou remover `/api/inngest(.*)` das rotas publicas e usar signing key do Inngest

---

### 6.3 [CRITICO] Stripe Portal sem autenticacao - acesso ao billing de qualquer usuario

**Arquivo:** `src/app/api/stripe/create-portal-session/route.ts:15-57`

```typescript
export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json();
    // NENHUMA verificacao de auth!
    // NENHUMA verificacao de que customerId pertence ao usuario autenticado!
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      // ...
    });
```

**Risco:** Qualquer pessoa pode enviar um `customerId` e acessar o portal de billing Stripe de outro usuario. Permite cancelar subscricoes, alterar metodo de pagamento, ver historico de faturas.

**Vetor de ataque:** Enumerar customer IDs (`cus_xxx`) -> POST para `/api/stripe/create-portal-session` -> acesso total ao billing portal da vitima.

**Correcao sugerida:**
```typescript
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId } = await request.json();

  // Verificar que o customerId pertence ao usuario autenticado
  const subscription = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId, userId },
  });
  if (!subscription) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
  // ...
}
```

---

### 6.4 [ALTO] Env var injection via `priceId` no checkout

**Arquivo:** `src/app/api/create-checkout-session/route.ts:39-53`

```typescript
const { quantity = 1, priceId } = await request.json();
// ...
price: process.env[priceId], // priceId vem direto do request body!
```

**Risco:** Um atacante pode enviar `priceId: "DATABASE_URL"` ou `priceId: "STRIPE_SECRET_KEY"` e potencialmente leakar variaveis de ambiente sensiveis. Mesmo que o Stripe rejeite o valor como price invalido, a mensagem de erro pode conter a variavel.

**Correcao sugerida:**
```typescript
const ALLOWED_PRICE_IDS = [
  'STRIPE_PRICE_MONTHLY',
  'STRIPE_PRICE_ANNUAL',
] as const;

if (!ALLOWED_PRICE_IDS.includes(priceId)) {
  return new NextResponse('Invalid price ID', { status: 400 });
}
const stripePrice = process.env[priceId];
```

---

### 6.5 [ALTO] Escrita de arquivos no sandbox sem validacao de path traversal

**Arquivo:** `src/modules/projects/server/procedures.ts:102-104`

```typescript
for (const [filePath, content] of Object.entries(input.files)) {
  await sandbox.files.write(filePath, content);
}
```

**Risco:** Nao ha validacao de que `filePath` esta dentro do diretorio permitido. Paths como `../../../etc/crontab` ou `../../.bashrc` poderiam escrever fora do escopo.

**Atenuante:** Sandbox E2B isola o ambiente, reduzindo impacto. Porem, dentro do sandbox, ainda pode-se sobrescrever configuracoes.

**Correcao sugerida:**
```typescript
import path from 'path';

for (const [filePath, content] of Object.entries(input.files)) {
  const normalized = path.normalize(filePath);
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid file path',
    });
  }
  await sandbox.files.write(normalized, content);
}
```

---

### 6.6 [ALTO] GitHub OAuth com redirect URL nao validado (Open Redirect)

**Arquivo:** `src/app/api/auth/github/callback/route.ts:14, 107`

```typescript
const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
// ... apos OAuth completo
return NextResponse.redirect(new URL(finalRedirectUrl, request.url));
```

**Risco:** Um atacante pode manipular o cookie `github_oauth_redirect` para redirecionar para um site malicioso apos autenticacao OAuth, permitindo phishing.

**Correcao sugerida:**
```typescript
const redirectUrl = request.cookies.get('github_oauth_redirect')?.value || '/';
const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL!);
const targetUrl = new URL(redirectUrl, request.url);

// Validar que redirect e para o mesmo dominio
if (targetUrl.hostname !== appUrl.hostname) {
  return NextResponse.redirect(new URL('/', request.url));
}
```

---

### 6.7 [ALTO] Authorization gap em Inngest functions - sem verificacao de ownership

**Arquivo:** `src/inngest/github-functions.ts:324-341`

```typescript
const { repository, connection } = await step.run('get-repository-data', async () => {
  const repository = await prisma.gitHubRepository.findUnique({
    where: { id: repositoryId },
    include: { githubConnection: true }
  });
  // Nao verifica que o repositorio pertence ao usuario que triggerou o evento!
  return { repository, connection: repository.githubConnection };
});
```

**Risco:** Se um evento Inngest for forjado (ver 6.2), qualquer `repositoryId` pode ser usado para sincronizar arquivos ao GitHub de outro usuario.

---

### 6.8 [MEDIO] Fragments API sem validacao de ownership completa

**Arquivo:** `src/app/api/projects/[projectId]/fragments/route.ts:34-39`

```typescript
const fragments = await prisma.fragment.findMany({
  where: {
    message: {
      projectId, // Verifica project, mas nao userId!
    },
  },
});
```

**Risco:** Se alguem conhece um `projectId`, pode acessar seus fragments sem ser o dono.

**Nota:** A rota verifica `auth()` no inicio, mas a query so filtra por `projectId`, nao por `userId`. A verificacao de ownership do project contra userId esta presente mais abaixo no codigo, mas deve ser confirmada.

**Correcao sugerida:**
```typescript
where: {
  message: {
    project: {
      id: projectId,
      userId, // Garantir ownership
    },
  },
},
```

---

### 6.9 [MEDIO] Subscription cancellation sem contexto de usuario

**Arquivo:** `src/modules/subscription/server/procedures.ts:28`

```typescript
.mutation(async ({ input }) => {
  // 'ctx' nao esta sendo desestruturado!
  const subscription = await cancelSubscription(input.stripeSubscriptionId);
```

**Risco:** O `stripeSubscriptionId` vem do input do usuario. Se `cancelSubscription` nao verificar internamente que a subscription pertence ao usuario autenticado, qualquer usuario pode cancelar a subscription de outro.

**Correcao sugerida:**
```typescript
.mutation(async ({ input, ctx }) => {
  // Verificar ownership antes de cancelar
  const sub = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: input.stripeSubscriptionId,
      userId: ctx.auth.userId,
    },
  });
  if (!sub) throw new TRPCError({ code: 'FORBIDDEN' });
  const subscription = await cancelSubscription(input.stripeSubscriptionId);
```

---

### 6.10 [MEDIO] Risco de zip bomb na descompressao de arquivos

**Arquivo:** `src/inngest/github-functions.ts:297-340`

```typescript
const compressed = Buffer.from(compressedFiles, 'base64');
const decompressed = await gunzipAsync(compressed);
const files = JSON.parse(decompressed.toString('utf8'));
```

**Risco:** Nao ha limite de tamanho antes ou apos descompressao. Um payload comprimido de poucos KB pode expandir para GBs, causando OOM (Out of Memory).

**Correcao sugerida:**
```typescript
const MAX_DECOMPRESSED_SIZE = 100 * 1024 * 1024; // 100MB
const decompressed = await gunzipAsync(compressed);
if (decompressed.length > MAX_DECOMPRESSED_SIZE) {
  throw new Error(`Decompressed size ${decompressed.length} exceeds limit`);
}
```

---

### 6.11 [BAIXO] Ausencia de rate limiting em todas as rotas API

**Arquivos:** Todas as rotas em `src/app/api/`

Nenhuma rota implementa rate limiting. Rotas criticas como:
- `/api/create-checkout-session` (criacao de sessoes Stripe)
- `/api/auth/github` (OAuth flow)
- `/api/sandbox/recreate` (criacao de sandboxes)

Podem ser abusadas sem restricao.

**Correcao sugerida:** Implementar rate limiting via Upstash Redis ou middleware customizado.

---

## Padroes Positivos Identificados

- **Clerk middleware** bem configurado para protecao de rotas autenticadas
- **tRPC `protectedProcedure`** implementa verificacao de `userId` consistente
- **Stripe webhook** valida assinatura corretamente via `constructEvent`
- **AES-256-GCM** com IV aleatorio para encriptacao de tokens (implementacao boa, chave default ruim)
- **Ownership check** presente na maioria das queries de projeto (`where: { id, userId }`)
- **Zustand store** com Immer bem estruturado
- **React Hook Form + Zod** para validacao de formularios
- **Error Boundaries** implementados corretamente nos componentes criticos
- **Suspense** usado adequadamente no `ProjectView`
- **`useDebouncedCallback`** no CodeEditor para evitar chamadas excessivas
- **`useMemo`** para extensoes do CodeMirror corretamente implementado

---

## Prioridades de Correcao

### Imediato (Seguranca Critica)
1. Remover chave de encriptacao default (`src/lib/github.ts:6`)
2. Adicionar autenticacao ao Stripe Portal (`src/app/api/stripe/create-portal-session/route.ts`)
3. Validar `priceId` contra whitelist (`src/app/api/create-checkout-session/route.ts`)
4. Proteger rota Inngest com verificacao de assinatura (`src/middleware.ts`)

### Curto Prazo (Performance + Seguranca)
5. Extrair patterns de exclusao para constante compartilhada
6. Centralizar logica de find/parse/filter de arquivos
7. Adicionar validacao de path traversal na escrita de arquivos
8. Validar redirect URL no OAuth callback
9. Corrigir dependencia ciclica do `recreateSandbox`
10. Lazy-load language packs do CodeMirror

### Medio Prazo (Qualidade + Manutencao)
11. Refatorar `ProjectView` em componentes menores
12. Adicionar rate limiting nas rotas API
13. Implementar leitura paralela de arquivos no sandbox
14. Memoizar handlers em `ProjectHeader`
15. Adicionar debounce ao resize handler
16. Paginar queries de mensagens no Prisma
