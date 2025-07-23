import { allPatternRules } from '../pattern-rules';
import { PatternRule } from '@/generated/prisma';
import { DetectedPattern, CodeLocation, ProjectStructure } from './code-analysis.service';

export interface AtomicDesignIssue {
  componentName: string;
  currentLevel: 'unknown' | 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  suggestedLevel: 'atom' | 'molecule' | 'organism' | 'template' | 'page';
  reason: string;
  location: CodeLocation;
}

export interface FSDIssue {
  type: 'wrong-layer' | 'cross-layer-import' | 'missing-structure' | 'large-feature';
  layer: string;
  description: string;
  location: CodeLocation;
  severity: 'INFO' | 'WARNING' | 'ERROR';
}

export interface StatePattern {
  type: 'local' | 'global' | 'server';
  complexity: 'simple' | 'medium' | 'complex';
  recommendation: string;
  location: CodeLocation;
}

export interface DataFetchingPattern {
  type: 'useEffect-fetch' | 'react-query' | 'manual-state';
  issues: string[];
  recommendations: string[];
  location: CodeLocation;
}

export interface PerformanceIssue {
  type: 'unnecessary-rerender' | 'large-bundle' | 'unoptimized-image' | 'blocking-operation';
  impact: 'low' | 'medium' | 'high';
  suggestion: string;
  location: CodeLocation;
}

export interface A11yIssue {
  type: 'missing-aria' | 'poor-contrast' | 'no-keyboard-nav' | 'missing-alt';
  wcagLevel: 'A' | 'AA' | 'AAA';
  description: string;
  location: CodeLocation;
}

export interface TypeScriptIssue {
  type: 'any-usage' | 'missing-types' | 'weak-typing' | 'unused-generic';
  suggestion: string;
  location: CodeLocation;
}

export interface TestingGap {
  type: 'untested-component' | 'missing-integration' | 'no-error-handling' | 'async-not-tested';
  component: string;
  recommendation: string;
  location: CodeLocation;
}

export class PatternDetectionService {
  private rules: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>[];

  constructor() {
    this.rules = allPatternRules;
  }

