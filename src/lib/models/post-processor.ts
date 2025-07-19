import { PostProcessingOptions, PostProcessingFilter } from './types';

export class PostProcessor {
  private static instance: PostProcessor;
  private filters: PostProcessingFilter[] = [];

  private constructor() {
    this.initializeDefaultFilters();
  }

  public static getInstance(): PostProcessor {
    if (!PostProcessor.instance) {
      PostProcessor.instance = new PostProcessor();
    }
    return PostProcessor.instance;
  }

  /**
   * Process content with specified options
   */
  public async process(
    content: string,
    options: PostProcessingOptions,
    context?: any
  ): Promise<string> {
    let processedContent = content;

    // Get applicable filters based on options
    const applicableFilters = this.getApplicableFilters(options);

    // Sort filters by priority
    applicableFilters.sort((a, b) => a.priority - b.priority);

    // Apply each filter sequentially
    for (const filter of applicableFilters) {
      try {
        processedContent = await filter.apply(processedContent, context);
      } catch (error) {
        console.error(`Error applying filter ${filter.name}:`, error);
        // Continue with other filters even if one fails
      }
    }

    return processedContent;
  }

  /**
   * Initialize default post-processing filters
   */
  private initializeDefaultFilters(): void {
    // Code optimization filter
    this.filters.push({
      name: 'codeOptimization',
      priority: 1,
      apply: async (content: string) => {
        // Remove redundant imports
        content = this.removeRedundantImports(content);
        
        // Optimize React components
        content = this.optimizeReactComponents(content);
        
        // Clean up unnecessary comments
        content = this.cleanupComments(content);
        
        return content;
      },
    });

    // Error correction filter
    this.filters.push({
      name: 'errorCorrection',
      priority: 2,
      apply: async (content: string) => {
        // Fix common TypeScript errors
        content = this.fixTypeScriptErrors(content);
        
        // Fix import/export issues
        content = this.fixImportExportIssues(content);
        
        // Fix React hooks issues
        content = this.fixReactHooksIssues(content);
        
        return content;
      },
    });

    // Formatting filter
    this.filters.push({
      name: 'formatting',
      priority: 3,
      apply: async (content: string) => {
        // Standardize indentation
        content = this.standardizeIndentation(content);
        
        // Fix line endings
        content = this.fixLineEndings(content);
        
        // Organize imports
        content = this.organizeImports(content);
        
        return content;
      },
    });

    // Validation filter
    this.filters.push({
      name: 'validation',
      priority: 4,
      apply: async (content: string, context?: any) => {
        // Validate syntax
        const validationErrors = this.validateSyntax(content);
        
        if (validationErrors.length > 0) {
          console.warn('Validation errors found:', validationErrors);
          // Attempt to fix basic validation errors
          content = this.fixBasicValidationErrors(content, validationErrors);
        }
        
        return content;
      },
    });
  }

  /**
   * Get filters that should be applied based on options
   */
  private getApplicableFilters(options: PostProcessingOptions): PostProcessingFilter[] {
    const applicableFilters: PostProcessingFilter[] = [];

    // Add built-in filters based on options
    if (options.enableCodeOptimization) {
      const filter = this.filters.find((f) => f.name === 'codeOptimization');
      if (filter) applicableFilters.push(filter);
    }

    if (options.enableErrorCorrection) {
      const filter = this.filters.find((f) => f.name === 'errorCorrection');
      if (filter) applicableFilters.push(filter);
    }

    if (options.enableFormatting) {
      const filter = this.filters.find((f) => f.name === 'formatting');
      if (filter) applicableFilters.push(filter);
    }

    if (options.enableValidation) {
      const filter = this.filters.find((f) => f.name === 'validation');
      if (filter) applicableFilters.push(filter);
    }

    // Add custom filters
    if (options.customFilters) {
      applicableFilters.push(...options.customFilters);
    }

    return applicableFilters;
  }

