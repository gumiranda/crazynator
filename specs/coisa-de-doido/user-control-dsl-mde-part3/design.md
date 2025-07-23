# Design Document

## Overview

O Plano de Controle representa a interface principal entre usuários e o poderoso motor de geração da plataforma. Em vez de scripts complexos, os usuários interagem com abstrações de alto nível através de DSLs (Domain-Specific Languages) externas declarativas e DSLs internas programáticas. O sistema implementa um fluxo de trabalho completo de Engenharia Orientada a Modelos (MDE), onde modelos de alto nível servem como artefatos primários para gerar e manter software.

O design separa claramente a especificação do sistema (através de DSLs) de sua implementação (código gerado), permitindo que diferentes stakeholders colaborem efetivamente. DSLs externas servem como contratos formais legíveis por humanos, enquanto DSLs internas fornecem controle programático avançado para cenários complexos.

## Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        TextEditor[Text Editor with Syntax Highlighting]
        GraphicalEditor[Graphical Model Editor]
        IDEIntegration[IDE Integration]
        WebInterface[Web-based Editor]
    end

    subgraph "External DSL Layer"
        SchemaDSL[Schema DSL Parser]
        APIDSL[API DSL Parser]
        WorkflowDSL[Workflow DSL Parser]
        CustomDSL[Custom DSL Parser]
    end

    subgraph "Internal DSL Layer"
        FluentAPI[Fluent API Engine]
        ScriptEngine[Script Execution Engine]
        ASTAbstraction[AST Abstraction Layer]
        AutomationFramework[Automation Framework]
    end

    subgraph "Model Management"
        ModelRegistry[Model Registry]
        ModelValidator[Model Validator]
        ModelVersioning[Model Versioning]
        ModelDiff[Model Diff Engine]
    end

    subgraph "MDE Transformation Engine"
        M2TTransformer[Model-to-Text Transformer]
        M2MTransformer[Model-to-Model Transformer]
        TransformationChain[Transformation Chain Manager]
        RoundTripEngine[Round-trip Synchronization]
    end

    subgraph "Integration Layer"
        TemplateEngineBridge[Template Engine Bridge (Layer 2)]
        ASTCoreBridge[AST Core Bridge (Layer 3)]
        ScaffoldingBridge[Scaffolding Platform Bridge (Layer 1)]
        ValidationBridge[Validation Bridge]
    end

    subgraph "Stakeholder Collaboration"
        ApprovalWorkflow[Approval Workflow]
        DocumentationGenerator[Documentation Generator]
        ChangeNotification[Change Notification]
        StakeholderDashboard[Stakeholder Dashboard]
    end

    TextEditor --> SchemaDSL
    GraphicalEditor --> SchemaDSL
    TextEditor --> APIDSL
    GraphicalEditor --> APIDSL

    SchemaDSL --> ModelRegistry
    APIDSL --> ModelRegistry
    WorkflowDSL --> ModelRegistry
    CustomDSL --> ModelRegistry

    FluentAPI --> ScriptEngine
    ScriptEngine --> ASTAbstraction
    ASTAbstraction --> AutomationFramework

    ModelRegistry --> ModelValidator
    ModelValidator --> ModelVersioning
    ModelVersioning --> ModelDiff

    ModelRegistry --> M2TTransformer
    M2TTransformer --> M2MTransformer
    M2MTransformer --> TransformationChain
    TransformationChain --> RoundTripEngine

    M2TTransformer --> TemplateEngineBridge
    M2MTransformer --> ASTCoreBridge
    TransformationChain --> ScaffoldingBridge
    ModelValidator --> ValidationBridge

    ModelRegistry --> ApprovalWorkflow
    ApprovalWorkflow --> DocumentationGenerator
    ModelVersioning --> ChangeNotification
    DocumentationGenerator --> StakeholderDashboard