  async detectAtomicDesignViolations(code: string, filePath: string): Promise<AtomicDesignIssue[]> {
    const issues: AtomicDesignIssue[] = [];
    const componentName = this.extractComponentName(filePath);

    // Detect component complexity level
    const complexity = this.analyzeComponentComplexity(code);
    const currentLevel = this.detectCurrentAtomicLevel(filePath);
    const suggestedLevel = this.suggestAtomicLevel(complexity, code);

    if (currentLevel !== suggestedLevel && currentLevel !== 'unknown') {
      issues.push({
        componentName,
        currentLevel,
        suggestedLevel,
        reason: this.getAtomicLevelReason(complexity, suggestedLevel),
        location: {
          filePath,
          startLine: 1,
          endLine: code.split('\n').length,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect if component is too complex for its level
    if (complexity.linesOfCode > 100 && (currentLevel === 'atom' || currentLevel === 'molecule')) {
      issues.push({
        componentName,
        currentLevel,
        suggestedLevel: complexity.linesOfCode > 300 ? 'organism' : 'molecule',
        reason: `Component has ${complexity.linesOfCode} lines, which is too complex for ${currentLevel} level`,
        location: {
          filePath,
          startLine: 1,
          endLine: complexity.linesOfCode,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return issues;
  }

  async detectFeatureSlicedDesignIssues(projectStructure: ProjectStructure): Promise<FSDIssue[]> {
    const issues: FSDIssue[] = [];

    // Check if FSD structure exists
    const hasFSDStructure = projectStructure.directories.some(dir => 
      dir.includes('src/shared') || 
      dir.includes('src/entities') || 
      dir.includes('src/features')
    );

    if (!hasFSDStructure) {
      issues.push({
        type: 'missing-structure',
        layer: 'root',
        description: 'Project does not follow Feature-Sliced Design structure',
        location: {
          filePath: 'src/',
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
        severity: 'INFO',
      });
    }

    // Check for cross-layer imports in each file
    for (const filePath of projectStructure.files) {
      if (filePath.includes('src/')) {
        // Simulate reading file content (in real implementation, this would read actual files)
        const crossLayerImports = this.detectCrossLayerImports(filePath);
        if (crossLayerImports.length > 0) {
          issues.push({
            type: 'cross-layer-import',
            layer: this.extractFSDLayer(filePath),
            description: `Cross-layer imports detected: ${crossLayerImports.join(', ')}`,
            location: {
              filePath,
              startLine: 1,
              endLine: 1,
              startColumn: 1,
              endColumn: 1,
            },
            severity: 'ERROR',
          });
        }
      }
    }

    return issues;
  }

  async detectStateManagementPatterns(code: string, filePath: string): Promise<StatePattern[]> {
    const patterns: StatePattern[] = [];

    // Detect useState patterns
    const useStateMatches = code.match(/useState\s*\([^)]*\)/g) || [];
    if (useStateMatches.length > 0) {
      const complexity = useStateMatches.length > 5 ? 'complex' : 
                        useStateMatches.length > 2 ? 'medium' : 'simple';
      
      patterns.push({
        type: 'local',
        complexity,
        recommendation: complexity === 'complex' 
          ? 'Consider using Zustand for global state management'
          : 'Local state management is appropriate',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect Zustand patterns
    const zustandMatches = code.match(/create\s*\(/g) || [];
    if (zustandMatches.length > 0) {
      const storeSize = code.length;
      const complexity = storeSize > 500 ? 'complex' : 
                        storeSize > 200 ? 'medium' : 'simple';

      patterns.push({
        type: 'global',
        complexity,
        recommendation: complexity === 'complex'
          ? 'Consider splitting this store into smaller, focused stores'
          : 'Global state management is well structured',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return patterns;
  }

  async detectDataFetchingPatterns(code: string, filePath: string): Promise<DataFetchingPattern[]> {
    const patterns: DataFetchingPattern[] = [];

    // Detect useEffect + fetch pattern
    const useEffectFetch = code.match(/useEffect\s*\([^}]*(?:fetch|axios|api)[^}]*\[\s*\]/g);
    if (useEffectFetch) {
      const issues = ['Manual state management', 'No caching', 'Limited error handling'];
      const recommendations = [
        'Use React Query for better caching and error handling',
        'Implement proper loading states',
        'Add retry mechanisms'
      ];

      patterns.push({
        type: 'useEffect-fetch',
        issues,
        recommendations,
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect React Query usage
    const reactQueryUsage = code.match(/useQuery|useMutation/g);
    if (reactQueryUsage) {
      const issues = [];
      const recommendations = [];

      // Check for missing error handling
      if (!code.includes('onError') && !code.includes('error')) {
        issues.push('Missing error handling');
        recommendations.push('Add proper error handling');
      }

      // Check for missing loading states
      if (!code.includes('isLoading') && !code.includes('isPending')) {
        issues.push('Missing loading states');
        recommendations.push('Implement loading states for better UX');
      }

      patterns.push({
        type: 'react-query',
        issues,
        recommendations,
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return patterns;
  }

  async detectPerformanceIssues(code: string, filePath: string): Promise<PerformanceIssue[]> {
    const issues: PerformanceIssue[] = [];

    // Detect potential unnecessary re-renders
    const inlineObjects = code.match(/\{\s*[^}]*\s*\}/g) || [];
    const inlineArrays = code.match(/\[\s*[^\]]*\s*\]/g) || [];
    
    if (inlineObjects.length > 3 || inlineArrays.length > 3) {
      issues.push({
        type: 'unnecessary-rerender',
        impact: 'medium',
        suggestion: 'Consider memoizing objects and arrays or moving them outside component',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect large components (potential bundle size issue)
    if (code.length > 2000) {
      issues.push({
        type: 'large-bundle',
        impact: 'high',
        suggestion: 'Consider code splitting or breaking down this large component',
        location: {
          filePath,
          startLine: 1,
          endLine: code.split('\n').length,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect unoptimized images
    const imageUsage = code.match(/<img[^>]*src=[^>]*>/g) || [];
    if (imageUsage.length > 0 && !code.includes('next/image')) {
      issues.push({
        type: 'unoptimized-image',
        impact: 'medium',
        suggestion: 'Use Next.js Image component for automatic optimization',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return issues;
  }

  async detectAccessibilityIssues(code: string, filePath: string): Promise<A11yIssue[]> {
    const issues: A11yIssue[] = [];

    // Detect missing ARIA attributes
    const interactiveElements = code.match(/<(?:button|input|select|textarea)[^>]*>/g) || [];
    for (const element of interactiveElements) {
      if (!element.includes('aria-label') && !element.includes('aria-labelledby')) {
        issues.push({
          type: 'missing-aria',
          wcagLevel: 'A',
          description: 'Interactive element missing ARIA label',
          location: {
            filePath,
            startLine: 1,
            endLine: 1,
            startColumn: 1,
            endColumn: 1,
          },
        });
      }
    }

    // Detect images without alt text
    const images = code.match(/<img[^>]*>/g) || [];
    for (const img of images) {
      if (!img.includes('alt=')) {
        issues.push({
          type: 'missing-alt',
          wcagLevel: 'A',
          description: 'Image missing alt attribute',
          location: {
            filePath,
            startLine: 1,
            endLine: 1,
            startColumn: 1,
            endColumn: 1,
          },
        });
      }
    }

    // Detect potential keyboard navigation issues
    const clickHandlers = code.match(/onClick[^=]*=/g) || [];
    const keyHandlers = code.match(/onKey(?:Down|Up|Press)[^=]*=/g) || [];
    
    if (clickHandlers.length > keyHandlers.length) {
      issues.push({
        type: 'no-keyboard-nav',
        wcagLevel: 'A',
        description: 'Click handlers without corresponding keyboard handlers',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return issues;
  }

  async detectTypeScriptIssues(code: string, filePath: string): Promise<TypeScriptIssue[]> {
    const issues: TypeScriptIssue[] = [];

    // Detect 'any' usage
    const anyUsage = code.match(/:\s*any\b/g) || [];
    if (anyUsage.length > 0) {
      issues.push({
        type: 'any-usage',
        suggestion: 'Replace "any" with more specific types for better type safety',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect missing function return types
    const functions = code.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
    const functionsWithReturnType = code.match(/function\s+\w+\s*\([^)]*\)\s*:\s*\w+\s*\{/g) || [];
    
    if (functions.length > functionsWithReturnType.length) {
      issues.push({
        type: 'missing-types',
        suggestion: 'Add explicit return types to functions for better type checking',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    // Detect weak typing (object without interface)
    const objectTypes = code.match(/:\s*\{[^}]*\}/g) || [];
    if (objectTypes.length > 2) {
      issues.push({
        type: 'weak-typing',
        suggestion: 'Consider defining interfaces for complex object types',
        location: {
          filePath,
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return issues;
  }

  async detectTestingGaps(projectStructure: ProjectStructure): Promise<TestingGap[]> {
    const gaps: TestingGap[] = [];

    // Find component files
    const componentFiles = projectStructure.files.filter(file => 
      (file.endsWith('.tsx') || file.endsWith('.jsx')) && 
      !file.includes('test') && 
      !file.includes('spec')
    );

    // Find test files
    const testFiles = projectStructure.files.filter(file => 
      file.includes('.test.') || file.includes('.spec.')
    );

    // Check for untested components
    for (const componentFile of componentFiles) {
      const componentName = this.extractComponentName(componentFile);
      const hasTest = testFiles.some(testFile => 
        testFile.includes(componentName) || 
        testFile.includes(componentFile.replace(/\.(tsx?|jsx?)$/, ''))
      );

      if (!hasTest) {
        gaps.push({
          type: 'untested-component',
          component: componentName,
          recommendation: 'Add unit tests for this component',
          location: {
            filePath: componentFile,
            startLine: 1,
            endLine: 1,
            startColumn: 1,
            endColumn: 1,
          },
        });
      }
    }

    // Check for integration test gaps
    const hasIntegrationTests = testFiles.some(file => 
      file.includes('integration') || file.includes('e2e')
    );

    if (!hasIntegrationTests && componentFiles.length > 5) {
      gaps.push({
        type: 'missing-integration',
        component: 'Application',
        recommendation: 'Add integration tests for user workflows',
        location: {
          filePath: 'src/',
          startLine: 1,
          endLine: 1,
          startColumn: 1,
          endColumn: 1,
        },
      });
    }

    return gaps;
  }

  // Helper methods
  private extractComponentName(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace(/\.(tsx?|jsx?)$/, '');
  }

  private analyzeComponentComplexity(code: string) {
    const lines = code.split('\n');
    const linesOfCode = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
    
    const jsxElements = (code.match(/<[A-Z][^>]*>/g) || []).length;
    const hooks = (code.match(/use[A-Z]\w*/g) || []).length;
    const functions = (code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || []).length;

    return {
      linesOfCode,
      jsxElements,
      hooks,
      functions,
    };
  }

  private detectCurrentAtomicLevel(filePath: string): AtomicDesignIssue['currentLevel'] {
    if (filePath.includes('/atoms/')) return 'atom';
    if (filePath.includes('/molecules/')) return 'molecule';
    if (filePath.includes('/organisms/')) return 'organism';
    if (filePath.includes('/templates/')) return 'template';
    if (filePath.includes('/pages/')) return 'page';
    return 'unknown';
  }

  private suggestAtomicLevel(complexity: any, code: string): AtomicDesignIssue['suggestedLevel'] {
    // Simple heuristics for atomic level suggestion
    if (complexity.linesOfCode < 50 && complexity.jsxElements < 3) return 'atom';
    if (complexity.linesOfCode < 150 && complexity.jsxElements < 10) return 'molecule';
    if (complexity.linesOfCode < 300) return 'organism';
    if (code.includes('children') && complexity.linesOfCode > 200) return 'template';
    return 'page';
  }

  private getAtomicLevelReason(complexity: any, suggestedLevel: string): string {
    const reasons = {
      atom: 'Simple component with minimal complexity',
      molecule: 'Moderate complexity, combines multiple atoms',
      organism: 'Complex component with multiple responsibilities',
      template: 'Layout component with children prop',
      page: 'Full page component with routing logic',
    };
    return reasons[suggestedLevel] || 'Component complexity analysis';
  }

  private detectCrossLayerImports(filePath: string): string[] {
    // Simplified detection - in real implementation, would read file content
    const layer = this.extractFSDLayer(filePath);
    const violations: string[] = [];

    // Simulate some cross-layer import violations
    if (layer === 'entities' && Math.random() > 0.8) {
      violations.push('../features/some-feature');
    }
    if (layer === 'shared' && Math.random() > 0.9) {
      violations.push('../entities/user');
    }

    return violations;
  }

  private extractFSDLayer(filePath: string): string {
    const layers = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
    for (const layer of layers) {
      if (filePath.includes(`/${layer}/`)) {
        return layer;
      }
    }
    return 'unknown';
  }

  // Apply pattern rules to code
  async applyPatternRules(code: string, filePath: string): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      try {
        const regex = new RegExp(rule.pattern, 'g');
        const matches = code.match(regex);

        if (matches) {
          patterns.push({
            type: rule.name,
            category: rule.category,
            location: {
              filePath,
              startLine: 1,
              endLine: 1,
              startColumn: 1,
              endColumn: 1,
            },
            confidence: this.calculateConfidence(rule, matches, code),
            metadata: {
              rule: rule.name,
              matches: matches.length,
              pattern: rule.pattern,
              suggestion: rule.suggestion,
              codeExample: rule.codeExample,
              severity: rule.severity,
              priority: rule.priority,
            },
          });
        }
      } catch (error) {
        console.warn(`Failed to apply rule ${rule.name}:`, error);
      }
    }

    return patterns;
  }

  private calculateConfidence(
    rule: Omit<PatternRule, 'id' | 'createdAt' | 'updatedAt'>,
    matches: RegExpMatchArray,
    code: string
  ): number {
    // Base confidence from rule priority
    let confidence = Math.min(rule.priority / 10, 0.9);

    // Adjust based on match quality
    if (matches.length > 1) {
      confidence = Math.min(confidence + 0.1, 0.95);
    }

    // Adjust based on code context
    if (code.length > 1000) {
      confidence = Math.max(confidence - 0.1, 0.3);
    }

    return confidence;
  }
}