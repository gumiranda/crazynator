# Documento de Design

## Visão Geral

O sistema de Sugestões de Padrões de Código fornece recomendações inteligentes e contextuais para ajudar os usuários a escreverem um código melhor, seguindo padrões de desenvolvimento modernos e melhores práticas. O sistema analisa o código do usuário em tempo real e sugere melhorias com base em padrões estabelecidos como Atomic Design, Feature-Sliced Design e o uso adequado de bibliotecas como React Query e Zustand.

O sistema se integra à arquitetura Next.js/tRPC existente e aproveita a integração atual de IA (Claude) e o ambiente de sandbox E2B para analisar o código e fornecer sugestões contextuais. Ele estende o modelo de interação baseado em mensagens atual para incluir sugestões proativas de padrões.

## Arquitetura

### Arquitetura de Alto Nível

```mermaid
graph TB
    AnalisadorCodigo[Analisador de Código] --> MotorPadroes[Motor de Detecção de Padrões]
    MotorPadroes --> MotorSugestoes[Motor de Sugestões]
    MotorSugestoes --> UI[UI de Sugestões]

    AnalisadorCodigo --> Sandbox[Sandbox E2B]
    MotorPadroes --> MotorRegras[Motor de Regras]
    MotorSugestoes --> IA[Claude AI]

    subgraph "Categorias de Padrões"
        Atomic[Atomic Design]
        FSD[Feature-Sliced Design]
        GerenciamentoEstado[Gerenciamento de Estado]
        BuscaDados[Busca de Dados]
        PadroesTypeScript[Padrões TypeScript]
        Desempenho[Desempenho]
        Testes[Padrões de Teste]
        A11y[Acessibilidade]
    end

    MotorRegras --> Atomic
    MotorRegras --> FSD
    MotorRegras --> GerenciamentoEstado
    MotorRegras --> BuscaDados
    MotorRegras --> PadroesTypeScript
    MotorRegras --> Desempenho
    MotorRegras --> Testes
    MotorRegras --> A11y
```

### Fluxo de Dados

1.  **Análise de Código**: O usuário escreve o código → O sistema analisa em tempo real → Padrões são detectados
2.  **Geração de Sugestões**: Padrões analisados → Regras aplicadas → A IA gera sugestões contextuais
3.  **Entrega de Sugestões**: Sugestões formatadas → Entregues via UI → O usuário pode aceitar/dispensar
4.  **Aprendizagem**: Feedback do usuário coletado → Preferências de padrão atualizadas → Sugestões aprimoradas

## Componentes e Interfaces

### Extensões do Esquema do Banco de Dados

```typescript
// Estender o esquema existente
model CodeSuggestion {
  id          String            @id @default(uuid())
  projectId   String
  project     Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  type        SuggestionType
  category    SuggestionCategory
  title       String
  description String
  codeExample String?
  filePath    String?
  lineNumber  Int?
  severity    SuggestionSeverity @default(INFO)
  status      SuggestionStatus   @default(PENDING)
  metadata    Json?             // Dados de contexto adicionais
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  dismissedAt DateTime?
  appliedAt   DateTime?

  @@index([projectId, status])
  @@index([type, category])
}

enum SuggestionType {
  ARCHITECTURE
  COMPONENT_STRUCTURE
  STATE_MANAGEMENT
  DATA_FETCHING
  PERFORMANCE
  ACCESSIBILITY
  TESTING
  TYPESCRIPT
}

enum SuggestionCategory {
  ATOMIC_DESIGN
  FEATURE_SLICED_DESIGN
  REACT_QUERY
  ZUSTAND
  REACT_PATTERNS
  TYPESCRIPT_PATTERNS
  PERFORMANCE_OPTIMIZATION
  ACCESSIBILITY_IMPROVEMENT
  TESTING_STRATEGY
}

enum SuggestionSeverity {
  INFO
  WARNING
  ERROR
}

enum SuggestionStatus {
  PENDING
  DISMISSED
  APPLIED
  EXPIRED
}

model PatternRule {
  id          String   @id @default(uuid())
  name        String   @unique
  category    SuggestionCategory
  type        SuggestionType
  description String
  pattern     String   // Regex ou padrão AST para corresponder
  suggestion  String   // Template para o texto da sugestão
  codeExample String?  // Código de exemplo para mostrar
  severity    SuggestionSeverity @default(INFO)
  enabled     Boolean  @default(true)
  priority    Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category, enabled])
  @@index([type, enabled])
}

model UserPreference {
  id         String             @id @default(uuid())
  userId     String
  category   SuggestionCategory
  enabled    Boolean            @default(true)
  frequency  PreferenceFrequency @default(NORMAL)
  createdAt  DateTime           @default(now())
  updatedAt  DateTime           @updatedAt

  @@unique([userId, category])
}

enum PreferenceFrequency {
  MINIMAL
  NORMAL
  AGGRESSIVE
}
```

