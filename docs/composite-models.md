# Composite Model Family v0-1.5

## Overview

The Composite Model Family v0-1.5 is an advanced AI system that combines multiple technologies to provide superior code generation and assistance capabilities. The family consists of two primary models optimized for different use cases, enhanced with Retrieval-Augmented Generation (RAG) and post-processing capabilities.

## Models

### v0-1.5-md (Medium)
- **Base Model**: OpenAI GPT-4o
- **Optimization**: Balanced performance for rapid development
- **Context Length**: 128,000 tokens
- **Temperature**: 0.1
- **Max Tokens**: 4,000

**Optimal Use Cases:**
- Code generation
- Debugging
- Refactoring
- Documentation
- Rapid prototyping

### v0-1.5-lg (Large)
- **Base Model**: Anthropic Claude-3.5-Sonnet
- **Optimization**: Complex tasks and advanced reasoning
- **Context Length**: 200,000 tokens
- **Temperature**: 0.05
- **Max Tokens**: 8,000

**Optimal Use Cases:**
- Complex architecture design
- System design
- Advanced algorithms
- Code review
- Performance optimization
- Large-scale refactoring

## Enhanced Features

### 1. Retrieval-Augmented Generation (RAG)

The RAG system enhances model responses by providing relevant contextual information from:

- Previous project messages
- Generated code fragments
- File contents
- Project history

**Benefits:**
- More contextually aware responses
- Consistent coding patterns
- Better understanding of project structure
- Reduced hallucination

### 2. Post-Processing Pipeline

The post-processing system automatically optimizes generated code through multiple filters:

#### Code Optimization Filter
- Removes redundant imports
- Optimizes React components
- Cleans up unnecessary comments

#### Error Correction Filter
- Fixes common TypeScript errors
- Resolves import/export issues
- Corrects React hooks problems

#### Formatting Filter
- Standardizes indentation (2 spaces)
- Fixes line endings
- Organizes imports (external first, then internal)

#### Validation Filter
- Performs syntax validation
- Attempts to fix basic validation errors
- Reports unresolvable issues

## Usage

### Direct Model Selection

```typescript
import { CompositeModelFamily } from '@/lib/models';

const compositeFamily = CompositeModelFamily.getInstance();

// Use specific model
const response = await compositeFamily.generateResponse('v0-1.5-md', {
  projectId: 'your-project-id',
  previousMessages: messages,
  userQuery: 'Create a React component for user authentication',
});
```

### Smart Model Selection

```typescript
import { ModelUtils } from '@/lib/models';

// Automatic model recommendation
const response = await ModelUtils.generateSmartResponse({
  projectId: 'your-project-id',
  previousMessages: messages,
  userQuery: 'Design a scalable microservices architecture',
});
```

### Inngest Functions

The composite models are integrated with Inngest for background processing:

```typescript
// Use v0-1.5-md model
await inngest.send({
  name: 'composite-model/md',
  data: {
    projectId: 'project-123',
    value: 'Create a login form with validation',
  },
});

// Use v0-1.5-lg model
await inngest.send({
  name: 'composite-model/lg',
  data: {
    projectId: 'project-123',
    value: 'Design a distributed caching system',
  },
});

// Smart model selection
await inngest.send({
  name: 'composite-model/smart',
  data: {
    projectId: 'project-123',
    value: 'Optimize database queries for better performance',
  },
});
```

## Configuration

### Model Configuration

Each model can be customized with the following parameters:

```typescript
interface CompositeModelConfig {
  name: string;
  version: string;
  baseModel: {
    provider: 'openai' | 'anthropic';
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
  ragEnabled: boolean;
  postProcessingEnabled: boolean;
  capabilities: ModelCapabilities;
}
```

### RAG Configuration

```typescript
// Query options
const ragResult = await ragService.query({
  query: 'user authentication',
  topK: 5,           // Number of documents to retrieve
  threshold: 0.7,    // Minimum relevance score
  filters: {
    tags: ['react', 'auth'],
    source: 'file',
  },
});
```

### Post-Processing Configuration

```typescript
const postProcessingOptions = {
  enableCodeOptimization: true,
  enableErrorCorrection: true,
  enableFormatting: true,
  enableValidation: true,
  customFilters: [
    {
      name: 'custom-linter',
      priority: 5,
      apply: async (content) => {
        // Custom processing logic
        return processedContent;
      },
    },
  ],
};
```

## Performance Metrics

### Processing Time Estimation

The system provides processing time estimates based on:

- Query length and complexity
- Model size (md vs lg)
- RAG enabled/disabled
- Post-processing enabled/disabled

Example estimates:
- Simple code generation (md): ~2-3 seconds
- Complex architecture (lg): ~5-8 seconds
- With RAG: +1 second
- With post-processing: +0.5 seconds

### Confidence Scoring

Responses include confidence scores based on:
- RAG context relevance
- Response completeness
- Model certainty

Confidence ranges:
- 0.0-0.5: Low confidence
- 0.5-0.8: Medium confidence
- 0.8-1.0: High confidence

## Best Practices

### Model Selection

1. **Use v0-1.5-md for:**
   - Quick prototypes
   - Standard CRUD operations
   - Simple components
   - Bug fixes

2. **Use v0-1.5-lg for:**
   - System architecture
   - Complex algorithms
   - Performance-critical code
   - Large refactoring tasks

3. **Use Smart Selection for:**
   - Unknown complexity
   - Mixed requirements
   - Exploration tasks

### RAG Optimization

1. Keep project messages focused and relevant
2. Regularly clean up outdated fragments
3. Use descriptive titles for code fragments
4. Tag content appropriately

### Post-Processing

1. Enable all filters for production code
2. Add custom filters for project-specific requirements
3. Review validation errors for complex code
4. Test generated code after processing

## Monitoring and Health

### Health Check

```typescript
const health = await ModelUtils.getModelHealth();
console.log(`System status: ${health.status}`);
console.log(`RAG documents: ${health.ragService.documentCount}`);
```

### Performance Analysis

```typescript
const metrics = ModelUtils.analyzeModelPerformance(responses);
console.log(`Average processing time: ${metrics.averageProcessingTime}ms`);
console.log(`Average confidence: ${metrics.averageConfidence}`);
```

## Troubleshooting

### Common Issues

1. **Low Confidence Scores**
   - Check RAG document relevance
   - Improve query specificity
   - Verify model selection

2. **Slow Processing**
   - Use appropriate model size
   - Optimize RAG queries
   - Consider disabling post-processing for drafts

3. **Quality Issues**
   - Enable post-processing
   - Check validation errors
   - Review custom filters

### Error Handling

The system includes comprehensive error handling:
- Model availability checks
- RAG service fallbacks
- Post-processing error recovery
- Graceful degradation

## Future Enhancements

- Additional model variants (v0-1.5-xl, v0-1.5-light)
- Advanced RAG with vector databases
- Real-time model switching
- Custom model training
- Performance optimization
- Enhanced monitoring and analytics

## API Reference

For detailed API documentation, see:
- [Model Types](../src/lib/models/types.ts)
- [Composite Models](../src/lib/models/composite-models.ts)
- [RAG Service](../src/lib/models/rag-service.ts)
- [Post Processor](../src/lib/models/post-processor.ts)
- [Model Utils](../src/lib/models/model-utils.ts)