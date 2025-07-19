import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { FigmaFile, FigmaImportConfig, FigmaImportResult, ImportError } from '@/types/figma';

export class FigmaClient {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: 'https://api.figma.com/v1',
      headers: {
        'X-Figma-Token': accessToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds timeout
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[Figma API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[Figma API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[Figma API] Response error:', error.response?.data || error.message);
        return Promise.reject(this.formatError(error));
      }
    );
  }

  /**
   * Extract file ID from Figma URL
   */
  public static extractFileId(url: string): string | null {
    const patterns = [
      /figma\.com\/file\/([a-zA-Z0-9]+)/,
      /figma\.com\/design\/([a-zA-Z0-9]+)/,
      /figma\.com\/proto\/([a-zA-Z0-9]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // If it's already a file ID
    if (/^[a-zA-Z0-9]+$/.test(url)) {
      return url;
    }

    return null;
  }

  /**
   * Validate Figma access token
   */
  public async validateToken(): Promise<boolean> {
    try {
      await this.client.get('/me');
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }

  /**
   * Get user information
   */
  public async getUser() {
    try {
      const response = await this.client.get('/me');
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get Figma file data
   */
  public async getFile(fileId: string, options?: {
    version?: string;
    ids?: string[];
    depth?: number;
    geometry?: 'paths' | 'vector';
    plugin_data?: string;
    branch_data?: boolean;
  }): Promise<FigmaFile> {
    try {
      const params = new URLSearchParams();
      
      if (options?.version) params.append('version', options.version);
      if (options?.ids) params.append('ids', options.ids.join(','));
      if (options?.depth) params.append('depth', options.depth.toString());
      if (options?.geometry) params.append('geometry', options.geometry);
      if (options?.plugin_data) params.append('plugin_data', options.plugin_data);
      if (options?.branch_data) params.append('branch_data', 'true');

      const url = `/files/${fileId}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.client.get(url);
      
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file nodes by IDs
   */
  public async getFileNodes(fileId: string, nodeIds: string[], options?: {
    version?: string;
    depth?: number;
    geometry?: 'paths' | 'vector';
    plugin_data?: string;
  }) {
    try {
      const params = new URLSearchParams();
      params.append('ids', nodeIds.join(','));
      
      if (options?.version) params.append('version', options.version);
      if (options?.depth) params.append('depth', options.depth.toString());
      if (options?.geometry) params.append('geometry', options.geometry);
      if (options?.plugin_data) params.append('plugin_data', options.plugin_data);

      const response = await this.client.get(`/files/${fileId}/nodes?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file images
   */
  public async getFileImages(fileId: string, nodeIds: string[], options?: {
    scale?: number;
    format?: 'jpg' | 'png' | 'svg' | 'pdf';
    svg_include_id?: boolean;
    svg_simplify_stroke?: boolean;
    use_absolute_bounds?: boolean;
    version?: string;
  }): Promise<{ [nodeId: string]: string }> {
    try {
      const params = new URLSearchParams();
      params.append('ids', nodeIds.join(','));
      
      if (options?.scale) params.append('scale', options.scale.toString());
      if (options?.format) params.append('format', options.format);
      if (options?.svg_include_id) params.append('svg_include_id', 'true');
      if (options?.svg_simplify_stroke) params.append('svg_simplify_stroke', 'true');
      if (options?.use_absolute_bounds) params.append('use_absolute_bounds', 'true');
      if (options?.version) params.append('version', options.version);

      const response = await this.client.get(`/images/${fileId}?${params.toString()}`);
      return response.data.images;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file components
   */
  public async getFileComponents(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/components`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file component sets
   */
  public async getFileComponentSets(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/component_sets`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file styles
   */
  public async getFileStyles(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/styles`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file comments
   */
  public async getFileComments(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/comments`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get file versions
   */
  public async getFileVersions(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/versions`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get team projects
   */
  public async getTeamProjects(teamId: string) {
    try {
      const response = await this.client.get(`/teams/${teamId}/projects`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get project files
   */
  public async getProjectFiles(projectId: string) {
    try {
      const response = await this.client.get(`/projects/${projectId}/files`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get component metadata
   */
  public async getComponent(componentKey: string) {
    try {
      const response = await this.client.get(`/components/${componentKey}`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get style metadata
   */
  public async getStyle(styleKey: string) {
    try {
      const response = await this.client.get(`/styles/${styleKey}`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get local variables
   */
  public async getLocalVariables(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/variables/local`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Get published variables
   */
  public async getPublishedVariables(fileId: string) {
    try {
      const response = await this.client.get(`/files/${fileId}/variables/published`);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Download asset from URL
   */
  public async downloadAsset(url: string): Promise<Buffer> {
    try {
      const response = await axios.get(url, { 
        responseType: 'arraybuffer',
        timeout: 60000 // 60 seconds for asset downloads
      });
      return Buffer.from(response.data);
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Batch download multiple assets
   */
  public async downloadAssets(urls: string[]): Promise<{ [url: string]: Buffer }> {
    const results: { [url: string]: Buffer } = {};
    const promises = urls.map(async (url) => {
      try {
        const buffer = await this.downloadAsset(url);
        results[url] = buffer;
      } catch (error) {
        console.error(`Failed to download asset from ${url}:`, error);
        // Continue with other downloads even if one fails
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Get file with comprehensive data
   */
  public async getFileWithAllData(fileId: string) {
    try {
      const [
        file,
        components,
        componentSets,
        styles,
        comments,
        versions
      ] = await Promise.all([
        this.getFile(fileId),
        this.getFileComponents(fileId).catch(() => ({ meta: { components: [] } })),
        this.getFileComponentSets(fileId).catch(() => ({ meta: { component_sets: [] } })),
        this.getFileStyles(fileId).catch(() => ({ meta: { styles: [] } })),
        this.getFileComments(fileId).catch(() => ({ comments: [] })),
        this.getFileVersions(fileId).catch(() => ({ versions: [] }))
      ]);

      return {
        file,
        components: components.meta?.components || [],
        componentSets: componentSets.meta?.component_sets || [],
        styles: styles.meta?.styles || [],
        comments: comments.comments || [],
        versions: versions.versions || []
      };
    } catch (error) {
      throw this.formatError(error);
    }
  }

  /**
   * Format error for consistent error handling
   */
  private formatError(error: any): ImportError {
    if (error.response) {
      // HTTP error response
      const status = error.response.status;
      const data = error.response.data;
      
      let code = 'HTTP_ERROR';
      let message = 'Unknown HTTP error';

      switch (status) {
        case 400:
          code = 'BAD_REQUEST';
          message = 'Invalid request parameters';
          break;
        case 401:
          code = 'UNAUTHORIZED';
          message = 'Invalid or missing access token';
          break;
        case 403:
          code = 'FORBIDDEN';
          message = 'Access denied to the requested resource';
          break;
        case 404:
          code = 'NOT_FOUND';
          message = 'File or resource not found';
          break;
        case 429:
          code = 'RATE_LIMITED';
          message = 'Too many requests, please try again later';
          break;
        case 500:
          code = 'SERVER_ERROR';
          message = 'Figma server error';
          break;
        default:
          message = `HTTP ${status} error`;
      }

      return {
        code,
        message: data?.err || data?.message || message,
        details: {
          status,
          data,
          url: error.config?.url
        }
      };
    } else if (error.request) {
      // Network error
      return {
        code: 'NETWORK_ERROR',
        message: 'Network error - could not connect to Figma API',
        details: {
          timeout: error.code === 'ECONNABORTED',
          message: error.message
        }
      };
    } else {
      // Other error
      return {
        code: 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error occurred',
        details: error
      };
    }
  }

  /**
   * Test connection to Figma API
   */
  public async testConnection(): Promise<{ success: boolean; error?: ImportError }> {
    try {
      await this.validateToken();
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error as ImportError 
      };
    }
  }

  /**
   * Get rate limit information
   */
  public async getRateLimitInfo() {
    try {
      const response = await this.client.get('/me');
      return {
        remaining: response.headers['x-ratelimit-remaining'],
        limit: response.headers['x-ratelimit-limit'],
        reset: response.headers['x-ratelimit-reset']
      };
    } catch (error) {
      return null;
    }
  }
}

/**
 * Create a Figma client instance
 */
export function createFigmaClient(accessToken: string): FigmaClient {
  return new FigmaClient(accessToken);
}

/**
 * Validate Figma URL format
 */
export function isValidFigmaUrl(url: string): boolean {
  const patterns = [
    /^https:\/\/(?:www\.)?figma\.com\/file\/[a-zA-Z0-9]+/,
    /^https:\/\/(?:www\.)?figma\.com\/design\/[a-zA-Z0-9]+/,
    /^https:\/\/(?:www\.)?figma\.com\/proto\/[a-zA-Z0-9]+/,
  ];

  return patterns.some(pattern => pattern.test(url));
}

/**
 * Extract team ID from Figma file URL
 */
export function extractTeamId(url: string): string | null {
  const match = url.match(/figma\.com\/file\/[a-zA-Z0-9]+\/[^/]+\/team\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Extract project ID from Figma file URL
 */
export function extractProjectId(url: string): string | null {
  const match = url.match(/figma\.com\/file\/[a-zA-Z0-9]+\/[^/]+\/project\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}