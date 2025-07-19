'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Save, Settings } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { toast } from 'sonner';

const settingsSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  preferredProvider: z.enum(['openai', 'anthropic']),
  openaiModel: z.string().min(1, 'OpenAI model is required'),
  anthropicModel: z.string().min(1, 'Anthropic model is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

const OPENAI_MODELS = [
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

const ANTHROPIC_MODELS = [
  { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' },
  { value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
  { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
];

export default function SettingsPage() {
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);

  const { data: settings, refetch, isLoading } = trpc.userSettings.get.useQuery();
  const updateSettings = trpc.userSettings.update.useMutation({
    onSuccess: () => {
      toast.success('Settings updated successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update settings');
    },
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      openaiApiKey: '',
      anthropicApiKey: '',
      preferredProvider: 'openai',
      openaiModel: 'gpt-4o',
      anthropicModel: 'claude-3-5-sonnet-20241022',
    },
  });

  // Update form when settings data changes
  useEffect(() => {
    if (settings) {
      form.reset({
        openaiApiKey: settings.openaiApiKey || '',
        anthropicApiKey: settings.anthropicApiKey || '',
        preferredProvider: (settings.preferredProvider as 'openai' | 'anthropic') || 'openai',
        openaiModel: settings.openaiModel || 'gpt-4o',
        anthropicModel: settings.anthropicModel || 'claude-3-5-sonnet-20241022',
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormData) => {
    updateSettings.mutate({
      openaiApiKey: data.openaiApiKey || undefined,
      anthropicApiKey: data.anthropicApiKey || undefined,
      preferredProvider: data.preferredProvider,
      openaiModel: data.openaiModel,
      anthropicModel: data.anthropicModel,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">AI Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your AI provider API keys and model preferences for code generation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Provider Configuration</CardTitle>
          <CardDescription>
            Set up your preferred AI provider and model settings. You can use your own API keys or fall back to default settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="preferredProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred AI Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your preferred AI provider for code generation tasks.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">OpenAI Configuration</CardTitle>
                    <CardDescription>
                      Configure OpenAI API key and model selection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="openaiApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI API Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showOpenAIKey ? 'text' : 'password'}
                                placeholder="sk-..."
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                              >
                                {showOpenAIKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Get your API key from{' '}
                            <a
                              href="https://platform.openai.com/api-keys"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              OpenAI Platform
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="openaiModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>OpenAI Model</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {OPENAI_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Anthropic Configuration</CardTitle>
                    <CardDescription>
                      Configure Anthropic API key and model selection
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="anthropicApiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anthropic API Key</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showAnthropicKey ? 'text' : 'password'}
                                placeholder="sk-ant-..."
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                              >
                                {showAnthropicKey ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Get your API key from{' '}
                            <a
                              href="https://console.anthropic.com/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Anthropic Console
                            </a>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="anthropicModel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Anthropic Model</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a model" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ANTHROPIC_MODELS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                  {model.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={updateSettings.isPending} className="gap-2">
                  <Save className="h-4 w-4" />
                  {updateSettings.isPending ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              • API keys are stored securely and are only used for your code generation requests.
            </p>
            <p>
              • If you don't provide an API key, the system will fall back to default settings (if available).
            </p>
            <p>
              • Different models have different capabilities and pricing. Choose the one that best fits your needs.
            </p>
            <p>
              • You can change your preferences at any time by returning to this settings page.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}