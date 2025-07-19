'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  Eye, 
  Palette, 
  Type, 
  Layers, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  ExternalLink,
  Copy,
  Clock
} from 'lucide-react';
import type { 
  DesignContext, 
  FigmaImportResult
} from '@/types/figma';
import { OutputFormat } from '@/types/figma';

// Form validation schema
const figmaImportSchema = z.object({
  fileUrl: z.string()
    .min(1, 'File URL is required')
    .url('Must be a valid URL')
    .refine(
      (url) => url.includes('figma.com'),
      'Must be a Figma URL'
    ),
  accessToken: z.string()
    .min(1, 'Access token is required')
    .min(10, 'Access token seems too short'),
  includeComponents: z.boolean(),
  includeStyles: z.boolean(),
  includeAssets: z.boolean(),
  extractTokens: z.boolean(),
  generateCode: z.boolean(),
  outputFormat: z.array(z.nativeEnum(OutputFormat))
});

type FigmaImportForm = z.infer<typeof figmaImportSchema>;

interface FigmaImportProps {
  onImportComplete?: (result: FigmaImportResult) => void;
}

export function FigmaImport({ onImportComplete }: FigmaImportProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<FigmaImportResult | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<FigmaImportForm>({
    resolver: zodResolver(figmaImportSchema),
    defaultValues: {
      includeComponents: true,
      includeStyles: true,
      includeAssets: false,
      extractTokens: true,
      generateCode: false,
      outputFormat: [OutputFormat.JSON]
    }
  });

  const watchedValues = watch();

  const simulateProgress = useCallback(() => {
    const steps = [
      { message: 'Validating Figma URL...', progress: 10 },
      { message: 'Authenticating with Figma API...', progress: 20 },
      { message: 'Fetching file data...', progress: 40 },
      { message: 'Analyzing components...', progress: 60 },
      { message: 'Extracting design tokens...', progress: 75 },
      { message: 'Processing styles...', progress: 85 },
      { message: 'Generating context...', progress: 95 },
      { message: 'Finalizing import...', progress: 100 }
    ];

    let currentStepIndex = 0;
    
    const updateProgress = () => {
      if (currentStepIndex < steps.length) {
        const step = steps[currentStepIndex];
        setCurrentStep(step.message);
        setImportProgress(step.progress);
        currentStepIndex++;
        setTimeout(updateProgress, 1000 + Math.random() * 1000);
      }
    };

    updateProgress();
  }, []);

  const onSubmit = async (data: FigmaImportForm) => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);
    simulateProgress();

    try {
      const response = await fetch('/api/figma/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: data.fileUrl,
          accessToken: data.accessToken,
          options: {
            includeComponents: data.includeComponents,
            includeStyles: data.includeStyles,
            includeAssets: data.includeAssets,
            extractTokens: data.extractTokens,
            generateCode: data.generateCode,
            outputFormat: data.outputFormat
          }
        })
      });

      const result = await response.json();
      setImportResult(result);
      
      if (result.success && onImportComplete) {
        onImportComplete(result);
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        errors: [{
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to the import service'
        }],
        warnings: [],
        stats: {
          totalNodes: 0,
          processedNodes: 0,
          componentsFound: 0,
          stylesExtracted: 0,
          assetsDownloaded: 0,
          tokensGenerated: 0,
          processingTime: 0
        }
      });
    } finally {
      setIsImporting(false);
      setImportProgress(100);
      setCurrentStep('Import completed');
    }
  };

  const handleCopyToken = async (token: string) => {
    try {
      await navigator.clipboard.writeText(token);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Figma File Import
          </CardTitle>
          <CardDescription>
            Import design files directly from Figma and extract design context, components, and tokens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* File URL Input */}
            <div className="space-y-2">
              <Label htmlFor="fileUrl">Figma File URL</Label>
              <Input
                id="fileUrl"
                placeholder="https://www.figma.com/file/..."
                {...register('fileUrl')}
                disabled={isImporting}
              />
              {errors.fileUrl && (
                <p className="text-sm text-red-500">{errors.fileUrl.message}</p>
              )}
            </div>

            {/* Access Token Input */}
            <div className="space-y-2">
              <Label htmlFor="accessToken">Figma Access Token</Label>
              <Input
                id="accessToken"
                type="password"
                placeholder="figd_..."
                {...register('accessToken')}
                disabled={isImporting}
              />
              {errors.accessToken && (
                <p className="text-sm text-red-500">{errors.accessToken.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Get your access token from{' '}
                <a 
                  href="https://www.figma.com/developers/api#access-tokens" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline inline-flex items-center gap-1"
                >
                  Figma Developer Settings
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            {/* Import Options */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Import Options</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeComponents"
                    checked={watchedValues.includeComponents}
                    onCheckedChange={(checked) => setValue('includeComponents', !!checked)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="includeComponents" className="text-sm">
                    Include Components
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeStyles"
                    checked={watchedValues.includeStyles}
                    onCheckedChange={(checked) => setValue('includeStyles', !!checked)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="includeStyles" className="text-sm">
                    Include Styles
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAssets"
                    checked={watchedValues.includeAssets}
                    onCheckedChange={(checked) => setValue('includeAssets', !!checked)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="includeAssets" className="text-sm">
                    Include Assets
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="extractTokens"
                    checked={watchedValues.extractTokens}
                    onCheckedChange={(checked) => setValue('extractTokens', !!checked)}
                    disabled={isImporting}
                  />
                  <Label htmlFor="extractTokens" className="text-sm">
                    Extract Design Tokens
                  </Label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              disabled={!isValid || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import Figma File
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isImporting && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Import Progress</span>
                <span className="text-sm text-gray-500">{importProgress}%</span>
              </div>
              <Progress value={importProgress} className="h-2" />
              {currentStep && (
                <p className="text-sm text-gray-600">{currentStep}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Import {importResult.success ? 'Successful' : 'Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.success && importResult.data ? (
              <ImportResults data={importResult.data} stats={importResult.stats} />
            ) : (
              <div className="space-y-4">
                {importResult.errors?.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{error.code}:</strong> {error.message}
                    </AlertDescription>
                  </Alert>
                ))}
                
                {importResult.warnings?.map((warning, index) => (
                  <Alert key={index}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Warning:</strong> {warning.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ImportResultsProps {
  data: DesignContext;
  stats: any;
}

function ImportResults({ data, stats }: ImportResultsProps) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="components">Components</TabsTrigger>
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="typography">Typography</TabsTrigger>
        <TabsTrigger value="tokens">Tokens</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Layers className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.componentsFound}</div>
              <div className="text-sm text-gray-500">Components</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Palette className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">
                {Object.keys(data.designTokens.colors).length}
              </div>
              <div className="text-sm text-gray-500">Colors</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Type className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold">{stats.stylesExtracted}</div>
              <div className="text-sm text-gray-500">Text Styles</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">
                {Math.round(stats.processingTime / 1000)}s
              </div>
              <div className="text-sm text-gray-500">Processing Time</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>File Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">File Name:</span>
                <span className="text-sm">{data.file.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Last Modified:</span>
                <span className="text-sm">
                  {new Date(data.file.lastModified).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Version:</span>
                <span className="text-sm">{data.file.version}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="components">
        <ScrollArea className="h-[400px]">
          <div className="space-y-3">
            {data.components.map((component) => (
              <Card key={component.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{component.name}</h4>
                    <Badge variant="outline">{component.type}</Badge>
                  </div>
                  {component.description && (
                    <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                  )}
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span>{component.variants.length} variants</span>
                    <span>•</span>
                    <span>{component.usageCount} instances</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="colors">
        <div className="space-y-4">
          {Object.entries(data.colorPalette).map(([category, colors]) => (
            colors.length > 0 && (
              <div key={category}>
                <h4 className="font-medium mb-3 capitalize">{category}</h4>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
                  {colors.map((color: any) => (
                    <div key={color.hex} className="space-y-1">
                      <div 
                        className="w-full h-12 rounded border"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-xs text-center">
                        <div className="font-medium">{color.name}</div>
                        <div className="text-gray-500">{color.hex}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <Separator className="mt-4" />
              </div>
            )
          ))}
        </div>
      </TabsContent>

      <TabsContent value="typography">
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {data.typography.textStyles.map((style, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{style.name}</h4>
                    <Badge variant="outline">{style.usage} uses</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Font Family:</span> {style.fontFamily}
                    </div>
                    <div>
                      <span className="text-gray-500">Font Size:</span> {style.fontSize}px
                    </div>
                    <div>
                      <span className="text-gray-500">Font Weight:</span> {style.fontWeight}
                    </div>
                    <div>
                      <span className="text-gray-500">Line Height:</span> {style.lineHeight}px
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="tokens">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Design Tokens</h4>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const tokens = JSON.stringify(data.designTokens, null, 2);
                navigator.clipboard.writeText(tokens);
              }}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
          </div>
          
          <ScrollArea className="h-[400px]">
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-x-auto">
              {JSON.stringify(data.designTokens, null, 2)}
            </pre>
          </ScrollArea>
        </div>
      </TabsContent>
    </Tabs>
  );
}