```

### Core Components

#### 1. External DSL System

- **Purpose**: Fornece linguagens declarativas específicas de domínio
- **Key DSLs**:
  - Schema DSL: Definição de modelos de dados e relacionamentos
  - API DSL: Especificação de endpoints e comportamentos
  - Workflow DSL: Definição de processos de negócio
  - Custom DSLs: DSLs específicas do domínio da organização

#### 2. Internal DSL System

- **Purpose**: API fluente programática para controle avançado
- **Features**:
  - Fluent API com encadeamento de métodos
  - Abstrações seguras para manipulação AST
  - Framework de automação modular
  - Suporte a testes e debugging

#### 3. MDE Transformation Engine

- **Purpose**: Implementa fluxo de trabalho completo de MDE
- **Transformations**:
  - Model-to-Text (M2T): DSL → Código
  - Model-to-Model (M2M): AST → AST melhorada
  - Round-trip: Código → Modelo (limitado)

#### 4. Model Management System

- **Purpose**: Gerencia ciclo de vida completo dos modelos
- **Capabilities**:
  - Versionamento e histórico
  - Validação e consistência
  - Diff e merge de modelos
  - Registry centralizado

## Components and Interfaces

### Schema DSL Specification

```yaml
# schema.dsl
entities:
  User:
    fields:
      id:
        type: uuid
        primary_key: true
        generated: true
      username:
        type: string
        max_length: 50
        unique: true
        required: true
      email:
        type: email
        unique: true
        required: true
      password:
        type: password
        min_length: 8
        hashed: true
      created_at:
        type: datetime
        auto_now_add: true
      updated_at:
        type: datetime
        auto_now: true

    relationships:
      posts:
        type: one_to_many
        target: Post
        cascade: delete
      profile:
        type: one_to_one
        target: UserProfile
        cascade: all

  Post:
    fields:
      id:
        type: uuid
        primary_key: true
        generated: true
      title:
        type: string
        max_length: 200
        required: true
      content:
        type: text
        required: true
      published:
        type: boolean
        default: false
      author_id:
        type: uuid
        foreign_key: User.id
        required: true

    relationships:
      author:
        type: many_to_one
        target: User
        on_delete: cascade
      tags:
        type: many_to_many
        target: Tag
        through: PostTag

    indexes:
      - fields: [author_id, published]
        name: author_published_idx
      - fields: [created_at]
        name: created_at_idx

    validations:
      - rule: title_not_empty
        condition: 'len(title.strip()) > 0'
        message: 'Title cannot be empty'
      - rule: content_min_length
        condition: 'len(content) >= 10'
        message: 'Content must be at least 10 characters'
```

### API DSL Specification

```yaml
# api.dsl
api:
  name: BlogAPI
  version: '1.0.0'
  base_url: '/api/v1'

  authentication:
    type: jwt
    header: Authorization
    prefix: Bearer

  middleware:
    - cors
    - rate_limiting
    - request_logging

  endpoints:
    users:
      path: '/users'

      get:
        summary: 'List users'
        parameters:
          - name: page
            type: integer
            default: 1
            min: 1
          - name: limit
            type: integer
            default: 10
            min: 1
            max: 100
        response:
          type: paginated_list
          item_type: User
        permissions:
          - authenticated

      post:
        summary: 'Create user'
        request_body:
          type: UserCreateDTO
          required: true
        response:
          type: User
          status: 201
        permissions:
          - public

    user_detail:
      path: '/users/{user_id}'
      parameters:
        - name: user_id
          type: uuid
          location: path
          required: true

      get:
        summary: 'Get user by ID'
        response:
          type: User
        permissions:
          - authenticated
          - owner_or_admin

      put:
        summary: 'Update user'
        request_body:
          type: UserUpdateDTO
          required: true
        response:
          type: User
        permissions:
          - owner_or_admin

      delete:
        summary: 'Delete user'
        response:
          status: 204
        permissions:
          - owner_or_admin

    posts:
      path: '/posts'

      get:
        summary: 'List posts'
        parameters:
          - name: author_id
            type: uuid
            required: false
          - name: published
            type: boolean
            default: true
        response:
          type: paginated_list
          item_type: Post
        permissions:
          - public

      post:
        summary: 'Create post'
        request_body:
          type: PostCreateDTO
          required: true
        response:
          type: Post
          status: 201
        permissions:
          - authenticated
        middleware:
          - validate_author_ownership

  dto_definitions:
    UserCreateDTO:
      fields:
        username: string
        email: email
        password: password
      validations:
        - username_unique
        - email_unique
        - password_strength

    UserUpdateDTO:
      fields:
        username: string?
        email: email?
      validations:
        - username_unique_if_changed
        - email_unique_if_changed

    PostCreateDTO:
      fields:
        title: string
        content: text
        published: boolean?
      validations:
        - title_not_empty
        - content_min_length
```

### Internal DSL API

```typescript
// Fluent API for programmatic control
interface PlatformDSL {
  // Model operations
  from_schema(schemaPath: string): SchemaBuilder;
  from_api(apiPath: string): APIBuilder;
  from_model(model: Model): ModelBuilder;