  /**
   * Remove redundant imports
   */
  private removeRedundantImports(content: string): string {
    const lines = content.split('\n');
    const imports = new Set<string>();
    const nonImportLines: string[] = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        if (!imports.has(line.trim())) {
          imports.add(line.trim());
        }
      } else {
        nonImportLines.push(line);
      }
    }
    
    return [...Array.from(imports), ...nonImportLines].join('\n');
  }

  /**
   * Optimize React components
   */
  private optimizeReactComponents(content: string): string {
    // Remove unnecessary React.Fragment wrappers
    content = content.replace(/<React\.Fragment>/g, '<>');
    content = content.replace(/<\/React\.Fragment>/g, '</>');
    
    // Optimize useState hooks
    content = content.replace(
      /const \[(\w+), set(\w+)\] = useState\((.*?)\);/g,
      (match, stateName, setterName, initialValue) => {
        const expectedSetterName = `set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}`;
        if (setterName === expectedSetterName) {
          return match;
        }
        return `const [${stateName}, ${expectedSetterName}] = useState(${initialValue});`;
      }
    );
    
    return content;
  }

  /**
   * Clean up unnecessary comments
   */
  private cleanupComments(content: string): string {
    // Remove empty comment lines
    content = content.replace(/^\s*\/\/\s*$/gm, '');
    
    // Remove TODO comments that don't add value
    content = content.replace(/^\s*\/\/\s*TODO:\s*$/gm, '');
    
    return content;
  }

  /**
   * Fix common TypeScript errors
   */
  private fixTypeScriptErrors(content: string): string {
    // Add missing semicolons
    content = content.replace(/^(\s*(?:const|let|var|function|class|interface|type)\s+[^;{]+)$/gm, '$1;');
    
    // Fix missing return types for functions
    content = content.replace(
      /function\s+(\w+)\s*\([^)]*\)\s*{/g,
      (match, functionName) => {
        if (!match.includes(': ')) {
          return match.replace('{', ': void {');
        }
        return match;
      }
    );
    
    return content;
  }

  /**
   * Fix import/export issues
   */
  private fixImportExportIssues(content: string): string {
    // Fix default imports that should be named imports
    content = content.replace(
      /import\s+(\w+)\s+from\s+['"]@\/components\/ui\/(\w+)['"];?/g,
      'import { $1 } from "@/components/ui/$2";'
    );
    
    // Ensure proper export statements
    content = content.replace(/^export\s+default\s+function\s+(\w+)/gm, 'export default function $1');
    
    return content;
  }

  /**
   * Fix React hooks issues
   */
  private fixReactHooksIssues(content: string): string {
    // Ensure useEffect has dependency array
    content = content.replace(
      /useEffect\(\s*\(\s*\)\s*=>\s*{[^}]*}\s*\);/g,
      (match) => {
        if (!match.includes(', []')) {
          return match.replace(');', ', []);');
        }
        return match;
      }
    );
    
    // Fix useCallback and useMemo without dependencies
    content = content.replace(
      /(useCallback|useMemo)\(\s*[^,]+\s*\);/g,
      (match, hookName) => {
        return match.replace(');', ', []);');
      }
    );
    
    return content;
  }

  /**
   * Standardize indentation
   */
  private standardizeIndentation(content: string): string {
    const lines = content.split('\n');
    const indentSize = 2; // Use 2 spaces for indentation
    
    return lines
      .map((line) => {
        // Convert tabs to spaces
        line = line.replace(/\t/g, ' '.repeat(indentSize));
        
        // Standardize multiple spaces to consistent indentation
        const leadingSpaces = line.match(/^ */)?.[0].length || 0;
        const normalizedIndent = Math.floor(leadingSpaces / indentSize) * indentSize;
        
        return ' '.repeat(normalizedIndent) + line.trimStart();
      })
      .join('\n');
  }

  /**
   * Fix line endings
   */
  private fixLineEndings(content: string): string {
    // Normalize to LF line endings
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  /**
   * Organize imports
   */
  private organizeImports(content: string): string {
    const lines = content.split('\n');
    const imports: string[] = [];
    const nonImports: string[] = [];
    
    let inImportSection = true;
    
    for (const line of lines) {
      if (line.trim().startsWith('import ')) {
        imports.push(line);
      } else if (line.trim() === '' && inImportSection) {
        // Skip empty lines in import section
        continue;
      } else {
        inImportSection = false;
        nonImports.push(line);
      }
    }
    
    // Sort imports: external packages first, then internal
    const externalImports = imports.filter((imp) => !imp.includes('@/'));
    const internalImports = imports.filter((imp) => imp.includes('@/'));
    
    externalImports.sort();
    internalImports.sort();
    
    const organizedContent = [
      ...externalImports,
      externalImports.length > 0 && internalImports.length > 0 ? '' : null,
      ...internalImports,
      imports.length > 0 ? '' : null,
      ...nonImports,
    ].filter((line) => line !== null).join('\n');
    
    return organizedContent;
  }

  /**
   * Validate syntax (basic validation)
   */
  private validateSyntax(content: string): string[] {
    const errors: string[] = [];
    
    // Check for unmatched brackets
    const brackets = { '(': 0, '[': 0, '{': 0 };
    const closingBrackets: Record<string, string> = { ')': '(', ']': '[', '}': '{' };
    
    for (const char of content) {
      if (char in brackets) {
        brackets[char as keyof typeof brackets]++;
      } else if (char in closingBrackets) {
        const opening = closingBrackets[char];
        if (brackets[opening as keyof typeof brackets] > 0) {
          brackets[opening as keyof typeof brackets]--;
        } else {
          errors.push(`Unmatched closing bracket: ${char}`);
        }
      }
    }
    
    // Check for remaining unmatched opening brackets
    for (const [bracket, count] of Object.entries(brackets)) {
      if (count > 0) {
        errors.push(`Unmatched opening bracket: ${bracket} (${count} times)`);
      }
    }
    
    return errors;
  }

  /**
   * Fix basic validation errors
   */
  private fixBasicValidationErrors(content: string, errors: string[]): string {
    // This is a simplified version - in production, you'd want more sophisticated error fixing
    let fixedContent = content;
    
    for (const error of errors) {
      if (error.includes('Unmatched opening bracket: {')) {
        // Try to add missing closing brackets
        const openCount = (content.match(/\{/g) || []).length;
        const closeCount = (content.match(/\}/g) || []).length;
        if (openCount > closeCount) {
          fixedContent += '\n' + '}'.repeat(openCount - closeCount);
        }
      }
    }
    
    return fixedContent;
  }

  /**
   * Add a custom filter
   */
  public addFilter(filter: PostProcessingFilter): void {
    this.filters.push(filter);
  }

  /**
   * Remove a filter by name
   */
  public removeFilter(name: string): void {
    this.filters = this.filters.filter((f) => f.name !== name);
  }
}