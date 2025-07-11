'use client';

import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { toast } from 'sonner';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [value, setValue] = useState('');
  const trpc = useTRPC();
  const invoke = useMutation(
    trpc.invoke.mutationOptions({
      onSuccess: () => toast.success('Background job invoked'),
      onError: (error) => toast.error(error.message),
    }),
  );
  return (
    <div className="p-4 max-w-7xl mx-auto">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button disabled={invoke.isPending} onClick={() => invoke.mutate({ value })}>
        Invoke Background Job
      </Button>
    </div>
  );
}