  // Generation operations
  generate_models(options?: GenerationOptions): GenerationBuilder;
  generate_api(options?: GenerationOptions): GenerationBuilder;
  generate_frontend(options?: GenerationOptions): GenerationBuilder;

  // Transformation operations
  transform(transformer: TransformationFunction): TransformationBuilder;
  refactor(operation: RefactoringOperation): RefactoringBuilder;

  // Composition operations
  then(operation: PlatformOperation): PlatformDSL;
  parallel(...operations: PlatformOperation[]): PlatformDSL;
  conditional(condition: boolean, operation: PlatformOperation): PlatformDSL;
}

// Example usage
const result = await platform
  .from_schema('models/blog.schema.dsl')
  .generate_models({
    target: 'pydantic',
    output_dir: 'src/models',
  })
  .then_generate_api({
    framework: 'fastapi',
    output_dir: 'src/api',
  })
  .then((models) =>
    models.get_class('User').add_method({
      name: 'get_full_name',
      return_type: 'str',
      body: 'return f"{self.first_name} {self.last_name}"',
    }),
  )
  .execute();

// Advanced AST manipulation
interface FileBuilder {
  get_class(className: string): ClassBuilder;
  get_function(functionName: string): FunctionBuilder;
  add_import(importStatement: string): FileBuilder;
  add_class(classDefinition: ClassDefinition): FileBuilder;
}

interface ClassBuilder {
  add_method(method: MethodDefinition): ClassBuilder;
  add_property(property: PropertyDefinition): ClassBuilder;
  add_decorator(decorator: string): ClassBuilder;
  extend_class(baseClass: string): ClassBuilder;
  implement_interface(interface: string): ClassBuilder;
}

// Automation framework
interface AutomationScript {
  name: string;
  description: string;
  version: string;
  parameters: Parameter[];
  execute(context: ExecutionContext): Promise<ExecutionResult>;
  test(): Promise<TestResult>;
}

class BlogAutomationScript implements AutomationScript {
  name = 'blog-crud-generator';
  description = 'Generates complete CRUD operations for blog entities';
  version = '1.0.0';

  parameters = [
    { name: 'entity', type: 'string', required: true },
    { name: 'include_auth', type: 'boolean', default: true },
    { name: 'database', type: 'string', default: 'postgresql' },
  ];

  async execute(context: ExecutionContext): Promise<ExecutionResult> {
    const { entity, include_auth, database } = context.parameters;

    return await platform
      .from_schema(`models/${entity.toLowerCase()}.schema.dsl`)
      .generate_models({ target: 'sqlalchemy', database })
      .then_generate_api({
        framework: 'fastapi',
        auth: include_auth,
      })
      .then_generate_tests({ framework: 'pytest' })
      .execute();
  }

  async test(): Promise<TestResult> {
    // Test script with mock data
    const mockContext = {
      parameters: { entity: 'TestEntity', include_auth: true, database: 'sqlite' },
    };

    const result = await this.execute(mockContext);
    return { success: result.success, errors: result.errors };
  }
}
```

### Model Management System

```typescript
interface ModelRegistry {
  // Model CRUD operations
  register(model: Model): Promise<ModelRegistration>;
  get(modelId: string): Promise<Model>;
  list(filters?: ModelFilters): Promise<Model[]>;
  update(modelId: string, model: Model): Promise<ModelRegistration>;
  delete(modelId: string): Promise<void>;

  // Versioning operations
  createVersion(modelId: string, changes: ModelChanges): Promise<ModelVersion>;
  getVersion(modelId: string, version: string): Promise<ModelVersion>;
  listVersions(modelId: string): Promise<ModelVersion[]>;
  compareVersions(modelId: string, v1: string, v2: string): Promise<ModelDiff>;

  // Dependency management
  getDependencies(modelId: string): Promise<ModelDependency[]>;
  getDependents(modelId: string): Promise<ModelDependency[]>;
  validateDependencies(model: Model): Promise<ValidationResult>;
}

interface Model {
  id: string;
  name: string;
  type: ModelType; // 'schema', 'api', 'workflow', 'custom'
  content: string; // DSL content
  metadata: ModelMetadata;
  dependencies: string[];
  version: string;
  created_at: Date;
  updated_at: Date;
}

interface ModelMetadata {
  author: string;
  description: string;
  tags: string[];
  stakeholders: Stakeholder[];
  approval_status: ApprovalStatus;
  documentation_url?: string;
  examples: ModelExample[];
}

