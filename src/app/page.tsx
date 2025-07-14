'use client';

import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectItem,
  SelectContent,
  SelectValue,
  SelectTrigger,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [projectId, setProjectId] = useState('');
  const trpc = useTRPC();
  const { data: projects } = useQuery(trpc.projects.getMany.queryOptions());
  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());
  const invoke = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <Select value={projectId} onValueChange={(value) => setProjectId(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input value={value} onChange={(e) => setValue(e.target.value)} />
        <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ value })}>
          {invoke.isPending ? 'Invoking...' : 'Invoke'}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {messages?.map((message) => (
          <div key={message.id}>{message.content}</div>
        ))}
      </div>
    </div>
  );
}
