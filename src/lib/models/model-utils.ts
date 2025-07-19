import { CompositeModelFamily } from './composite-models';
import { ModelContext, CompositeModelResponse } from './types';

/**
 * Utility class for composite model operations
 */
export class ModelUtils {
  private static compositeFamily = CompositeModelFamily.getInstance();

  /**
   * Get the best model recommendation for a given task
   */
  public static getBestModel(taskDescription: string): string {
    return this.compositeFamily.recommendModel(taskDescription);
  }

  /**
   * Get all available models with their capabilities
   */
  public static getAvailableModels() {
    const models = this.compositeFamily.getAvailableModels();
    return models.map(modelName => ({
      name: modelName,
      config: this.compositeFamily.getModelConfig(modelName),
    }));
  }

  /**
   * Generate a response with automatic model selection
   */
  public static async generateSmartResponse(
    context: ModelContext
  ): Promise<CompositeModelResponse> {
    const bestModel = this.getBestModel(context.userQuery);
    return await this.compositeFamily.generateResponse(bestModel, context);
  }

  /**
   * Generate responses with multiple models and compare results
   */
  public static async generateComparativeResponse(
    context: ModelContext,
    models: string[] = ['v0-1.5-md', 'v0-1.5-lg']
  ): Promise<{
    responses: Array<{ model: string; response: CompositeModelResponse }>;
    recommended: string;
  }> {
    const responses = await Promise.all(
      models.map(async (model) => ({
        model,
        response: await this.compositeFamily.generateResponse(model, context),
      }))
    );

    // Find the response with highest confidence
    const recommended = responses.reduce((best, current) => 
      (current.response.metadata.confidence || 0) > (best.response.metadata.confidence || 0)
        ? current
        : best
    ).model;

    return { responses, recommended };
  }

  /**
   * Analyze model performance metrics
   */
  public static analyzeModelPerformance(responses: CompositeModelResponse[]): {
    averageProcessingTime: number;
    averageConfidence: number;
    ragUsage: number;
    postProcessingUsage: number;
  } {
    const totalResponses = responses.length;
    
    const averageProcessingTime = responses.reduce(
      (sum, response) => sum + response.metadata.processingTime, 0
    ) / totalResponses;

    const averageConfidence = responses.reduce(
      (sum, response) => sum + (response.metadata.confidence || 0), 0
    ) / totalResponses;

    const ragUsage = responses.filter(response => response.metadata.ragEnabled).length / totalResponses;
    
    const postProcessingUsage = responses.filter(
      response => response.metadata.postProcessed
    ).length / totalResponses;

    return {
      averageProcessingTime,
      averageConfidence,
      ragUsage,
      postProcessingUsage,
    };
  }

  /**
   * Get model health status
   */
  public static async getModelHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    models: Array<{
      name: string;
      status: 'healthy' | 'error';
      lastUsed?: Date;
      errorCount: number;
    }>;
    ragService: {
      status: 'healthy' | 'error';
      documentCount: number;
    };
  }> {
    const models = this.compositeFamily.getAvailableModels();
    const ragService = this.compositeFamily.getRAGService();

    const modelStatuses = models.map(modelName => ({
      name: modelName,
      status: 'healthy' as const, // In production, you'd check actual model health
      errorCount: 0,
    }));

    const ragStatus = {
      status: 'healthy' as const,
      documentCount: ragService.getDocumentCount(),
    };

    const overallStatus = modelStatuses.every(m => m.status === 'healthy') && 
                         ragStatus.status === 'healthy' 
                         ? 'healthy' as const
                         : 'degraded' as const;

    return {
      status: overallStatus,
      models: modelStatuses,
      ragService: ragStatus,
    };
  }

  /**
   * Clear RAG cache and reload documents
   */
  public static async refreshRAGKnowledge(projectId?: string): Promise<void> {
    const ragService = this.compositeFamily.getRAGService();
    ragService.clearDocuments();
    await ragService.loadDocuments(projectId);
  }

  /**
   * Get model configuration details
   */
  public static getModelDetails(modelName: string) {
    const config = this.compositeFamily.getModelConfig(modelName);
    if (!config) {
      throw new Error(`Model ${modelName} not found`);
    }

    return {
      name: config.name,
      version: config.version,
      provider: config.baseModel.provider,
      baseModel: config.baseModel.model,
      capabilities: config.capabilities,
      features: {
        rag: config.ragEnabled,
        postProcessing: config.postProcessingEnabled,
      },
      optimalFor: config.capabilities.optimalForTasks,
    };
  }

  /**
   * Estimate processing time for a given task
   */
  public static estimateProcessingTime(
    userQuery: string,
    modelName?: string
  ): {
    estimatedTimeMs: number;
    factors: {
      queryLength: number;
      complexity: 'low' | 'medium' | 'high';
      modelSize: 'md' | 'lg';
      ragEnabled: boolean;
      postProcessingEnabled: boolean;
    };
  } {
    const selectedModel = modelName || this.getBestModel(userQuery);
    const config = this.compositeFamily.getModelConfig(selectedModel);
    
    if (!config) {
      throw new Error(`Model ${selectedModel} not found`);
    }

    const queryLength = userQuery.length;
    const complexity = this.getTaskComplexity(userQuery);
    const modelSize = selectedModel.includes('lg') ? 'lg' : 'md';

    let baseTime = 2000; // Base 2 seconds

    // Adjust for query length
    baseTime += Math.floor(queryLength / 100) * 500;

    // Adjust for complexity
    switch (complexity) {
      case 'high':
        baseTime *= 2;
        break;
      case 'medium':
        baseTime *= 1.5;
        break;
      default:
        break;
    }

    // Adjust for model size
    if (modelSize === 'lg') {
      baseTime *= 1.3;
    }

    // Adjust for features
    if (config.ragEnabled) {
      baseTime += 1000; // RAG adds ~1 second
    }

    if (config.postProcessingEnabled) {
      baseTime += 500; // Post-processing adds ~0.5 seconds
    }

    return {
      estimatedTimeMs: Math.round(baseTime),
      factors: {
        queryLength,
        complexity,
        modelSize,
        ragEnabled: config.ragEnabled,
        postProcessingEnabled: config.postProcessingEnabled,
      },
    };
  }

  /**
   * Determine task complexity from user query
   */
  private static getTaskComplexity(userQuery: string): 'low' | 'medium' | 'high' {
    const query = userQuery.toLowerCase();
    
    const highComplexityKeywords = [
      'architecture', 'system design', 'scalability', 'microservices',
      'optimization', 'algorithm', 'performance', 'database design',
      'security', 'authentication', 'authorization', 'deployment'
    ];

    const mediumComplexityKeywords = [
      'refactor', 'debug', 'test', 'component', 'api', 'integration',
      'validation', 'form', 'state management', 'routing'
    ];

    if (highComplexityKeywords.some(keyword => query.includes(keyword))) {
      return 'high';
    }

    if (mediumComplexityKeywords.some(keyword => query.includes(keyword))) {
      return 'medium';
    }

    return 'low';
  }
}