interface ModelDiff {
  added: ModelElement[];
  removed: ModelElement[];
  modified: ModelElementChange[];
  impact_analysis: ImpactAnalysis;
}

interface ImpactAnalysis {
  affected_models: string[];
  affected_code_files: string[];
  breaking_changes: BreakingChange[];
  migration_required: boolean;
  estimated_effort: EffortEstimate;
}
```

### MDE Transformation System

```typescript
interface TransformationEngine {
  // Model-to-Text transformations
  executeM2T(model: Model, template: Template): Promise<GenerationResult>;

  // Model-to-Model transformations
  executeM2M(sourceModel: Model, transformation: M2MTransformation): Promise<Model>;

  // Transformation chains
  executeChain(chain: TransformationChain): Promise<ChainResult>;

  // Round-trip synchronization
  synchronizeRoundTrip(model: Model, generatedCode: GeneratedCode): Promise<SyncResult>;
}

interface TransformationChain {
  id: string;
  name: string;
  description: string;
  steps: TransformationStep[];
  rollback_strategy: RollbackStrategy;
}

interface TransformationStep {
  id: string;
  type: 'M2T' | 'M2M' | 'validation' | 'custom';
  input_type: string;
  output_type: string;
  transformer: Transformer;
  error_handling: ErrorHandlingStrategy;
  rollback_point: boolean;
}

interface RoundTripSynchronizer {
  // Detect changes in generated code
  detectCodeChanges(originalCode: GeneratedCode, currentCode: string): Promise<CodeChanges>;

  // Extract model changes from code
  extractModelChanges(codeChanges: CodeChanges): Promise<ModelChanges>;

  // Apply changes to model
  applyChangesToModel(model: Model, changes: ModelChanges): Promise<Model>;

  // Validate round-trip consistency
  validateConsistency(model: Model, code: GeneratedCode): Promise<ConsistencyReport>;
}
```

## Data Models

### Database Schema

```sql
-- Models registry
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'schema', 'api', 'workflow', 'custom'
  content TEXT NOT NULL,
  metadata JSONB,
  dependencies TEXT[],
  version VARCHAR(50) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Model versions
CREATE TABLE model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id),
  version VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  changes JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(model_id, version)
);

-- Model dependencies
CREATE TABLE model_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_model_id UUID REFERENCES models(id),
  target_model_id UUID REFERENCES models(id),
  dependency_type VARCHAR(50), -- 'extends', 'imports', 'references'
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_model_id, target_model_id, dependency_type)
);

-- Stakeholder approvals
CREATE TABLE model_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES models(id),
  model_version VARCHAR(50),
  stakeholder_id UUID REFERENCES users(id),
  approval_status VARCHAR(20), -- 'pending', 'approved', 'rejected'
  comments TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transformation history
CREATE TABLE transformations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_model_id UUID REFERENCES models(id),
  transformation_type VARCHAR(50), -- 'M2T', 'M2M', 'round_trip'
  transformation_config JSONB,
  output_files TEXT[],
  status VARCHAR(20), -- 'pending', 'completed', 'failed'
  error_message TEXT,
  executed_by UUID REFERENCES users(id),
  executed_at TIMESTAMP DEFAULT NOW()
);

-- Automation scripts
CREATE TABLE automation_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(50) NOT NULL,
  script_content TEXT NOT NULL,
  parameters JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, version)
);

-- Script executions
CREATE TABLE script_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES automation_scripts(id),
  parameters JSONB,
  status VARCHAR(20), -- 'running', 'completed', 'failed'
  output JSONB,
  error_message TEXT,
  executed_by UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

## Error Handling

### Error Categories

1. **DSL Parsing Errors**
   - Syntax errors in DSL files
   - Semantic validation failures
   - Type checking errors
   - Reference resolution failures

2. **Model Validation Errors**
   - Consistency violations
   - Dependency conflicts
   - Version compatibility issues
   - Stakeholder approval failures

3. **Transformation Errors**
   - Template execution failures
   - AST transformation errors
   - Code generation failures
   - Round-trip synchronization conflicts

4. **Automation Script Errors**
   - Script execution failures
   - Parameter validation errors
   - Resource access violations
   - Timeout and performance issues

### Error Handling Strategy

