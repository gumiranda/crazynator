'use client';

import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [value, setValue] = useState('');
  const trpc = useTRPC();
  const { data: messages } = useQuery(trpc.messages.getMany.queryOptions());
  const invoke = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => toast.success('Message created'),
      onError: (error) => toast.error(error.message),
    }),
  );
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ value })}>
        Invoke Background Job
      </Button>
      <div className="flex flex-col gap-2">
        {messages?.map((message) => (
          <div key={message.id}>{message.content}</div>
        ))}
      </div>
    </div>
  );
}
