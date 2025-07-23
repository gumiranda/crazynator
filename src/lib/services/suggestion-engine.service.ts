import { PrismaClient, CodeSuggestion, SuggestionStatus, UserPreference } from '@/generated/prisma';
import { AnalysisResult, GeneratedSuggestion } from './code-analysis.service';
import { allPatternRules } from '../pattern-rules';
import { CodeInterpreter } from '@e2b/code-interpreter';

export interface ApplyResult {
  success: boolean;
  changes: FileChange[];
  errors?: string[];
}

export interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  changeType: 'CREATE' | 'UPDATE' | 'DELETE';
}

export interface SuggestionFilters {
  category?: string;
  type?: string;
  severity?: string;
  status?: SuggestionStatus;
}

export class SuggestionEngineService {
  private prisma: PrismaClient;
  private sandbox: CodeInterpreter | null = null;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async generateSuggestions(
    analysis: AnalysisResult,
    userPreferences: UserPreference[],
  ): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];

    // Filter suggestions based on user preferences
    const enabledCategories = new Set(
      userPreferences.filter(p => p.enabled).map(p => p.category)
    );

    // Generate suggestions from detected patterns
    for (const generatedSuggestion of analysis.suggestions) {
      // Skip if category is disabled by user
      if (enabledCategories.size > 0 && !enabledCategories.has(generatedSuggestion.category as any)) {
        continue;
      }

      // Apply frequency filtering
      const preference = userPreferences.find(p => p.category === generatedSuggestion.category);
      if (preference && this.shouldSkipByFrequency(preference.frequency, generatedSuggestion)) {
        continue;
      }

      // Enhance suggestion with AI-generated content
      const enhancedSuggestion = await this.enhanceSuggestionWithAI(generatedSuggestion, analysis);

      // Create database record
      const suggestion = await this.prisma.codeSuggestion.create({
        data: {
          projectId: analysis.projectId,
          type: enhancedSuggestion.type as any,
          category: enhancedSuggestion.category as any,
          title: enhancedSuggestion.title,
          description: enhancedSuggestion.description,
          codeExample: enhancedSuggestion.codeExample,
          filePath: enhancedSuggestion.filePath,
          lineNumber: enhancedSuggestion.lineNumber,
          severity: enhancedSuggestion.severity as any,
          status: 'PENDING',
          metadata: enhancedSuggestion.metadata || {},
        },
      });

      suggestions.push(suggestion);
    }

    return suggestions;
  }

  async applySuggestion(suggestionId: string, projectId: string): Promise<ApplyResult> {
    try {
      const suggestion = await this.prisma.codeSuggestion.findUnique({
        where: { id: suggestionId },
      });

      if (!suggestion || suggestion.projectId !== projectId) {
        return {
          success: false,
          changes: [],
          errors: ['Suggestion not found or access denied'],
        };
      }

      // Initialize sandbox for file operations
      await this.initializeSandbox();

      const changes: FileChange[] = [];
      const errors: string[] = [];

      // Apply suggestion based on type
      switch (suggestion.type) {
        case 'COMPONENT_STRUCTURE':
          const componentChanges = await this.applyComponentStructureChanges(suggestion);
          changes.push(...componentChanges);
          break;

        case 'ARCHITECTURE':
          const architectureChanges = await this.applyArchitectureChanges(suggestion);
          changes.push(...architectureChanges);
          break;

        case 'STATE_MANAGEMENT':
          const stateChanges = await this.applyStateManagementChanges(suggestion);
          changes.push(...stateChanges);
          break;

        case 'DATA_FETCHING':
          const dataFetchingChanges = await this.applyDataFetchingChanges(suggestion);
          changes.push(...dataFetchingChanges);
          break;

        default:
          errors.push(`Unsupported suggestion type: ${suggestion.type}`);
      }

      if (changes.length > 0 && errors.length === 0) {
        // Mark suggestion as applied
        await this.updateSuggestionStatus(suggestionId, 'APPLIED');
        
        return {
          success: true,
          changes,
        };
      } else {
        return {
          success: false,
          changes: [],
          errors: errors.length > 0 ? errors : ['No changes could be applied'],
        };
      }
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
      return {
        success: false,
        changes: [],
        errors: [`Failed to apply suggestion: ${error.message}`],
      };
    }
  }

  async dismissSuggestion(suggestionId: string): Promise<void> {
    await this.prisma.codeSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
      },
    });
  }

  async getSuggestions(projectId: string, filters?: SuggestionFilters): Promise<CodeSuggestion[]> {
    const where: any = { projectId };

    if (filters?.category) {
      where.category = filters.category;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.codeSuggestion.findMany({
      where,
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async updateSuggestionStatus(suggestionId: string, status: SuggestionStatus): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'APPLIED') {
      updateData.appliedAt = new Date();
    } else if (status === 'DISMISSED') {
      updateData.dismissedAt = new Date();
    }

    await this.prisma.codeSuggestion.update({
      where: { id: suggestionId },
      data: updateData,
    });
  }

  // Private helper methods

  private async initializeSandbox(): Promise<void> {
    if (!this.sandbox) {
      this.sandbox = await CodeInterpreter.create();
    }
  }

  private shouldSkipByFrequency(frequency: string, suggestion: GeneratedSuggestion): boolean {
    // Simple frequency-based filtering logic
    const random = Math.random();
    
    switch (frequency) {
      case 'MINIMAL':
        return random < 0.7; // Skip 70% of suggestions
      case 'NORMAL':
        return random < 0.3; // Skip 30% of suggestions
      case 'AGGRESSIVE':
        return false; // Show all suggestions
      default:
        return random < 0.3;
    }
  }

  private async enhanceSuggestionWithAI(
    suggestion: GeneratedSuggestion,
    analysis: AnalysisResult
  ): Promise<GeneratedSuggestion> {
    // Find the matching pattern rule
    const rule = allPatternRules.find(r => r.name === suggestion.type);
    
    if (rule) {
      // Use the rule's predefined suggestion and code example
      return {
        ...suggestion,
        description: rule.suggestion,
        codeExample: rule.codeExample || undefined,
      };
    }

    // For suggestions without matching rules, use AI enhancement (placeholder)
    // In a real implementation, this would call Claude API
    const enhancedDescription = await this.generateAIDescription(suggestion, analysis);
    const codeExample = await this.generateAICodeExample(suggestion, analysis);

    return {
      ...suggestion,
      description: enhancedDescription,
      codeExample,
    };
  }

  private async generateAIDescription(
    suggestion: GeneratedSuggestion,
    analysis: AnalysisResult
  ): Promise<string> {
    // Placeholder for AI-generated description
    // In real implementation, this would use Claude API
    const contextInfo = `File: ${suggestion.filePath}, Lines of code: ${analysis.overallMetrics.linesOfCode}`;
    
    return `${suggestion.description}\n\nContext: ${contextInfo}\n\nThis suggestion is based on analysis of your codebase and follows modern development best practices.`;
  }

  private async generateAICodeExample(
    suggestion: GeneratedSuggestion,
    analysis: AnalysisResult
  ): Promise<string | undefined> {
    // Placeholder for AI-generated code example
    // In real implementation, this would use Claude API to generate contextual code examples
    
    if (suggestion.type === 'COMPONENT_STRUCTURE') {
      return `// Example refactoring for ${suggestion.filePath}
// Before: Large component
function LargeComponent() {
  // ... complex logic
}

// After: Broken down components
function SmallComponent() {
  // ... focused logic
}`;
    }

    return undefined;
  }

  private async applyComponentStructureChanges(suggestion: CodeSuggestion): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    if (!suggestion.filePath || !this.sandbox) {
      return changes;
    }

    try {
      // Read current file content
      const result = await this.sandbox.process.start({
        cmd: `cat "${suggestion.filePath}"`,
      });
      const oldContent = result.stdout;

      // Apply simple component refactoring (placeholder logic)
      let newContent = oldContent;

      // Example: Add React.memo for performance
      if (suggestion.category === 'ATOMIC_DESIGN' && !oldContent.includes('React.memo')) {
        newContent = this.addReactMemo(oldContent);
      }

      // Example: Extract inline styles
      if (oldContent.includes('style={{')) {
        newContent = this.extractInlineStyles(newContent);
      }

      if (newContent !== oldContent) {
        // Write the updated content
        await this.sandbox.filesystem.write(suggestion.filePath, newContent);

        changes.push({
          filePath: suggestion.filePath,
          oldContent,
          newContent,
          changeType: 'UPDATE',
        });
      }
    } catch (error) {
      console.error(`Failed to apply component structure changes to ${suggestion.filePath}:`, error);
    }

    return changes;
  }

  private async applyArchitectureChanges(suggestion: CodeSuggestion): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    if (suggestion.category === 'FEATURE_SLICED_DESIGN' && this.sandbox) {
      // Example: Create FSD directory structure
      const directories = ['src/shared', 'src/entities', 'src/features', 'src/widgets', 'src/pages', 'src/app'];
      
      for (const dir of directories) {
        try {
          await this.sandbox.process.start({
            cmd: `mkdir -p "${dir}"`,
          });
        } catch (error) {
          console.warn(`Failed to create directory ${dir}:`, error);
        }
      }

      // Create a placeholder change record
      changes.push({
        filePath: 'src/',
        oldContent: '',
        newContent: 'Feature-Sliced Design structure created',
        changeType: 'CREATE',
      });
    }

    return changes;
  }

  private async applyStateManagementChanges(suggestion: CodeSuggestion): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    if (!suggestion.filePath || !this.sandbox) {
      return changes;
    }

    try {
      const result = await this.sandbox.process.start({
        cmd: `cat "${suggestion.filePath}"`,
      });
      const oldContent = result.stdout;
      let newContent = oldContent;

      // Example: Convert useState to Zustand store
      if (suggestion.category === 'ZUSTAND' && oldContent.includes('useState')) {
        newContent = this.convertToZustandStore(oldContent);
      }

      if (newContent !== oldContent) {
        await this.sandbox.filesystem.write(suggestion.filePath, newContent);

        changes.push({
          filePath: suggestion.filePath,
          oldContent,
          newContent,
          changeType: 'UPDATE',
        });
      }
    } catch (error) {
      console.error(`Failed to apply state management changes to ${suggestion.filePath}:`, error);
    }

    return changes;
  }

  private async applyDataFetchingChanges(suggestion: CodeSuggestion): Promise<FileChange[]> {
    const changes: FileChange[] = [];

    if (!suggestion.filePath || !this.sandbox) {
      return changes;
    }

    try {
      const result = await this.sandbox.process.start({
        cmd: `cat "${suggestion.filePath}"`,
      });
      const oldContent = result.stdout;
      let newContent = oldContent;

      // Example: Convert useEffect + fetch to React Query
      if (suggestion.category === 'REACT_QUERY' && oldContent.includes('useEffect')) {
        newContent = this.convertToReactQuery(oldContent);
      }

      if (newContent !== oldContent) {
        await this.sandbox.filesystem.write(suggestion.filePath, newContent);

        changes.push({
          filePath: suggestion.filePath,
          oldContent,
          newContent,
          changeType: 'UPDATE',
        });
      }
    } catch (error) {
      console.error(`Failed to apply data fetching changes to ${suggestion.filePath}:`, error);
    }

    return changes;
  }

  // Code transformation helpers (simplified examples)

  private addReactMemo(content: string): string {
    // Simple example: wrap export with React.memo
    return content.replace(
      /export default function (\w+)/,
      'export default React.memo(function $1'
    ).replace(/}\s*$/, '})');
  }

  private extractInlineStyles(content: string): string {
    // Simple example: extract inline styles to const
    const styleMatches = content.match(/style=\{\{([^}]+)\}\}/g);
    if (styleMatches) {
      let newContent = content;
      styleMatches.forEach((match, index) => {
        const styleName = `styles${index + 1}`;
        const styleObject = match.replace('style={{', '').replace('}}', '');
        newContent = `const ${styleName} = { ${styleObject} };\n${newContent}`;
        newContent = newContent.replace(match, `style={${styleName}}`);
      });
      return newContent;
    }
    return content;
  }

  private convertToZustandStore(content: string): string {
    // Simplified conversion example
    const storeTemplate = `
import { create } from 'zustand';

const useStore = create((set) => ({
  // TODO: Convert useState calls to store state
  // Add your state and actions here
}));

// TODO: Replace useState calls with useStore
`;
    
    return `${storeTemplate}\n${content}`;
  }

  private convertToReactQuery(content: string): string {
    // Simplified conversion example
    const reactQueryImport = "import { useQuery } from '@tanstack/react-query';\n";
    
    // Add import if not present
    if (!content.includes('@tanstack/react-query')) {
      content = reactQueryImport + content;
    }

    // Add TODO comment for manual conversion
    const todoComment = `
// TODO: Convert useEffect + fetch to useQuery
// Example:
// const { data, isLoading, error } = useQuery({
//   queryKey: ['data'],
//   queryFn: fetchData
// });
`;

    return content + todoComment;
  }

  async cleanup(): Promise<void> {
    if (this.sandbox) {
      await this.sandbox.close();
      this.sandbox = null;
    }
    await this.prisma.$disconnect();
  }
}