### Camada de Serviço

#### Serviço de Análise de Código

```typescript
interface CodeAnalysisService {
  analyzeProject(projectId: string): Promise<AnalysisResult>;
  analyzeFile(projectId: string, filePath: string, content: string): Promise<FileAnalysis>;
  detectPatterns(code: string, language: string): Promise<DetectedPattern[]>;
  getCodeMetrics(projectId: string): Promise<CodeMetrics>;
}

interface AnalysisResult {
  projectId: string;
  files: FileAnalysis[];
  overallMetrics: CodeMetrics;
  detectedPatterns: DetectedPattern[];
  suggestions: GeneratedSuggestion[];
}

interface FileAnalysis {
  filePath: string;
  language: string;
  metrics: FileMetrics;
  patterns: DetectedPattern[];
  issues: CodeIssue[];
}

interface DetectedPattern {
  type: string;
  category: SuggestionCategory;
  location: CodeLocation;
  confidence: number;
  metadata: Record<string, any>;
}
```

#### Serviço de Detecção de Padrões

```typescript
interface PatternDetectionService {
  detectAtomicDesignViolations(code: string): Promise<AtomicDesignIssue[]>;
  detectFeatureSlicedDesignIssues(projectStructure: ProjectStructure): Promise<FSDIssue[]>;
  detectStateManagementPatterns(code: string): Promise<StatePattern[]>;
  detectDataFetchingPatterns(code: string): Promise<DataFetchingPattern[]>;
  detectPerformanceIssues(code: string): Promise<PerformanceIssue[]>;
  detectAccessibilityIssues(code: string): Promise<A11yIssue[]>;
  detectTypeScriptIssues(code: string): Promise<TypeScriptIssue[]>;
  detectTestingGaps(projectStructure: ProjectStructure): Promise<TestingGap[]>;
}
```

#### Serviço do Motor de Sugestões

```typescript
interface SuggestionEngineService {
  generateSuggestions(
    analysis: AnalysisResult,
    userPreferences: UserPreference[],
  ): Promise<CodeSuggestion[]>;
  applySuggestion(suggestionId: string, projectId: string): Promise<ApplyResult>;
  dismissSuggestion(suggestionId: string): Promise<void>;
  getSuggestions(projectId: string, filters?: SuggestionFilters): Promise<CodeSuggestion[]>;
  updateSuggestionStatus(suggestionId: string, status: SuggestionStatus): Promise<void>;
}

interface ApplyResult {
  success: boolean;
  changes: FileChange[];
  errors?: string[];
}

interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
}
```

### Definições de Regras de Padrão

#### Regras de Atomic Design

```typescript
const atomicDesignRules: PatternRule[] = [
  {
    name: 'component-too-complex',
    category: 'ATOMIC_DESIGN',
    type: 'COMPONENT_STRUCTURE',
    pattern: 'function\\s+\\w+.*{[\\s\\S]{500,}}', // Componentes com mais de 500 caracteres
    suggestion:
      'Este componente é muito grande. Considere dividi-lo em componentes menores seguindo os princípios do Atomic Design.',
    codeExample: `
