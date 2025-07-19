import { Message } from '@inngest/agent-kit';

export interface CompositeModelConfig {
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

export interface ModelCapabilities {
  maxContextLength: number;
  supportsToolCalling: boolean;
  supportsStreaming: boolean;
  supportsMultimodal: boolean;
  optimalForTasks: string[];
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: {
    title?: string;
    source?: string;
    timestamp: Date;
    tags?: string[];
    relevanceScore?: number;
  };
  embedding?: number[];
}

export interface RAGQueryOptions {
  query: string;
  topK?: number;
  threshold?: number;
  filters?: Record<string, any>;
}

export interface RAGResult {
  documents: RAGDocument[];
  totalResults: number;
  queryTime: number;
}

export interface PostProcessingOptions {
  enableCodeOptimization: boolean;
  enableErrorCorrection: boolean;
  enableFormatting: boolean;
  enableValidation: boolean;
  customFilters?: PostProcessingFilter[];
}

export interface PostProcessingFilter {
  name: string;
  apply: (content: string, context?: any) => Promise<string>;
  priority: number;
}

export interface CompositeModelResponse {
  content: string;
  ragContext?: RAGDocument[];
  metadata: {
    modelUsed: string;
    processingTime: number;
    ragEnabled: boolean;
    postProcessed: boolean;
    confidence?: number;
  };
}

export interface ModelContext {
  projectId: string;
  previousMessages: Message[];
  userQuery: string;
  additionalContext?: Record<string, any>;
}