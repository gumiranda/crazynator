import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import TextareaAutosize from 'react-textarea-autosize';
import { z } from 'zod';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowUpIcon, Loader2Icon, ImageIcon, XIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';
import { Form, FormField } from '@/components/ui/form';
import Usage from './usage';
import { useRouter } from 'next/navigation';
import { useImageUpload } from '@/hooks/useImageUpload';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { uploadImage, isUploading, uploadedImages, removeImage, clearImages } = useImageUpload();

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
        clearImages();
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
      images: uploadedImages,
    });
  };

  const handleFileSelect = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        await uploadImage(file);
      } else {
        toast.error(`${file.name} is not an image file`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const isPending = createMessage.isPending || isLoadingUsage || isUploading;
  const isButtonDisabled = isPending || (!form.formState.isValid && uploadedImages.length === 0);
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
          isDragging && 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Image Upload Preview */}
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 pt-2">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Image
                  src={imageUrl}
                  alt={`Uploaded image ${index + 1}`}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(imageUrl)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </div>
            ))}
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
              placeholder="Type your message here or drag and drop images..."
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
            <div className="text-[9px] sm:text-[10px] text-muted-foreground font-mono">
              <kbd className="ml-auto pointer-events-none inline-flex h-4 sm:h-5 select-none items-center gap-1 rounded border bg-muted px-1 sm:px-1.5 font-mono text-[9px] sm:text-[10px] font-medium text-muted-foreground">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to send
            </div>
            
            {/* Image Upload Button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {isUploading ? (
                <Loader2Icon className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
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

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
        />

        {/* Drag and Drop Overlay */}
        {isDragging && (
          <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/20 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center">
            <div className="text-blue-600 dark:text-blue-400 text-sm font-medium">
              Drop images here to upload
            </div>
          </div>
        )}
      </form>
    </Form>
  );
};