// Em vez de um componente grande:
function LargeComponent() {
  // 500+ linhas de código
}

// Divida-o:
function OrganismComponent() {
  return (
    <div>
      <MoleculeHeader />
      <MoleculeContent />
      <MoleculeFooter />
    </div>
  )
}
    `,
    severity: 'WARNING',
  },
  {
    name: 'missing-atomic-structure',
    category: 'ATOMIC_DESIGN',
    type: 'ARCHITECTURE',
    pattern: 'components/(?!atoms|molecules|organisms|templates|pages)',
    suggestion:
      'Considere organizar os componentes usando a estrutura do Atomic Design: atoms, molecules, organisms, templates, pages.',
    severity: 'INFO',
  },
];
```

#### Regras de Feature-Sliced Design

```typescript
const fsdRules: PatternRule[] = [
  {
    name: 'missing-fsd-structure',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    pattern: 'src/(?!shared|entities|features|widgets|pages|app)',
    suggestion:
      'Considere organizar seu código usando o Feature-Sliced Design: shared, entities, features, widgets, pages, app.',
    severity: 'INFO',
  },
  {
    name: 'cross-layer-import',
    category: 'FEATURE_SLICED_DESIGN',
    type: 'ARCHITECTURE',
    pattern: 'import.*from.*\\.\\./\\.\\./(?:features|widgets|pages)',
    suggestion:
      'Evite importar de camadas superiores. Considere mover a lógica compartilhada para a camada shared.',
    severity: 'WARNING',
  },
];
```

#### Regras de Gerenciamento de Estado

```typescript
const zustandRules: PatternRule[] = [
  {
    name: 'local-state-should-be-global',
    category: 'ZUSTAND',
    type: 'STATE_MANAGEMENT',
    pattern: 'useState.*\\[.*,.*\\].*=.*useState\\(.*\\)',
    suggestion:
      'Este estado parece ser usado em vários componentes. Considere usar o Zustand para gerenciamento de estado global.',
    codeExample: `
// Em vez de passar props:
const [user, setUser] = useState(null)

// Use o Zustand:
const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user })
}))
    `,
    severity: 'INFO',
  },
];
```

### Camada de API (Procedimentos tRPC)

```typescript
export const suggestionsRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        filters: z
          .object({
            category: z.nativeEnum(SuggestionCategory).optional(),
            type: z.nativeEnum(SuggestionType).optional(),
            severity: z.nativeEnum(SuggestionSeverity).optional(),
            status: z.nativeEnum(SuggestionStatus).optional(),
          })
          .optional(),
      }),
    )
    .query(({ input }) => suggestionService.getSuggestions(input.projectId, input.filters)),

  analyze: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(({ input }) => codeAnalysisService.analyzeProject(input.projectId)),

  apply: protectedProcedure
    .input(z.object({ suggestionId: z.string(), projectId: z.string() }))
    .mutation(({ input }) =>
      suggestionService.applySuggestion(input.suggestionId, input.projectId),
    ),

  dismiss: protectedProcedure
    .input(z.object({ suggestionId: z.string() }))
    .mutation(({ input }) => suggestionService.dismissSuggestion(input.suggestionId)),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        preferences: z.array(
          z.object({
            category: z.nativeEnum(SuggestionCategory),
            enabled: z.boolean(),
            frequency: z.nativeEnum(PreferenceFrequency),
          }),
        ),
      }),
    )
    .mutation(({ input, ctx }) =>
      preferencesService.updatePreferences(ctx.userId, input.preferences),
    ),
});
```

### Componentes de UI

#### Componente do Painel de Sugestões

```typescript
interface SuggestionsPanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

// Recursos:
// - Listar todas as sugestões ativas
// - Filtrar por categoria/tipo/severidade
// - Aplicar/dispensar sugestões
// - Mostrar exemplos de código
// - Atualizações em tempo real
```

