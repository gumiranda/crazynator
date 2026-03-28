'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PlusIcon,
  TrashIcon,
  SaveIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  KeyIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface EnvVariable {
  key: string;
  value: string;
  isVisible: boolean;
}

interface EnvEditorProps {
  projectId: string;
  fragmentId: string | null;
}

export const EnvEditor = ({ projectId, fragmentId }: EnvEditorProps) => {
  const [variables, setVariables] = useState<EnvVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load env variables from the project
  useEffect(() => {
    const loadEnvVars = async () => {
      try {
        const response = await fetch(`/api/sandbox/env?projectId=${projectId}`);
        const data = await response.json();
        if (data.success && data.envVariables) {
          const vars = Object.entries(data.envVariables as Record<string, string>).map(
            ([key, value]) => ({
              key,
              value,
              isVisible: false,
            }),
          );
          setVariables(vars.length > 0 ? vars : [{ key: '', value: '', isVisible: true }]);
        } else {
          setVariables([{ key: '', value: '', isVisible: true }]);
        }
      } catch {
        setVariables([{ key: '', value: '', isVisible: true }]);
      } finally {
        setIsLoading(false);
      }
    };
    loadEnvVars();
  }, [projectId]);

  const addVariable = () => {
    setVariables([...variables, { key: '', value: '', isVisible: true }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: 'key' | 'value', newValue: string) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], [field]: newValue };
    setVariables(updated);
  };

  const toggleVisibility = (index: number) => {
    const updated = [...variables];
    updated[index] = { ...updated[index], isVisible: !updated[index].isVisible };
    setVariables(updated);
  };

  const saveVariables = async () => {
    setIsSaving(true);
    try {
      // Build env object from valid entries
      const envVariables: Record<string, string> = {};
      for (const v of variables) {
        if (v.key.trim()) {
          envVariables[v.key.trim()] = v.value;
        }
      }

      const response = await fetch('/api/sandbox/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, fragmentId, envVariables }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(
          data.writtenToSandbox
            ? 'Environment variables saved and applied to sandbox'
            : 'Environment variables saved (will apply on next build)',
        );
      } else {
        toast.error('Failed to save environment variables');
      }
    } catch {
      toast.error('Failed to save environment variables');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <KeyIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Environment Variables</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addVariable}>
            <PlusIcon className="h-3 w-3 mr-1" />
            Add
          </Button>
          <Button type="button" size="sm" onClick={saveVariables} disabled={isSaving}>
            {isSaving ? (
              <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <SaveIcon className="h-3 w-3 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Variables List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {variables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <KeyIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No environment variables configured</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addVariable}>
                <PlusIcon className="h-3 w-3 mr-1" />
                Add Variable
              </Button>
            </div>
          ) : (
            variables.map((variable, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Key</Label>
                  <Input
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    placeholder="VARIABLE_NAME"
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs text-muted-foreground">Value</Label>
                  <div className="relative">
                    <Input
                      value={variable.value}
                      onChange={(e) => updateVariable(index, 'value', e.target.value)}
                      placeholder="value"
                      type={variable.isVisible ? 'text' : 'password'}
                      className="h-8 text-sm font-mono pr-8"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => toggleVisibility(index)}
                    >
                      {variable.isVisible ? (
                        <EyeOffIcon className="h-3 w-3" />
                      ) : (
                        <EyeIcon className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removeVariable(index)}
                >
                  <TrashIcon className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Info */}
      <div className="px-4 py-2 border-t text-xs text-muted-foreground">
        Variables are written to <code className="bg-muted px-1 rounded">.env.local</code> in the
        sandbox. Available via <code className="bg-muted px-1 rounded">process.env.KEY</code>.
      </div>
    </div>
  );
};
