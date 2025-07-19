import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextareaAutosize from 'react-textarea-autosize';
import { z } from 'zod';
import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowUpIcon, Loader2Icon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTRPC } from '@/trpc/client';
import { Form, FormField } from '@/components/ui/form';
import Usage from './usage';
import { useRouter } from 'next/navigation';

interface MessageFormProps {
  projectId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "You can't send an empty message" })
    .max(10000, { message: 'Message is too long' }),
});

// Predefined suggestion messages
const suggestionChips = [
  "Explain this code",
  "Add documentation",
  "Fix bugs",
  "Optimize performance", 
  "Add unit tests",
  "Refactor code",
  "Add error handling",
  "Review security",
  "Create API endpoints",
  "Add TypeScript types"
];

export const MessageForm = ({ projectId }: MessageFormProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
    },
  });
  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        form.reset();
        toast.success('Message sent');
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.usages.status.queryOptions());
      },
      onError: (error) => {
        toast.error(error.message);
        if (error.data?.code === 'TOO_MANY_REQUESTS') {
          router.push('/pricing');
        }
      },
    }),
  );
  const { data: usage, isPending: isLoadingUsage } = useQuery(trpc.usages.status.queryOptions());
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMessage.mutateAsync({
      projectId,
      value: values.value,
    });
  };

  const handleSuggestionClick = (suggestion: string) => {
    form.setValue('value', suggestion);
    form.trigger('value');
  };

  const isPending = createMessage.isPending || isLoadingUsage;
  const isButtonDisabled = isPending || !form.formState.isValid;
  const showUsage = !!usage;

  return (
    <Form {...form}>
      {showUsage && <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext} />}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'relative border p-2 sm:p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all',
          isFocused && 'shadow-xs',
          showUsage && 'rounded-t-none',
        )}
      >
        {/* Suggestion chips */}
        {!form.watch('value') && (
          <div className="p-2 sm:p-3 pb-1 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-all duration-200 text-xs px-2 py-1 hover:scale-105"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <TextareaAutosize
              {...field}
              disabled={isPending}
              className={cn('pt-3 sm:pt-4 resize-none border-none w-full outline-none bg-transparent text-sm sm:text-base')}
              minRows={2}
              maxRows={6}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Type your message here..."
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
          <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
            <kbd className="ml-auto pointer-events-none inline-flex h-4 sm:h-5 select-none items-center gap-1 rounded border bg-muted px-1 sm:px-1.5 font-mono text-[9px] sm:text-[10px] font-medium text-muted-foreground">
              <span>&#8984;</span>Enter
            </kbd>
            &nbsp;to send
          </div>
          <Button
            type="submit"
            size="icon"
            className={cn(
              'size-7 sm:size-8 rounded-full cursor-pointer',
              isButtonDisabled && 'bg-muted-foreground border',
            )}
            disabled={isButtonDisabled}
          >
            {isPending ? (
              <Loader2Icon className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
            ) : (
              <ArrowUpIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
