'use client';

import { Button } from '@/components/ui/button';
import { useTRPC } from '@/trpc/client';

export default function Home() {
  const trpc = useTRPC();
  trpc.devDoido.queryOptions({ text: 'falaaa dev doido' });
  return (
    <div>
      <Button>Hello World</Button>
    </div>
  );
}
