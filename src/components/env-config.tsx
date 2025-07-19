'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Upload, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface EnvVariable {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'url' | 'secret';
}

interface EnvConfigProps {
  projectId: string;
  initialEnvVars?: EnvVariable[];
  onSave?: (envVars: EnvVariable[]) => void;
}

const defaultEnvVars: EnvVariable[] = [
  {
    key: 'DATABASE_URL',
    value: '',
    description: 'PostgreSQL database connection string',
    required: true,
    type: 'url'
  },
  {
    key: 'NEXT_PUBLIC_APP_URL',
    value: 'http://localhost:3000',
    description: 'Application base URL',
    required: true,
    type: 'url'
  },
  {
    key: 'OPENAI_API_KEY',
    value: '',
    description: 'OpenAI API key for AI features',
    required: false,
    type: 'secret'
  },
  {
    key: 'ANTHROPIC_API_KEY',
    value: '',
    description: 'Anthropic API key for Claude AI',
    required: false,
    type: 'secret'
  },
  {
    key: 'E2B_API_KEY',
    value: '',
    description: 'E2B API key for code execution',
    required: false,
    type: 'secret'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    value: '',
    description: 'Clerk publishable key for authentication',
    required: true,
    type: 'string'
  },
  {
    key: 'CLERK_SECRET_KEY',
    value: '',
    description: 'Clerk secret key for authentication',
    required: true,
    type: 'secret'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
    value: '/sign-in',
    description: 'Clerk sign in URL',
    required: true,
    type: 'string'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    value: '/sign-up',
    description: 'Clerk sign up URL',
    required: true,
    type: 'string'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL',
    value: '/',
    description: 'Clerk sign in fallback redirect URL',
    required: true,
    type: 'string'
  },
  {
    key: 'NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL',
    value: '/',
    description: 'Clerk sign up fallback redirect URL',
    required: true,
    type: 'string'
  }
];

export default function EnvConfig({ projectId, initialEnvVars, onSave }: EnvConfigProps) {
  const [envVars, setEnvVars] = useState<EnvVariable[]>(initialEnvVars || defaultEnvVars);
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState('visual');
  const [envFileContent, setEnvFileContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    // Generate .env file content when envVars change
    const content = envVars
      .map(envVar => {
        const comment = envVar.description ? `# ${envVar.description}\n` : '';
        const required = envVar.required ? '# Required' : '# Optional';
        return `${comment}${required}\n${envVar.key}=${envVar.value}\n`;
      })
      .join('\n');
    setEnvFileContent(content);
  }, [envVars]);

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '', description: '', type: 'string' }]);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleUpdateEnvVar = (index: number, field: keyof EnvVariable, value: string | boolean) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const toggleSecretVisibility = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    if (onSave) {
      onSave(envVars);
    }
    toast({
      title: 'Environment variables saved',
      description: 'Your environment configuration has been saved successfully.',
    });
  };

  const handleDownload = () => {
    const blob = new Blob([envFileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Environment file downloaded',
      description: 'Your .env file has been downloaded successfully.',
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(envFileContent);
      toast({
        title: 'Copied to clipboard',
        description: 'Environment variables copied to clipboard.',
      });
    } catch (err) {
      toast({
        title: 'Failed to copy',
        description: 'Could not copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        parseEnvFile(content);
      };
      reader.readAsText(file);
    }
  };

  const parseEnvFile = (content: string) => {
    const lines = content.split('\n');
    const parsed: EnvVariable[] = [];
    let currentDescription = '';

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('#')) {
        const comment = trimmedLine.slice(1).trim();
        if (!comment.toLowerCase().includes('required') && !comment.toLowerCase().includes('optional')) {
          currentDescription = comment;
        }
      } else if (trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=');
        
        const envVar: EnvVariable = {
          key: key.trim(),
          value: value.trim().replace(/^['"]|['"]$/g, ''), // Remove quotes
          description: currentDescription,
          type: key.includes('SECRET') || key.includes('KEY') ? 'secret' : 'string'
        };
        
        parsed.push(envVar);
        currentDescription = '';
      }
    }

    setEnvVars(parsed);
    toast({
      title: 'Environment file loaded',
      description: `Loaded ${parsed.length} environment variables.`,
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Environment Configuration</CardTitle>
        <CardDescription>
          Configure environment variables for your project. These will be used to generate your .env file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visual">Visual Editor</TabsTrigger>
            <TabsTrigger value="file">File Editor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="visual" className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button onClick={handleAddEnvVar} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Variable
              </Button>
              <Button onClick={handleSave} size="sm">
                Save Configuration
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download .env
              </Button>
              <div className="relative">
                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload .env
                    <input
                      type="file"
                      accept=".env,.txt"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </label>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {envVars.map((envVar, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`key-${index}`}>Variable Name</Label>
                      <Input
                        id={`key-${index}`}
                        value={envVar.key}
                        onChange={(e) => handleUpdateEnvVar(index, 'key', e.target.value)}
                        placeholder="VARIABLE_NAME"
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`value-${index}`}>Value</Label>
                        {envVar.type === 'secret' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleSecretVisibility(envVar.key)}
                          >
                            {showSecrets[envVar.key] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                      </div>
                      <Input
                        id={`value-${index}`}
                        type={envVar.type === 'secret' && !showSecrets[envVar.key] ? 'password' : 'text'}
                        value={envVar.value}
                        onChange={(e) => handleUpdateEnvVar(index, 'value', e.target.value)}
                        placeholder="variable_value"
                        className="font-mono"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Input
                        id={`description-${index}`}
                        value={envVar.description || ''}
                        onChange={(e) => handleUpdateEnvVar(index, 'description', e.target.value)}
                        placeholder="Description of this variable"
                      />
                    </div>
                    
                    <div className="flex items-center justify-between md:col-span-2">
                      <div className="flex gap-2">
                        <Badge variant={envVar.required ? 'destructive' : 'secondary'}>
                          {envVar.required ? 'Required' : 'Optional'}
                        </Badge>
                        <Badge variant="outline">{envVar.type}</Badge>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEnvVar(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="file" className="space-y-6">
            <div className="flex gap-2 mb-4">
              <Button onClick={handleCopy} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy to Clipboard
              </Button>
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download .env
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="env-content">.env File Content</Label>
              <Textarea
                id="env-content"
                value={envFileContent}
                onChange={(e) => setEnvFileContent(e.target.value)}
                className="font-mono min-h-[400px]"
                placeholder="# Environment variables..."
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}