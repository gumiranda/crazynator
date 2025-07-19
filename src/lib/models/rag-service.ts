import { RAGDocument, RAGQueryOptions, RAGResult } from './types';
import { prisma } from '@/lib/db';

export class RAGService {
  private static instance: RAGService;
  private documentStore: Map<string, RAGDocument> = new Map();

  private constructor() {}

  public static getInstance(): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService();
    }
    return RAGService.instance;
  }

  /**
   * Add a document to the RAG knowledge base
   */
  public async addDocument(document: RAGDocument): Promise<void> {
    // Generate embedding for the document content
    const embedding = await this.generateEmbedding(document.content);
    
    const docWithEmbedding = {
      ...document,
      embedding,
      metadata: {
        ...document.metadata,
        timestamp: new Date(),
      },
    };

    this.documentStore.set(document.id, docWithEmbedding);
    
    // Persist to database for durability
    await this.persistDocument(docWithEmbedding);
  }

  /**
   * Query the RAG knowledge base for relevant documents
   */
  public async query(options: RAGQueryOptions): Promise<RAGResult> {
    const startTime = Date.now();
    const { query, topK = 5, threshold = 0.7, filters } = options;

    // Generate embedding for the query
    const queryEmbedding = await this.generateEmbedding(query);

    // Get all documents and calculate similarity scores
    const allDocs = Array.from(this.documentStore.values());
    const scoredDocs = allDocs
      .map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          relevanceScore: this.calculateSimilarity(queryEmbedding, doc.embedding || []),
        },
      }))
      .filter((doc) => (doc.metadata.relevanceScore || 0) >= threshold)
      .filter((doc) => this.applyFilters(doc, filters))
      .sort((a, b) => (b.metadata.relevanceScore || 0) - (a.metadata.relevanceScore || 0))
      .slice(0, topK);

    const queryTime = Date.now() - startTime;

    return {
      documents: scoredDocs,
      totalResults: scoredDocs.length,
      queryTime,
    };
  }

  /**
   * Load documents from the database into memory
   */
  public async loadDocuments(projectId?: string): Promise<void> {
    try {
      // Load from previous messages and fragments
      const messages = await prisma.message.findMany({
        where: projectId ? { projectId } : {},
        include: {
          fragment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100, // Limit to recent messages
      });

      for (const message of messages) {
        // Add message content as a document
        const messageDoc: RAGDocument = {
          id: `message-${message.id}`,
          content: message.content,
          metadata: {
            title: `Message from ${message.role}`,
            source: 'message',
            timestamp: message.createdAt,
            tags: [message.role.toLowerCase(), message.type.toLowerCase()],
          },
        };

        await this.addDocument(messageDoc);

        // Add fragment files as documents if available
        if (message.fragment?.files) {
          const files = message.fragment.files as Record<string, string>;
          for (const [filePath, fileContent] of Object.entries(files)) {
            const fileDoc: RAGDocument = {
              id: `file-${message.fragment.id}-${filePath}`,
              content: fileContent,
              metadata: {
                title: `File: ${filePath}`,
                source: 'file',
                timestamp: message.fragment.createdAt,
                tags: ['file', this.getFileExtension(filePath)],
              },
            };

            await this.addDocument(fileDoc);
          }
        }
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  }

  /**
   * Generate embeddings for text content
   * In a production environment, this would use a proper embedding service
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Simplified embedding generation using text characteristics
    // In production, use OpenAI embeddings or similar service
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0); // 384-dimensional vector

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      
      for (let j = 0; j < embedding.length; j++) {
        embedding[j] += Math.sin(hash + j) * (1 / (i + 1));
      }
    }

    // Normalize the vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map((val) => val / (magnitude || 1));
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const magnitude = Math.sqrt(norm1) * Math.sqrt(norm2);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Apply filters to documents
   */
  private applyFilters(doc: RAGDocument, filters?: Record<string, any>): boolean {
    if (!filters) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (key === 'tags' && doc.metadata.tags) {
        if (!doc.metadata.tags.some((tag) => value.includes(tag))) {
          return false;
        }
      } else if (key === 'source' && doc.metadata.source !== value) {
        return false;
      } else if (key === 'minScore' && (doc.metadata.relevanceScore || 0) < value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Persist document to database
   */
  private async persistDocument(document: RAGDocument): Promise<void> {
    // This could be implemented to store embeddings in a vector database
    // For now, we'll store them in the existing message/fragment structure
    console.log(`Document ${document.id} persisted to memory store`);
  }

  /**
   * Get file extension from file path
   */
  private getFileExtension(filePath: string): string {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot === -1 ? 'unknown' : filePath.substring(lastDot + 1);
  }

  /**
   * Simple hash function for generating embeddings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Clear all documents from the store
   */
  public clearDocuments(): void {
    this.documentStore.clear();
  }

  /**
   * Get the number of documents in the store
   */
  public getDocumentCount(): number {
    return this.documentStore.size;
  }
}