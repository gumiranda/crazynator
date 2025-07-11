'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export default function ClientComponent() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.devDoido.queryOptions({ text: 'falaaa dev doido PREFETCH' }),
  );
  return <div>{JSON.stringify(data)}</div>;
}