#### Componente do Cartão de Sugestão

```typescript
interface SuggestionCardProps {
  suggestion: CodeSuggestion;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
  onViewCode: (id: string) => void;
}

// Recursos:
// - Exibir detalhes da sugestão
// - Mostrar exemplos de código
// - Ações de aplicar/dispensar
// - Indicadores de severidade
// - Emblemas de categoria
```

#### Componente do Analisador de Padrões

```typescript
interface PatternAnalyzerProps {
  projectId: string;
  onAnalysisComplete: (results: AnalysisResult) => void;
}

// Recursos:
// - Acionar análise de código
// - Mostrar progresso da análise
// - Exibir resultados da análise
// - Resumo da detecção de padrões
```

#### Componente do Painel de Preferências

```typescript
interface PreferencesPanelProps {
  userId: string;
  onSave: (preferences: UserPreference[]) => void;
}

// Recursos:
// - Configurar categorias de sugestão
// - Definir preferências de frequência
// - Habilitar/desabilitar padrões específicos
// - Importar/exportar preferências
```

## Modelos de Dados

### Modelos de Análise de Código

```typescript
interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage?: number;
}

interface CodeLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

interface CodeIssue {
  type: string;
  severity: SuggestionSeverity;
  message: string;
  location: CodeLocation;
  fixable: boolean;
}
```

### Modelos de Padrão

```typescript
interface AtomicDesignIssue {
  componentName: string;
  currentLevel: 'unknown' | 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  suggestedLevel: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  reason: string;
  location: CodeLocation;
}

interface StatePattern {
  type: 'local' | 'global' | 'server';
  complexity: 'simple' | 'medium' | 'complex';
  recommendation: string;
  location: CodeLocation;
}

interface PerformanceIssue {
  type: 'unnecessary-rerender' | 'large-bundle' | 'unoptimized-image' | 'blocking-operation';
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
  location: CodeLocation;
}
```

## Tratamento de Erros

### Erros de Análise

-   Falhas na análise de código
-   Problemas de conexão com o sandbox
-   Tempos limite de detecção de padrões
-   Indisponibilidade do serviço de IA

### Erros de Sugestão

-   Aplicação de sugestão inválida
-   Conflitos de modificação de arquivo
-   Problemas de permissão
-   Falhas de reversão

### Erros de Experiência do Usuário

-   Falhas ao salvar preferências
-   Inconsistências de estado da UI
-   Falhas na atualização em tempo real

### Formato de Resposta de Erro

```typescript
interface SuggestionError {
  code: 'ANALYSIS_FAILED' | 'SUGGESTION_APPLY_FAILED' | 'PREFERENCES_SAVE_FAILED';
  message: string;
  details?: {
    filePath?: string;
    lineNumber?: number;
    originalError?: string;
  };
  recoverable: boolean;
  retryAfter?: number;
}
```

## Estratégia de Teste

### Testes Unitários

-   Algoritmos de detecção de padrões
-   Lógica de geração de sugestões
-   Funcionalidade do motor de regras
-   Utilitários de análise de código

### Testes de Integração

-   Chamadas de procedimento tRPC
-   Operações de banco de dados
-   Integração de serviço de IA
-   Interações com o sandbox

### Testes de Ponta a Ponta

-   Fluxo de trabalho completo de sugestões
-   Precisão da detecção de padrões
-   Gerenciamento de preferências do usuário
-   Atualizações de sugestões em tempo real

### Testes de Desempenho

-   Análise de grandes bases de código
-   Detecção de padrões em tempo real
-   Sugestões de usuários concorrentes
-   Otimização do uso de memória

### Testes de Precisão de Padrão

-   Detecção de padrões conhecidos
-   Taxas de falsos positivos
-   Relevância da sugestão
-   Taxas de aceitação do usuário