import {
  createAgent,
  createNetwork,
  openai,
  anthropic,
  type Message,
  createState,
} from '@inngest/agent-kit';
import {
  CompositeModelConfig,
  CompositeModelResponse,
  ModelContext,
  PostProcessingOptions,
} from './types';
import { RAGService } from './rag-service';
import { PostProcessor } from './post-processor';

export class CompositeModelFamily {
  private static instance: CompositeModelFamily;
  private ragService: RAGService;
  private postProcessor: PostProcessor;
  private models: Map<string, CompositeModelConfig> = new Map();

  private constructor() {
    this.ragService = RAGService.getInstance();
    this.postProcessor = PostProcessor.getInstance();
    this.initializeModels();
  }

  public static getInstance(): CompositeModelFamily {
    if (!CompositeModelFamily.instance) {
      CompositeModelFamily.instance = new CompositeModelFamily();
    }
    return CompositeModelFamily.instance;
  }

  /**
   * Initialize the composite model configurations
   */
  private initializeModels(): void {
    // v0-1.5-md: Medium-sized model optimized for balanced performance
    this.models.set('v0-1.5-md', {
      name: 'v0-1.5-md',
      version: '1.5.0',
      baseModel: {
        provider: 'openai',
        model: 'gpt-4o',
        temperature: 0.1,
        maxTokens: 4000,
      },
      ragEnabled: true,
      postProcessingEnabled: true,
      capabilities: {
        maxContextLength: 128000,
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsMultimodal: false,
        optimalForTasks: [
          'code generation',
          'debugging',
          'refactoring',
          'documentation',
          'rapid prototyping',
        ],
      },
    });

    // v0-1.5-lg: Large model optimized for complex tasks
    this.models.set('v0-1.5-lg', {
      name: 'v0-1.5-lg',
      version: '1.5.0',
      baseModel: {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.05,
        maxTokens: 8000,
      },
      ragEnabled: true,
      postProcessingEnabled: true,
      capabilities: {
        maxContextLength: 200000,
        supportsToolCalling: true,
        supportsStreaming: true,
        supportsMultimodal: true,
        optimalForTasks: [
          'complex architecture',
          'system design',
          'advanced algorithms',
          'code review',
          'performance optimization',
          'large-scale refactoring',
        ],
      },
    });
  }

