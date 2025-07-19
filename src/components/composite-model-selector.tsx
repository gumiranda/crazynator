'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Brain, Zap, Search, Cog, Clock, Target, Cpu, Database } from 'lucide-react';

interface ModelConfig {
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
  capabilities: {
    maxContextLength: number;
    supportsToolCalling: boolean;
    supportsStreaming: boolean;
    supportsMultimodal: boolean;
    optimalForTasks: string[];
  };
}

interface ModelDetails {
  name: string;
  config: ModelConfig;
}

interface CompositeModelSelectorProps {
  onModelSelect?: (modelName: string) => void;
  selectedModel?: string;
  showDetails?: boolean;
}

export function CompositeModelSelector({ 
  onModelSelect, 
  selectedModel,
  showDetails = true 
}: CompositeModelSelectorProps) {
  const [models, setModels] = useState<ModelDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedModelDetails, setSelectedModelDetails] = useState<ModelConfig | null>(null);

  // Simulated model data - in production, this would come from your ModelUtils
  const mockModels: ModelDetails[] = [
    {
      name: 'v0-1.5-md',
      config: {
        name: 'v0-1.5-md',
        version: '1.5.0',
        baseModel: {
          provider: 'openai',
          model: 'gpt-4o',
          temperature: 0.1,
          maxTokens: 4000,
        },
        ragEnabled: true,
        postProcessingEnabled: true,
        capabilities: {
          maxContextLength: 128000,
          supportsToolCalling: true,
          supportsStreaming: true,
          supportsMultimodal: false,
          optimalForTasks: [
            'code generation',
            'debugging',
            'refactoring',
            'documentation',
            'rapid prototyping',
          ],
        },
      },
    },
    {
      name: 'v0-1.5-lg',
      config: {
        name: 'v0-1.5-lg',
        version: '1.5.0',
        baseModel: {
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
          temperature: 0.05,
          maxTokens: 8000,
        },
        ragEnabled: true,
        postProcessingEnabled: true,
        capabilities: {
          maxContextLength: 200000,
          supportsToolCalling: true,
          supportsStreaming: true,
          supportsMultimodal: true,
          optimalForTasks: [
            'complex architecture',
            'system design',
            'advanced algorithms',
            'code review',
            'performance optimization',
            'large-scale refactoring',
          ],
        },
      },
    },
  ];

  useEffect(() => {
    // Simulate loading models
    setTimeout(() => {
      setModels(mockModels);
      setLoading(false);
      
      // Set default selected model
      if (selectedModel) {
        const model = mockModels.find(m => m.name === selectedModel);
        setSelectedModelDetails(model?.config || null);
      } else if (mockModels.length > 0) {
        setSelectedModelDetails(mockModels[0].config);
      }
    }, 500);
  }, [selectedModel]);

  const handleModelChange = (modelName: string) => {
    const model = models.find(m => m.name === modelName);
    setSelectedModelDetails(model?.config || null);
    onModelSelect?.(modelName);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      default:
        return '⚡';
    }
  };

  const getComplexityColor = (tasks: string[]) => {
    const hasComplex = tasks.some(task => 
      task.includes('architecture') || 
      task.includes('system') || 
      task.includes('optimization')
    );
    return hasComplex ? 'destructive' : 'default';
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Composite Models
          </CardTitle>
          <CardDescription>Loading available models...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={60} className="w-full" />
            <p className="text-sm text-muted-foreground">Initializing composite model family...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Composite Model Selection
          </CardTitle>
          <CardDescription>
            Choose a composite model optimized for your specific task
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedModelDetails?.name} onValueChange={handleModelChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a model..." />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.name} value={model.name}>
                      <div className="flex items-center gap-2">
                        <span>{getProviderIcon(model.config.baseModel.provider)}</span>
                        <span className="font-medium">{model.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {model.config.baseModel.provider}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                onClick={() => handleModelChange('smart')}
                className="whitespace-nowrap"
              >
                <Target className="h-4 w-4 mr-2" />
                Smart Select
              </Button>
            </div>

            {showDetails && selectedModelDetails && (
              <div className="space-y-4">
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Cpu className="h-4 w-4" />
                      <h4 className="font-semibold">Model Configuration</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provider:</span>
                        <Badge variant="outline">
                          {selectedModelDetails.baseModel.provider}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base Model:</span>
                        <span className="font-mono text-xs">
                          {selectedModelDetails.baseModel.model}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Temperature:</span>
                        <span>{selectedModelDetails.baseModel.temperature}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Tokens:</span>
                        <span>{selectedModelDetails.baseModel.maxTokens?.toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-4 w-4" />
                      <h4 className="font-semibold">Enhanced Features</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Search className="h-3 w-3" />
                          <span className="text-sm">RAG Enabled</span>
                        </div>
                        <Badge variant={selectedModelDetails.ragEnabled ? 'default' : 'secondary'}>
                          {selectedModelDetails.ragEnabled ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cog className="h-3 w-3" />
                          <span className="text-sm">Post-Processing</span>
                        </div>
                        <Badge variant={selectedModelDetails.postProcessingEnabled ? 'default' : 'secondary'}>
                          {selectedModelDetails.postProcessingEnabled ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="h-3 w-3" />
                          <span className="text-sm">Context Length</span>
                        </div>
                        <span className="text-sm font-mono">
                          {selectedModelDetails.capabilities.maxContextLength.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4" />
                    <h4 className="font-semibold">Optimal Use Cases</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedModelDetails.capabilities.optimalForTasks.map((task, index) => (
                      <Badge 
                        key={index}
                        variant={getComplexityColor([task])}
                        className="text-xs"
                      >
                        {task}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" />
                    <h4 className="font-semibold">Capabilities</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Tool Calling:</span>
                      <Badge variant={selectedModelDetails.capabilities.supportsToolCalling ? 'default' : 'secondary'}>
                        {selectedModelDetails.capabilities.supportsToolCalling ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Streaming:</span>
                      <Badge variant={selectedModelDetails.capabilities.supportsStreaming ? 'default' : 'secondary'}>
                        {selectedModelDetails.capabilities.supportsStreaming ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Multimodal:</span>
                      <Badge variant={selectedModelDetails.capabilities.supportsMultimodal ? 'default' : 'secondary'}>
                        {selectedModelDetails.capabilities.supportsMultimodal ? 'Supported' : 'Not Supported'}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}