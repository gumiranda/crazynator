import { CodeInterpreter } from '@e2b/code-interpreter';

export interface CodeMetrics {
  linesOfCode: number;
  complexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage?: number;
}

export interface CodeLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

export interface CodeIssue {
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  location: CodeLocation;
  fixable: boolean;
}

export interface DetectedPattern {
  type: string;
  category: string;
  location: CodeLocation;
  confidence: number;
  metadata: Record<string, any>;
}

export interface FileAnalysis {
  filePath: string;
  language: string;
  metrics: FileMetrics;
  patterns: DetectedPattern[];
  issues: CodeIssue[];
}

export interface FileMetrics {
  linesOfCode: number;
  complexity: number;
  functions: number;
  classes: number;
  imports: number;
  exports: number;
}

export interface AnalysisResult {
  projectId: string;
  files: FileAnalysis[];
  overallMetrics: CodeMetrics;
  detectedPatterns: DetectedPattern[];
  suggestions: GeneratedSuggestion[];
}

export interface GeneratedSuggestion {
  title: string;
  description: string;
  category: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR';
  filePath?: string;
  lineNumber?: number;
  codeExample?: string;
  metadata?: Record<string, any>;
}

export interface ProjectStructure {
  directories: string[];
  files: string[];
  packageJson?: any;
  tsConfig?: any;
}

export class CodeAnalysisService {
  private sandbox: CodeInterpreter | null = null;

  async initializeSandbox(): Promise<void> {
    if (!this.sandbox) {
      this.sandbox = await CodeInterpreter.create();
    }
  }

  async analyzeProject(projectId: string): Promise<AnalysisResult> {
    await this.initializeSandbox();
    
    try {
      // Get project structure
      const projectStructure = await this.getProjectStructure();
      
      // Analyze all relevant files
      const fileAnalyses: FileAnalysis[] = [];
      const allPatterns: DetectedPattern[] = [];
      
      for (const filePath of projectStructure.files) {
        if (this.isAnalyzableFile(filePath)) {
          const content = await this.readFile(filePath);
          const analysis = await this.analyzeFile(projectId, filePath, content);
          fileAnalyses.push(analysis);
          allPatterns.push(...analysis.patterns);
        }
      }
      
      // Calculate overall metrics
      const overallMetrics = this.calculateOverallMetrics(fileAnalyses);
      
      // Generate suggestions based on patterns
      const suggestions = await this.generateSuggestions(allPatterns, fileAnalyses);
      
      return {
        projectId,
        files: fileAnalyses,
        overallMetrics,
        detectedPatterns: allPatterns,
        suggestions,
      };
    } catch (error) {
      console.error('Project analysis failed:', error);
      throw new Error(`Failed to analyze project: ${error.message}`);
    }
  }

  async analyzeFile(projectId: string, filePath: string, content: string): Promise<FileAnalysis> {
    const language = this.detectLanguage(filePath);
    const metrics = await this.calculateFileMetrics(content, language);
    const patterns = await this.detectPatterns(content, language, filePath);
    const issues = await this.detectIssues(content, language, filePath);

    return {
      filePath,
      language,
      metrics,
      patterns,
      issues,
    };
  }

  async detectPatterns(code: string, language: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    if (language === 'typescript' || language === 'javascript') {
      // Detect React component patterns
      patterns.push(...await this.detectReactPatterns(code, filePath));
      
      // Detect architectural patterns
      patterns.push(...await this.detectArchitecturalPatterns(code, filePath));
      
      // Detect state management patterns
      patterns.push(...await this.detectStatePatterns(code, filePath));
      
      // Detect data fetching patterns
      patterns.push(...await this.detectDataFetchingPatterns(code, filePath));
    }
    
    return patterns;
  }

  async getCodeMetrics(projectId: string): Promise<CodeMetrics> {
    const analysis = await this.analyzeProject(projectId);
    return analysis.overallMetrics;
  }

  private async getProjectStructure(): Promise<ProjectStructure> {
    if (!this.sandbox) throw new Error('Sandbox not initialized');

    try {
      // Get directory structure
      const result = await this.sandbox.process.start({
        cmd: 'find . -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | head -100',
      });
      
      const files = result.stdout.split('\n').filter(f => f.trim());
      
      // Get directories
      const dirResult = await this.sandbox.process.start({
        cmd: 'find . -type d | head -50',
      });
      
      const directories = dirResult.stdout.split('\n').filter(d => d.trim());
      
      // Try to read package.json
      let packageJson;
      try {
        const pkgResult = await this.sandbox.process.start({
          cmd: 'cat package.json',
        });
        packageJson = JSON.parse(pkgResult.stdout);
      } catch {
        // package.json might not exist
      }
      
      return {
        directories,
        files,
        packageJson,
      };
    } catch (error) {
      console.error('Failed to get project structure:', error);
      return { directories: [], files: [] };
    }
  }

