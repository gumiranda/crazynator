'use client';

import React, { useState } from 'react';
import { trpc } from '@/trpc/client';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Code,
  Layers,
  Zap,
  Database,
  TestTube,
  Eye,
  Brain,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';

interface PatternAnalyzerProps {
  projectId: string;
  onAnalysisComplete: () => void;
}

const analysisSteps = [
  { id: 'structure', label: 'Project Structure', icon: <Layers className="h-4 w-4" /> },
  { id: 'components', label: 'Component Analysis', icon: <Code className="h-4 w-4" /> },
  { id: 'patterns', label: 'Pattern Detection', icon: <Brain className="h-4 w-4" /> },
  { id: 'state', label: 'State Management', icon: <Database className="h-4 w-4" /> },
  { id: 'performance', label: 'Performance Check', icon: <Zap className="h-4 w-4" /> },
  { id: 'accessibility', label: 'Accessibility Scan', icon: <Eye className="h-4 w-4" /> },
  { id: 'testing', label: 'Testing Coverage', icon: <TestTube className="h-4 w-4" /> },
  { id: 'suggestions', label: 'Generate Suggestions', icon: <FileText className="h-4 w-4" /> },
];

export function PatternAnalyzer({ projectId, onAnalysisComplete }: PatternAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  // tRPC queries
  const { data: metrics, refetch: refetchMetrics } = trpc.suggestions.getAnalysisMetrics.useQuery(
    { projectId },
    { enabled: false }
  );

  // tRPC mutations
  const analyzeMutation = trpc.suggestions.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResults(data);
      setIsAnalyzing(false);
      setCurrentStep(0);
      toast.success(`Analysis complete! Generated ${data.suggestions} suggestions.`);
      onAnalysisComplete();
      refetchMetrics();
    },
    onError: (error) => {
      setIsAnalyzing(false);
      setCurrentStep(0);
      toast.error(`Analysis failed: ${error.message}`);
    },
  });

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setCurrentStep(0);
    setAnalysisResults(null);

    // Simulate analysis steps with progress
    for (let i = 0; i < analysisSteps.length; i++) {
      setCurrentStep(i);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
    }

    // Trigger actual analysis
    analyzeMutation.mutate({ projectId });
  };

  const getStepStatus = (stepIndex: number) => {
    if (!isAnalyzing) return 'pending';
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'active';
    return 'pending';
  };

  const getStepIcon = (step: any, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    if (status === 'active') {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />;
    }
    return step.icon;
  };

  const progressPercentage = isAnalyzing 
    ? Math.round(((currentStep + 1) / analysisSteps.length) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Analysis Control */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Code Pattern Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Analyze your codebase for patterns, anti-patterns, and improvement opportunities
              </p>
            </div>
            <Button
              onClick={handleStartAnalysis}
              disabled={isAnalyzing || analyzeMutation.isPending}
              size="lg"
            >
              {isAnalyzing || analyzeMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Analysis
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Progress */}
        {isAnalyzing && (
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
              
              {/* Current Step */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {getStepIcon(analysisSteps[currentStep], 'active')}
                <span>
                  {analysisSteps[currentStep]?.label || 'Completing...'}
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Steps */}
      <Card>
        <CardHeader>
          <h4 className="font-semibold">Analysis Steps</h4>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisSteps.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                    status === 'active' 
                      ? 'bg-blue-50 border border-blue-200' 
                      : status === 'completed'
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`
                    ${status === 'active' ? 'text-blue-600' : ''}
                    ${status === 'completed' ? 'text-green-600' : ''}
                    ${status === 'pending' ? 'text-gray-400' : ''}
                  `}>
                    {getStepIcon(step, status)}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${
                      status === 'pending' ? 'text-gray-400' : ''
                    }`}>
                      {step.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {status === 'completed' && 'Completed'}
                      {status === 'active' && 'In progress...'}
                      {status === 'pending' && 'Waiting'}
                    </div>
                  </div>
                  {status === 'completed' && (
                    <Badge variant="secondary" className="text-xs">
                      Done
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Previous Analysis Results */}
      {metrics && !isAnalyzing && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              <h4 className="font-semibold">Project Metrics</h4>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Lines of Code</div>
                <div className="text-2xl font-bold">{metrics.metrics.linesOfCode.toLocaleString()}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Complexity Score</div>
                <div className="text-2xl font-bold">{Math.round(metrics.metrics.complexity)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Maintainability</div>
                <div className="text-2xl font-bold">
                  {Math.round(metrics.metrics.maintainabilityIndex)}%
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Technical Debt</div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.metrics.technicalDebt}
                </div>
              </div>
            </div>

            {metrics.suggestionCounts && metrics.suggestionCounts.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <h5 className="font-medium mb-3">Suggestion Breakdown</h5>
                  <div className="space-y-2">
                    {metrics.suggestionCounts.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.category}
                          </Badge>
                          <Badge variant={
                            item.severity === 'ERROR' ? 'destructive' : 
                            item.severity === 'WARNING' ? 'secondary' : 'default'
                          } className="text-xs">
                            {item.severity}
                          </Badge>
                          <span className="capitalize">{item.status.toLowerCase()}</span>
                        </div>
                        <span className="font-medium">{item._count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Latest Analysis Results */}
      {analysisResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">Analysis Complete</h4>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analysisResults.suggestions}
                  </div>
                  <div className="text-sm text-muted-foreground">Suggestions Generated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {analysisResults.analysisResult?.files?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Files Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {analysisResults.analysisResult?.detectedPatterns?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Patterns Detected</div>
                </div>
              </div>

              <Separator />

              <div className="text-sm">
                <div className="font-medium mb-2">Analysis Summary</div>
                <p className="text-muted-foreground">
                  {analysisResults.message}
                </p>
              </div>

              {analysisResults.analysisResult?.overallMetrics && (
                <>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Maintainability Index:</span>
                      <span className="ml-2 font-medium">
                        {Math.round(analysisResults.analysisResult.overallMetrics.maintainabilityIndex)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Technical Debt:</span>
                      <span className="ml-2 font-medium">
                        {analysisResults.analysisResult.overallMetrics.technicalDebt}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>What does the analysis do?</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Scans your codebase for architectural patterns and anti-patterns</li>
              <li>Identifies opportunities for improvement in component structure</li>
              <li>Analyzes state management and data fetching patterns</li>
              <li>Checks for performance optimization opportunities</li>
              <li>Reviews accessibility compliance</li>
              <li>Evaluates testing coverage and strategies</li>
            </ul>
            <p className="mt-3">
              <strong>Note:</strong> The analysis runs in a secure sandbox environment and does not 
              modify your code. Suggestions are generated based on modern React and TypeScript best practices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}