```typescript
class DSLError extends Error {
  constructor(
    public code: string,
    public message: string,
    public location?: DSLLocation,
    public suggestions?: string[],
    public recoverable: boolean = false,
  ) {
    super(message);
  }
}

interface DSLLocation {
  file: string;
  line: number;
  column: number;
  context: string;
}

interface ErrorRecoveryManager {
  canRecover(error: DSLError): boolean;
  suggestFix(error: DSLError): Promise<FixSuggestion[]>;
  autoFix(error: DSLError): Promise<FixResult>;
  reportError(error: DSLError, context: ErrorContext): Promise<void>;
}

interface FixSuggestion {
  description: string;
  confidence: number;
  fix_type: 'automatic' | 'manual' | 'interactive';
  preview: string;
  apply(): Promise<FixResult>;
}
```

## Testing Strategy

### Unit Testing

- **DSL Parsing**: Syntax validation, semantic analysis, error handling
- **Model Management**: CRUD operations, versioning, dependency resolution
- **Transformations**: M2T, M2M, round-trip synchronization
- **Internal DSL**: Fluent API, script execution, automation framework

### Integration Testing

- **End-to-End Workflows**: Complete MDE workflows from model to code
- **Multi-Stakeholder Scenarios**: Approval workflows, collaboration features
- **Cross-Layer Integration**: DSL → Template → AST transformation chains
- **Performance Testing**: Large model processing, concurrent operations

### DSL Testing Framework

```typescript
interface DSLTestCase {
  name: string;
  dsl_content: string;
  dsl_type: string;
  expected_model: Model;
  should_fail?: boolean;
  expected_error?: string;
}

interface TransformationTestCase {
  name: string;
  source_model: Model;
  transformation: Transformation;
  expected_output: GenerationResult;
  validation_rules: ValidationRule[];
}

class DSLTestRunner {
  runParsingTest(testCase: DSLTestCase): Promise<TestResult>;
  runTransformationTest(testCase: TransformationTestCase): Promise<TestResult>;
  runRoundTripTest(model: Model, code: GeneratedCode): Promise<TestResult>;
  validateModelConsistency(model: Model): Promise<ValidationResult>;
}
```

## Security Considerations

### DSL Security

- **Input Validation**: Strict validation of DSL content and parameters
- **Sandboxed Execution**: Isolated execution environment for script processing
- **Access Control**: Role-based permissions for model and script operations
- **Audit Logging**: Complete tracking of all DSL operations and changes

### Model Security

- **Version Control**: Secure versioning with integrity checks
- **Approval Workflows**: Mandatory approvals for sensitive model changes
- **Dependency Validation**: Security scanning of model dependencies
- **Encryption**: Sensitive model data encryption at rest and in transit

## Performance Optimization

### DSL Processing Optimization

- **Incremental Parsing**: Only reparse changed sections of DSL files
- **Caching Strategy**: Multi-level caching for parsed models and transformations
- **Parallel Processing**: Concurrent processing of independent models
- **Lazy Loading**: On-demand loading of model dependencies

### Transformation Optimization

- **Template Caching**: Compiled template caching with invalidation
- **Batch Operations**: Grouped transformations for efficiency
- **Resource Pooling**: Shared resources for transformation execution
- **Progress Tracking**: Real-time progress for long-running operations

## Integration with Platform Layers

### Template Engine Integration (Layer 2)

```typescript
interface TemplateEngineBridge {
  // DSL to template context conversion
  convertModelToContext(model: Model): Promise<TemplateContext>;

  // Template execution with DSL models
  executeTemplateWithModel(template: Template, model: Model): Promise<GenerationResult>;

  // Macro generation from DSL definitions
  generateMacrosFromModel(model: Model): Promise<MacroDefinition[]>;
}
```

### AST Core Integration (Layer 3)

```typescript
interface ASTCoreBridge {
  // Model-driven AST transformations
  applyModelTransformations(model: Model, ast: ASTNode): Promise<TransformationResult>;

  // Round-trip model extraction from AST
  extractModelFromAST(ast: ASTNode): Promise<Model>;

  // Validation of generated code against model
  validateCodeAgainstModel(code: GeneratedCode, model: Model): Promise<ValidationResult>;
}
```

### Scaffolding Platform Integration (Layer 1)

```typescript
interface ScaffoldingBridge {
  // Project generation from models
  generateProjectFromModels(
    models: Model[],
    config: ProjectConfig,
  ): Promise<ProjectGenerationResult>;

  // Model-driven project updates
  updateProjectFromModels(projectId: string, models: Model[]): Promise<UpdateResult>;

  // Template selection based on models
  selectTemplatesForModels(models: Model[]): Promise<Template[]>;
}
```