  private async readFile(filePath: string): Promise<string> {
    if (!this.sandbox) throw new Error('Sandbox not initialized');
    
    try {
      const result = await this.sandbox.process.start({
        cmd: `cat "${filePath}"`,
      });
      return result.stdout;
    } catch (error) {
      console.error(`Failed to read file ${filePath}:`, error);
      return '';
    }
  }

  private isAnalyzableFile(filePath: string): boolean {
    const analyzableExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    const excludedPaths = ['node_modules', '.git', 'dist', 'build', '.next'];
    
    return (
      analyzableExtensions.some(ext => filePath.endsWith(ext)) &&
      !excludedPaths.some(path => filePath.includes(path))
    );
  }

  private detectLanguage(filePath: string): string {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      return 'typescript';
    }
    if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      return 'javascript';
    }
    return 'unknown';
  }

  private async calculateFileMetrics(content: string, language: string): Promise<FileMetrics> {
    const lines = content.split('\n');
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
    
    // Simple pattern-based metrics
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
    const classMatches = content.match(/class\s+\w+/g) || [];
    const importMatches = content.match(/import\s+.*from/g) || [];
    const exportMatches = content.match(/export\s+/g) || [];
    
    // Calculate cyclomatic complexity (simplified)
    const complexityKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?'];
    let complexity = 1; // Base complexity
    complexityKeywords.forEach(keyword => {
      const matches = content.match(new RegExp(`\\b${keyword}\\b`, 'g')) || [];
      complexity += matches.length;
    });

    return {
      linesOfCode,
      complexity,
      functions: functionMatches.length,
      classes: classMatches.length,
      imports: importMatches.length,
      exports: exportMatches.length,
    };
  }

  private async detectReactPatterns(code: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Detect large components
    if (code.length > 500) {
      const lines = code.split('\n');
      patterns.push({
        type: 'component-too-complex',
        category: 'ATOMIC_DESIGN',
        location: {
          filePath,
          startLine: 1,
          endLine: lines.length,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.8,
        metadata: { lines: lines.length, size: code.length },
      });
    }
    
    // Detect deeply nested JSX
    const nestingMatches = code.match(/<\w+[^>]*>\s*<\w+[^>]*>\s*<\w+[^>]*>\s*<\w+[^>]*>\s*<\w+[^>]*>/g);
    if (nestingMatches) {
      patterns.push({
        type: 'deeply-nested-components',
        category: 'ATOMIC_DESIGN',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.7,
        metadata: { nestingLevel: 5 },
      });
    }
    
    return patterns;
  }

  private async detectArchitecturalPatterns(code: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Detect Feature-Sliced Design violations
    if (filePath.includes('src/') && !filePath.match(/src\/(shared|entities|features|widgets|pages|app)/)) {
      patterns.push({
        type: 'missing-fsd-structure',
        category: 'FEATURE_SLICED_DESIGN',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.6,
        metadata: { currentPath: filePath },
      });
    }
    
    // Detect cross-layer imports
    const crossLayerImports = code.match(/import.*from.*['"]\.\.\/(features|widgets|pages)/g);
    if (crossLayerImports) {
      patterns.push({
        type: 'cross-layer-import',
        category: 'FEATURE_SLICED_DESIGN',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.9,
        metadata: { imports: crossLayerImports },
      });
    }
    
    return patterns;
  }

  private async detectStatePatterns(code: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Detect useState that might be better as global state
    const useStateMatches = code.match(/useState\s*\([^)]*\)/g);
    if (useStateMatches && useStateMatches.length > 3) {
      patterns.push({
        type: 'local-state-should-be-global',
        category: 'ZUSTAND',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.5,
        metadata: { stateCount: useStateMatches.length },
      });
    }
    
    // Detect large Zustand stores
    const zustandStoreMatch = code.match(/create\s*\(\s*\([^)]*\)\s*=>\s*\([^)]*\)\s*=>\s*\{[\s\S]*\}/);
    if (zustandStoreMatch && zustandStoreMatch[0].length > 400) {
      patterns.push({
        type: 'zustand-store-too-large',
        category: 'ZUSTAND',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.8,
        metadata: { storeSize: zustandStoreMatch[0].length },
      });
    }
    
    return patterns;
  }

  private async detectDataFetchingPatterns(code: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Detect useEffect with fetch calls
    const fetchInUseEffect = code.match(/useEffect\s*\([^}]*(?:fetch|axios|api)[^}]*\[\s*\]\s*\)/);
    if (fetchInUseEffect) {
      patterns.push({
        type: 'use-react-query-for-api-calls',
        category: 'REACT_QUERY',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        confidence: 0.8,
        metadata: { pattern: fetchInUseEffect[0] },
      });
    }
    
    return patterns;
  }

  private async detectIssues(code: string, language: string, filePath: string): Promise<CodeIssue[]> {
    const issues: CodeIssue[] = [];
    
    // Detect potential issues
    if (code.includes('any')) {
      issues.push({
        type: 'typescript-any-usage',
        severity: 'WARNING',
        message: 'Usage of "any" type detected. Consider using more specific types.',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        fixable: false,
      });
    }
    
    return issues;
  }

  private calculateOverallMetrics(fileAnalyses: FileAnalysis[]): CodeMetrics {
    const totalLoc = fileAnalyses.reduce((sum, file) => sum + file.metrics.linesOfCode, 0);
    const avgComplexity = fileAnalyses.reduce((sum, file) => sum + file.metrics.complexity, 0) / fileAnalyses.length;
    
    // Simple maintainability index calculation
    const maintainabilityIndex = Math.max(0, 100 - avgComplexity - (totalLoc / 1000));
    
    // Technical debt estimation (simplified)
    const technicalDebt = fileAnalyses.reduce((sum, file) => sum + file.issues.length, 0);
    
    return {
      linesOfCode: totalLoc,
      complexity: avgComplexity,
      maintainabilityIndex,
      technicalDebt,
    };
  }

  private async generateSuggestions(
    patterns: DetectedPattern[],
    fileAnalyses: FileAnalysis[]
  ): Promise<GeneratedSuggestion[]> {
    const suggestions: GeneratedSuggestion[] = [];
    
    for (const pattern of patterns) {
      suggestions.push({
        title: this.getPatternTitle(pattern.type),
        description: this.getPatternDescription(pattern.type),
        category: pattern.category,
        type: pattern.type,
        severity: this.getPatternSeverity(pattern.type),
        filePath: pattern.location.filePath,
        lineNumber: pattern.location.startLine,
        metadata: pattern.metadata,
      });
    }
    
    return suggestions;
  }

  private getPatternTitle(patternType: string): string {
    const titles: Record<string, string> = {
      'component-too-complex': 'Component Too Complex',
      'missing-fsd-structure': 'Missing Feature-Sliced Design Structure',
      'cross-layer-import': 'Cross-Layer Import Violation',
      'local-state-should-be-global': 'Consider Global State Management',
      'use-react-query-for-api-calls': 'Use React Query for API Calls',
    };
    return titles[patternType] || 'Code Pattern Suggestion';
  }

  private getPatternDescription(patternType: string): string {
    const descriptions: Record<string, string> = {
      'component-too-complex': 'This component is quite large and complex. Consider breaking it down into smaller components.',
      'missing-fsd-structure': 'Consider organizing your code using Feature-Sliced Design architecture.',
      'cross-layer-import': 'This import violates Feature-Sliced Design layer rules.',
      'local-state-should-be-global': 'This state might be better managed globally with Zustand.',
      'use-react-query-for-api-calls': 'Consider using React Query for better API call management.',
    };
    return descriptions[patternType] || 'Consider improving this code pattern.';
  }

  private getPatternSeverity(patternType: string): 'INFO' | 'WARNING' | 'ERROR' {
    const severities: Record<string, 'INFO' | 'WARNING' | 'ERROR'> = {
      'component-too-complex': 'WARNING',
      'missing-fsd-structure': 'INFO',
      'cross-layer-import': 'ERROR',
      'local-state-should-be-global': 'INFO',
      'use-react-query-for-api-calls': 'INFO',
    };
    return severities[patternType] || 'INFO';
  }

  async cleanup(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.close();
      this.sandbox = null;
    }
  }
}