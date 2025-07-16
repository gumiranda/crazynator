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
import { useTRPC } from '@/trpc/client';
import { Form, FormField } from '@/components/ui/form';

interface MessageFormProps {
  projectId: string;
}

const formSchema = z.object({
  value: z
    .string()
    .min(1, { message: "You can't send an empty message" })
    .max(10000, { message: 'Message is too long' }),
});

export const MessageForm = ({ projectId }: MessageFormProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      value: '',
    },
  });
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          'relative border p-4 pt-1 rounded-xl bg-sidebar dark:bg-sidebar transition-all',
          isFocused && 'shadow-xs',
          showUsage && 'rounded-t-none',
        )}
      ></form>
    </Form>
  );
};
