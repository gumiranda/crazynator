'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Github, Loader2, Lock, Unlock, ExternalLink } from 'lucide-react';
import { useTRPC } from '@/trpc/client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

const createRepositorySchema = z.object({
  name: z
    .string()
    .min(1, 'Repository name is required')
    .max(100, 'Repository name is too long')
    .regex(
      /^[a-zA-Z0-9._-]+$/,
      'Repository name can only contain letters, numbers, dots, hyphens, and underscores',
    ),
  description: z.string().max(500, 'Description is too long').optional(),
  isPrivate: z.boolean(),
});

type CreateRepositoryForm = z.infer<typeof createRepositorySchema>;

interface CreateRepositoryDialogProps {
  projectId: string;
  projectName: string;
  trigger?: React.ReactNode;
  onSuccess?: (repository: any) => void;
}

export function CreateRepositoryDialog({
  projectId,
  projectName,
  trigger,
  onSuccess,
}: CreateRepositoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdRepository, setCreatedRepository] = useState<any>(null);

  const trpc = useTRPC();
  const { data: connection } = useQuery(trpc.github.getConnection.queryOptions());
  console.log({ connection });
  const { data: existingRepo } = useQuery(
    trpc.github.getRepositoryByProject.queryOptions({ projectId }),
  );

  const createRepositoryMutation = useMutation({
    ...trpc.github.createRepository.mutationOptions(),
    onSuccess: (repository) => {
      toast.success(`Repository "${repository.name}" created successfully!`);
      setCreatedRepository(repository);
      onSuccess?.(repository);
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create repository');
    },
  });

  const form = useForm<CreateRepositoryForm>({
    resolver: zodResolver(createRepositorySchema),
    defaultValues: {
      name: '',
      description: '',
      isPrivate: false,
    },
  });

  // Auto-populate repository name based on project name
  useEffect(() => {
    if (open && !form.getValues('name') && projectName) {
      // Convert project name to a valid repository name
      const repoName = projectName
        .toLowerCase()
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-|-$/g, '');
      form.setValue('name', repoName);
    }
  }, [open, projectName, form]);

  const onSubmit = (data: CreateRepositoryForm) => {
    createRepositoryMutation.mutate({
      projectId,
      ...data,
    });
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedRepository(null);
    form.reset();
  };

  // If not connected to GitHub
  if (!connection) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Github className="h-4 w-4 mr-2" />
              Create Repository
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>GitHub Not Connected</DialogTitle>
            <DialogDescription>
              You need to connect your GitHub account before creating repositories.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <Github className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              Connect your GitHub account to create a repository for this project and sync your code
              automatically.
            </p>
            <Button onClick={() => (window.location.href = '/api/auth/github')} className="w-full">
              <Github className="h-4 w-4 mr-2" />
              Connect GitHub
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // If repository already exists
  if (existingRepo) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Github className="h-4 w-4 mr-2" />
              View Repository
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Repository Already Exists</DialogTitle>
            <DialogDescription>This project already has a GitHub repository.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{existingRepo.name}</h4>
                <Badge variant={existingRepo.isPrivate ? 'secondary' : 'outline'}>
                  {existingRepo.isPrivate ? (
                    <>
                      <Lock className="h-3 w-3 mr-1" />
                      Private
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3 mr-1" />
                      Public
                    </>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{existingRepo.fullName}</p>
              {existingRepo.description && <p className="text-sm">{existingRepo.description}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {existingRepo.defaultBranch}
                <span className="ml-2">•</span>
                <Badge variant="outline" className="text-xs">
                  {existingRepo.syncStatus}
                </Badge>
              </div>
            </div>
            <Button onClick={() => window.open(existingRepo.htmlUrl, '_blank')} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open on GitHub
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Github className="h-4 w-4 mr-2" />
            Create Repository
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {createdRepository ? (
          // Success state
          <>
            <DialogHeader>
              <DialogTitle>Repository Created Successfully!</DialogTitle>
              <DialogDescription>
                Your repository has been created and your project files have been synced.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="border rounded-lg p-4 space-y-2 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-green-900">{createdRepository.name}</h4>
                  <Badge variant={createdRepository.isPrivate ? 'secondary' : 'outline'}>
                    {createdRepository.isPrivate ? (
                      <>
                        <Lock className="h-3 w-3 mr-1" />
                        Private
                      </>
                    ) : (
                      <>
                        <Unlock className="h-3 w-3 mr-1" />
                        Public
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-green-700">{createdRepository.fullName}</p>
                <div className="flex items-center gap-2 text-xs text-green-600">
                  <Badge variant="outline" className="text-xs bg-green-100 border-green-300">
                    {createdRepository.syncStatus}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(createdRepository.htmlUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open on GitHub
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Close
                </Button>
              </div>
            </div>
          </>
        ) : (
          // Form state
          <>
            <DialogHeader>
              <DialogTitle>Create GitHub Repository</DialogTitle>
              <DialogDescription>
                Create a new repository for your project &quot;{projectName}&quot;.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository Name</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 py-2 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                            {connection.githubUsername}/
                          </div>
                          <Input
                            placeholder="my-awesome-project"
                            className="rounded-l-none"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Only letters, numbers, dots, hyphens, and underscores are allowed.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief description of your project..."
                          className="resize-none"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPrivate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="flex items-center gap-2">
                          {field.value ? (
                            <Lock className="h-4 w-4" />
                          ) : (
                            <Unlock className="h-4 w-4" />
                          )}
                          Private Repository
                        </FormLabel>
                        <FormDescription>
                          {field.value
                            ? 'Only you can see and clone this repository.'
                            : 'Anyone can see and clone this repository.'}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createRepositoryMutation.isPending}
                    className="bg-gray-900 hover:bg-gray-800"
                  >
                    {createRepositoryMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Create Repository
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