  /**
   * Generate a response using the specified composite model
   */
  public async generateResponse(
    modelName: string,
    context: ModelContext
  ): Promise<CompositeModelResponse> {
    const startTime = Date.now();
    const modelConfig = this.models.get(modelName);

    if (!modelConfig) {
      throw new Error(`Model ${modelName} not found`);
    }

    try {
      // Step 1: Load RAG documents if enabled
      let ragContext: any[] = [];
      if (modelConfig.ragEnabled) {
        await this.ragService.loadDocuments(context.projectId);
        const ragResult = await this.ragService.query({
          query: context.userQuery,
          topK: modelName === 'v0-1.5-lg' ? 8 : 5,
          threshold: 0.6,
        });
        ragContext = ragResult.documents;
      }

      // Step 2: Prepare enhanced prompt with RAG context
      const enhancedPrompt = this.buildEnhancedPrompt(
        context.userQuery,
        ragContext,
        modelConfig
      );

      // Step 3: Create and run the model
      const agent = this.createAgent(modelConfig, ragContext);
      const result = await agent.run(enhancedPrompt);

      // Step 4: Extract content from result
      let content = this.extractContent(result.output);

      // Step 5: Apply post-processing if enabled
      if (modelConfig.postProcessingEnabled) {
        const postProcessingOptions: PostProcessingOptions = {
          enableCodeOptimization: true,
          enableErrorCorrection: true,
          enableFormatting: true,
          enableValidation: true,
        };

        content = await this.postProcessor.process(
          content,
          postProcessingOptions,
          { modelConfig, ragContext, originalQuery: context.userQuery }
        );
      }

      const processingTime = Date.now() - startTime;

      return {
        content,
        ragContext: modelConfig.ragEnabled ? ragContext : undefined,
        metadata: {
          modelUsed: modelName,
          processingTime,
          ragEnabled: modelConfig.ragEnabled,
          postProcessed: modelConfig.postProcessingEnabled,
          confidence: this.calculateConfidence(result, ragContext),
        },
      };
    } catch (error) {
      console.error(`Error generating response with ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Create an agent based on the model configuration
   */
  private createAgent(
    config: CompositeModelConfig,
    ragContext: any[]
  ) {
    const systemPrompt = this.buildSystemPrompt(config, ragContext);

    const modelProvider = config.baseModel.provider === 'openai' 
      ? openai({
          model: config.baseModel.model,
          defaultParameters: {
            temperature: config.baseModel.temperature || 0.1,
            max_tokens: config.baseModel.maxTokens || 4000,
          },
        })
      : anthropic({
          model: config.baseModel.model,
          defaultParameters: {
            temperature: config.baseModel.temperature || 0.1,
            max_tokens: config.baseModel.maxTokens || 8000,
          },
        });

    return createAgent({
      name: `${config.name}-agent`,
      description: `Composite model ${config.name} with RAG and post-processing capabilities`,
      system: systemPrompt,
      model: modelProvider,
    });
  }

  /**
   * Build system prompt with model-specific optimizations
   */
  private buildSystemPrompt(config: CompositeModelConfig, ragContext: any[]): string {
    let systemPrompt = `You are ${config.name}, a composite AI model optimized for ${config.capabilities.optimalForTasks.join(', ')}.

Model Capabilities:
- Max Context Length: ${config.capabilities.maxContextLength.toLocaleString()} tokens
- Tool Calling: ${config.capabilities.supportsToolCalling ? 'Enabled' : 'Disabled'}
- Streaming: ${config.capabilities.supportsStreaming ? 'Enabled' : 'Disabled'}
- Multimodal: ${config.capabilities.supportsMultimodal ? 'Enabled' : 'Disabled'}

You have been enhanced with:
${config.ragEnabled ? '- RAG (Retrieval-Augmented Generation) for contextual knowledge' : ''}
${config.postProcessingEnabled ? '- Post-processing for optimized output quality' : ''}

Guidelines:
1. Leverage your enhanced capabilities for superior code generation
2. Use contextual knowledge from RAG when available
3. Focus on ${config.capabilities.optimalForTasks[0]} as your primary strength
4. Ensure code quality, maintainability, and best practices
5. Provide detailed explanations when beneficial`;

    if (ragContext.length > 0) {
      systemPrompt += `\n\nContextual Knowledge Available:
${ragContext.map((doc, index) => `${index + 1}. ${doc.metadata.title || 'Document'}: ${doc.content.substring(0, 200)}...`).join('\n')}

Use this contextual knowledge to inform your responses and provide more accurate, relevant solutions.`;
    }

    return systemPrompt;
  }

  /**
   * Build enhanced prompt with RAG context
   */
  private buildEnhancedPrompt(
    userQuery: string,
    ragContext: any[],
    config: CompositeModelConfig
  ): string {
    let enhancedPrompt = userQuery;

    if (ragContext.length > 0) {
      enhancedPrompt = `Based on the following relevant context and your expertise in ${config.capabilities.optimalForTasks.join(', ')}, please address this request:

RELEVANT CONTEXT:
${ragContext.map((doc, index) => `
[${index + 1}] ${doc.metadata.title || 'Context'}
Source: ${doc.metadata.source || 'unknown'}
Relevance: ${((doc.metadata.relevanceScore || 0) * 100).toFixed(1)}%
Content: ${doc.content}
`).join('\n')}

USER REQUEST:
${userQuery}

Please provide a comprehensive solution that leverages both the contextual knowledge and your advanced capabilities.`;
    }

    return enhancedPrompt;
  }

  /**
   * Extract content from agent response
   */
  private extractContent(output: Message[]): string {
    if (output.length === 0) {
      return 'No response generated.';
    }

    const message = output[0];
    if (message.type !== 'text') {
      return 'Non-text response received.';
    }

    if (Array.isArray(message.content)) {
      return message.content.map((content) => content.text).join('');
    }

    return message.content;
  }

  /**
   * Calculate confidence score based on various factors
   */
  private calculateConfidence(result: any, ragContext: any[]): number {
    let confidence = 0.7; // Base confidence

    // Increase confidence if RAG context is available and relevant
    if (ragContext.length > 0) {
      const avgRelevance = ragContext.reduce(
        (sum, doc) => sum + (doc.metadata.relevanceScore || 0),
        0
      ) / ragContext.length;
      confidence += avgRelevance * 0.2;
    }

    // Increase confidence based on response completeness
    const responseLength = this.extractContent(result.output).length;
    if (responseLength > 500) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Get available models
   */
  public getAvailableModels(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Get model configuration
   */
  public getModelConfig(modelName: string): CompositeModelConfig | undefined {
    return this.models.get(modelName);
  }

  /**
   * Add a new model configuration
   */
  public addModel(config: CompositeModelConfig): void {
    this.models.set(config.name, config);
  }

  /**
   * Remove a model
   */
  public removeModel(modelName: string): void {
    this.models.delete(modelName);
  }

  /**
   * Get RAG service instance
   */
  public getRAGService(): RAGService {
    return this.ragService;
  }

  /**
   * Get post processor instance
   */
  public getPostProcessor(): PostProcessor {
    return this.postProcessor;
  }

  /**
   * Get model recommendations based on task type
   */
  public recommendModel(taskType: string): string {
    const taskLowerCase = taskType.toLowerCase();

    for (const [modelName, config] of this.models.entries()) {
      if (config.capabilities.optimalForTasks.some(task => 
        task.toLowerCase().includes(taskLowerCase) || 
        taskLowerCase.includes(task.toLowerCase())
      )) {
        return modelName;
      }
    }

    // Default recommendation
    return 'v0-1.5-md';
  }
}