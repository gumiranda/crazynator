import { FigmaClient } from './figma-client';
import { analyzeFigmaFile } from './figma-analyzer';
import type {
  FigmaImportConfig,
  FigmaImportResult,
  DesignContext,
  ImportError,
  ImportWarning,
  ImportStats,
  OutputFormat
} from '@/types/figma';

export class FigmaImportService {
  private client: FigmaClient;
  private config: FigmaImportConfig;

  constructor(config: FigmaImportConfig) {
    this.config = config;
    this.client = new FigmaClient(config.accessToken);
  }

  /**
   * Import and analyze a Figma file
   */
  public async importFile(): Promise<FigmaImportResult> {
    const startTime = Date.now();
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];
    let designContext: DesignContext | undefined;

    try {
      // Validate configuration
      const configValidation = this.validateConfig();
      if (!configValidation.valid) {
        return {
          success: false,
          errors: configValidation.errors,
          warnings,
          stats: this.createEmptyStats(startTime)
        };
      }

      // Extract file ID from URL
      const fileId = FigmaClient.extractFileId(this.config.fileUrl);
      if (!fileId) {
        return {
          success: false,
          errors: [{
            code: 'INVALID_URL',
            message: 'Invalid Figma file URL provided',
            details: { url: this.config.fileUrl }
          }],
          warnings,
          stats: this.createEmptyStats(startTime)
        };
      }

      // Test connection
      const connectionTest = await this.client.testConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          errors: [connectionTest.error!],
          warnings,
          stats: this.createEmptyStats(startTime)
        };
      }

      // Fetch Figma file data
      console.log(`[Figma Import] Fetching file data for: ${fileId}`);
      const figmaData = await this.client.getFileWithAllData(fileId);

      // Analyze the file
      console.log('[Figma Import] Analyzing design context...');
      designContext = analyzeFigmaFile(figmaData.file);

      // Enhance with additional data
      if (this.config.includeComponents && figmaData.components.length > 0) {
        await this.enhanceWithComponentData(designContext, figmaData.components);
      }

      if (this.config.includeStyles && figmaData.styles.length > 0) {
        await this.enhanceWithStyleData(designContext, figmaData.styles);
      }

      if (this.config.includeAssets) {
        await this.processAssets(designContext, fileId);
      }

      // Generate additional outputs
      if (this.config.generateCode) {
        await this.generateCodeOutputs(designContext);
      }

      const processingTime = Date.now() - startTime;
      const stats = this.calculateStats(designContext, processingTime);

      return {
        success: true,
        data: designContext,
        errors,
        warnings,
        stats
      };

    } catch (error) {
      console.error('[Figma Import] Import failed:', error);
      
      const importError: ImportError = {
        code: 'IMPORT_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error during import',
        details: error
      };

      return {
        success: false,
        errors: [importError],
        warnings,
        stats: this.createEmptyStats(startTime)
      };
    }
  }

  /**
   * Validate import configuration
   */
  private validateConfig(): { valid: boolean; errors: ImportError[] } {
    const errors: ImportError[] = [];

    if (!this.config.fileUrl) {
      errors.push({
        code: 'MISSING_FILE_URL',
        message: 'Figma file URL is required'
      });
    }

    if (!this.config.accessToken) {
      errors.push({
        code: 'MISSING_ACCESS_TOKEN',
        message: 'Figma access token is required'
      });
    }

    if (this.config.outputFormat && this.config.outputFormat.length === 0) {
      errors.push({
        code: 'MISSING_OUTPUT_FORMAT',
        message: 'At least one output format must be specified'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Enhance design context with component metadata
   */
  private async enhanceWithComponentData(
    context: DesignContext, 
    components: any[]
  ): Promise<void> {
    try {
      for (const component of components) {
        const contextComponent = context.components.find(c => c.id === component.node_id);
        if (contextComponent) {
          contextComponent.description = component.description || contextComponent.description;
          
          // Fetch detailed component data
          try {
            const componentDetail = await this.client.getComponent(component.key);
            if (componentDetail.meta) {
              // Enhance with component metadata
              contextComponent.variants = this.extractVariantsFromMeta(componentDetail.meta);
            }
          } catch (error) {
            console.warn(`Failed to fetch component ${component.key}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Error enhancing with component data:', error);
    }
  }

  /**
   * Enhance design context with style metadata
   */
  private async enhanceWithStyleData(
    context: DesignContext, 
    styles: any[]
  ): Promise<void> {
    try {
      for (const style of styles) {
        try {
          const styleDetail = await this.client.getStyle(style.key);
          if (styleDetail.meta) {
            this.incorporateStyleIntoContext(context, styleDetail.meta);
          }
        } catch (error) {
          console.warn(`Failed to fetch style ${style.key}:`, error);
        }
      }
    } catch (error) {
      console.error('Error enhancing with style data:', error);
    }
  }

  /**
   * Process and download assets
   */
  private async processAssets(
    context: DesignContext, 
    fileId: string
  ): Promise<void> {
    try {
      // Find all image nodes
      const imageNodes = this.findImageNodes(context);
      
      if (imageNodes.length > 0) {
        console.log(`[Figma Import] Processing ${imageNodes.length} assets...`);
        
        // Get image URLs
        const imageUrls = await this.client.getFileImages(
          fileId, 
          imageNodes,
          { format: 'png', scale: 1 }
        );

        // Process each image
        for (const [nodeId, url] of Object.entries(imageUrls)) {
          if (url) {
            // In a real implementation, you'd download and store these assets
            console.log(`Asset available for node ${nodeId}: ${url}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing assets:', error);
    }
  }

  /**
   * Generate code outputs in specified formats
   */
  private async generateCodeOutputs(context: DesignContext): Promise<void> {
    for (const format of this.config.outputFormat) {
      try {
        switch (format) {
          case OutputFormat.CSS:
            await this.generateCSSOutput(context);
            break;
          case OutputFormat.SCSS:
            await this.generateSCSSOutput(context);
            break;
          case OutputFormat.TOKENS:
            await this.generateTokensOutput(context);
            break;
          case OutputFormat.REACT:
            await this.generateReactOutput(context);
            break;
          case OutputFormat.VUE:
            await this.generateVueOutput(context);
            break;
          case OutputFormat.ANGULAR:
            await this.generateAngularOutput(context);
            break;
          default:
            console.warn(`Unsupported output format: ${format}`);
        }
      } catch (error) {
        console.error(`Error generating ${format} output:`, error);
      }
    }
  }

  /**
   * Generate CSS output from design tokens
   */
  private async generateCSSOutput(context: DesignContext): Promise<string> {
    const css = [
      ':root {',
      '  /* Colors */',
      ...Object.entries(context.designTokens.colors).map(
        ([name, value]) => `  --color-${name}: ${value};`
      ),
      '',
      '  /* Spacing */',
      ...Object.entries(context.designTokens.spacing).map(
        ([name, value]) => `  --spacing-${name}: ${value}px;`
      ),
      '',
      '  /* Typography */',
      ...Object.entries(context.designTokens.typography).map(
        ([name, style]) => [
          `  --font-${name}-family: ${style.fontFamily};`,
          `  --font-${name}-size: ${style.fontSize}px;`,
          `  --font-${name}-weight: ${style.fontWeight};`,
          `  --font-${name}-line-height: ${style.lineHeight}px;`
        ].join('\n')
      ),
      '}'
    ].join('\n');

    console.log('[Code Generation] Generated CSS design tokens');
    return css;
  }

  /**
   * Generate SCSS output from design tokens
   */
  private async generateSCSSOutput(context: DesignContext): Promise<string> {
    const scss = [
      '// Colors',
      ...Object.entries(context.designTokens.colors).map(
        ([name, value]) => `$color-${name}: ${value};`
      ),
      '',
      '// Spacing',
      ...Object.entries(context.designTokens.spacing).map(
        ([name, value]) => `$spacing-${name}: ${value}px;`
      ),
      '',
      '// Typography',
      ...Object.entries(context.designTokens.typography).map(
        ([name, style]) => [
          `$font-${name}-family: ${style.fontFamily};`,
          `$font-${name}-size: ${style.fontSize}px;`,
          `$font-${name}-weight: ${style.fontWeight};`,
          `$font-${name}-line-height: ${style.lineHeight}px;`
        ].join('\n')
      )
    ].join('\n');

    console.log('[Code Generation] Generated SCSS design tokens');
    return scss;
  }

  /**
   * Generate design tokens JSON output
   */
  private async generateTokensOutput(context: DesignContext): Promise<string> {
    const tokens = {
      colors: context.designTokens.colors,
      spacing: context.designTokens.spacing,
      typography: context.designTokens.typography,
      shadows: context.designTokens.shadows,
      borders: context.designTokens.borders,
      radii: context.designTokens.radii,
      opacity: context.designTokens.opacity,
      zIndex: context.designTokens.zIndex
    };

    console.log('[Code Generation] Generated design tokens JSON');
    return JSON.stringify(tokens, null, 2);
  }

  /**
   * Generate React component outputs
   */
  private async generateReactOutput(context: DesignContext): Promise<void> {
    // Generate React components based on Figma components
    for (const component of context.components) {
      const reactComponent = this.generateReactComponent(component, context);
      console.log(`[Code Generation] Generated React component: ${component.name}`);
    }
  }

  /**
   * Generate Vue component outputs
   */
  private async generateVueOutput(context: DesignContext): Promise<void> {
    // Generate Vue components based on Figma components
    for (const component of context.components) {
      const vueComponent = this.generateVueComponent(component, context);
      console.log(`[Code Generation] Generated Vue component: ${component.name}`);
    }
  }

  /**
   * Generate Angular component outputs
   */
  private async generateAngularOutput(context: DesignContext): Promise<void> {
    // Generate Angular components based on Figma components
    for (const component of context.components) {
      const angularComponent = this.generateAngularComponent(component, context);
      console.log(`[Code Generation] Generated Angular component: ${component.name}`);
    }
  }

  /**
   * Calculate import statistics
   */
  private calculateStats(context: DesignContext, processingTime: number): ImportStats {
    return {
      totalNodes: this.countTotalNodes(context),
      processedNodes: this.countProcessedNodes(context),
      componentsFound: context.components.length,
      stylesExtracted: context.typography.textStyles.length,
      assetsDownloaded: 0, // Would be calculated during asset processing
      tokensGenerated: this.countTokens(context),
      processingTime
    };
  }

  /**
   * Create empty stats object for error cases
   */
  private createEmptyStats(startTime: number): ImportStats {
    return {
      totalNodes: 0,
      processedNodes: 0,
      componentsFound: 0,
      stylesExtracted: 0,
      assetsDownloaded: 0,
      tokensGenerated: 0,
      processingTime: Date.now() - startTime
    };
  }

  // Helper methods (placeholder implementations)
  private extractVariantsFromMeta(meta: any): any[] { return []; }
  private incorporateStyleIntoContext(context: DesignContext, meta: any): void {}
  private findImageNodes(context: DesignContext): string[] { return []; }
  private generateReactComponent(component: any, context: DesignContext): string { return ''; }
  private generateVueComponent(component: any, context: DesignContext): string { return ''; }
  private generateAngularComponent(component: any, context: DesignContext): string { return ''; }
  private countTotalNodes(context: DesignContext): number { return 0; }
  private countProcessedNodes(context: DesignContext): number { return 0; }
  private countTokens(context: DesignContext): number {
    return Object.keys(context.designTokens.colors).length +
           Object.keys(context.designTokens.spacing).length +
           Object.keys(context.designTokens.typography).length;
  }
}

/**
 * Import a Figma file with the specified configuration
 */
export async function importFigmaFile(config: FigmaImportConfig): Promise<FigmaImportResult> {
  const service = new FigmaImportService(config);
  return await service.importFile();
}

/**
 * Create a default import configuration
 */
export function createImportConfig(
  fileUrl: string, 
  accessToken: string,
  options: Partial<FigmaImportConfig> = {}
): FigmaImportConfig {
  return {
    fileUrl,
    accessToken,
    includeComponents: true,
    includeStyles: true,
    includeAssets: false,
    extractTokens: true,
    generateCode: false,
    outputFormat: [OutputFormat.JSON],
    plugins: [],
    ...options
  };
}

/**
 * Validate a Figma access token
 */
export async function validateFigmaToken(accessToken: string): Promise<boolean> {
  try {
    const client = new FigmaClient(accessToken);
    return await client.validateToken();
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
}