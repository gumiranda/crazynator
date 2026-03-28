'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextareaAutosize from 'react-textarea-autosize';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpIcon, Loader2Icon, SettingsIcon, ChevronDownIcon } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { Form, FormField } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { useClerk } from '@clerk/nextjs';
import { PROJECT_TEMPLATES } from '@/constants/projects';
import { UILibrarySelector } from '@/modules/projects/ui/components/ui-library-selector';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { UI_LIBRARIES } from '@/constants/ui-libraries';

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "You can't send an empty project" })
    .max(10000, { message: 'Project is too long' }),
});

export const ProjectForm = () => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [selectedLibraries, setSelectedLibraries] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const trpc = useTRPC();
  const clerk = useClerk();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
    },
  });
  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
        queryClient.invalidateQueries(trpc.usages.status.queryOptions());
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          router.push('/pricing');
        }
        if (error.data?.code === 'UNAUTHORIZED') {
          clerk.openSignIn();
        }
      },
    }),
  );
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createProject.mutateAsync({
      value: values.value,
      uiLibraries: selectedLibraries.length > 0 ? selectedLibraries : undefined,
    });
  };
  const isPending = createProject.isPending;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const onSelect = (prompt: string) => {
    form.setValue('value', prompt, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
  };
  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            'relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all',
            isFocused && 'shadow-xs',
          )}
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <TextareaAutosize
                {...field}
                disabled={isPending}
                className={cn('pt-4 resize-none border-none w-full outline-none bg-transparent')}
                minRows={2}
                maxRows={8}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Type your project here..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    form.handleSubmit(onSubmit)(e);
                  }
                }}
              />
            )}
          />
          <div className="flex gap-x-2 items-end justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="text-[10px] text-muted-foreground font-mono">
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span>&#8984;</span>Enter
                </kbd>
                &nbsp;to send
              </div>
              {selectedLibraries.length > 0 && (
                <div className="flex gap-1">
                  {selectedLibraries.map((id) => {
                    const lib = UI_LIBRARIES.find((l) => l.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-[10px] py-0">
                        {lib?.icon} {lib?.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setShowConfig(!showConfig)}
                title="Configure UI libraries"
              >
                <SettingsIcon className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                size="icon"
                className={cn(
                  'size-8 rounded-full cursor-pointer',
                  isButtonDisabled && 'bg-muted-foreground border',
                )}
                disabled={isButtonDisabled}
              >
                {isPending ? (
                  <Loader2Icon className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowUpIcon className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* UI Library Configuration Panel */}
        <Collapsible open={showConfig} onOpenChange={setShowConfig}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-muted-foreground"
              type="button"
            >
              <span className="flex items-center gap-2">
                <SettingsIcon className="h-3 w-3" />
                UI Libraries & Configuration
                {selectedLibraries.length > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {selectedLibraries.length} selected
                  </Badge>
                )}
              </span>
              <ChevronDownIcon
                className={cn('h-3 w-3 transition-transform', showConfig && 'rotate-180')}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg p-4 bg-sidebar dark:bg-sidebar mt-2">
              <UILibrarySelector selected={selectedLibraries} onChange={setSelectedLibraries} />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="flex-wrap justify-center gap-2 flex max-w-3xl">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-sidebar"
              onClick={() => {
                onSelect(template.prompt);
              }}
            >
              {template.emoji} {template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
};
