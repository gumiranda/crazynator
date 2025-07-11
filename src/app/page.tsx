'use client';

import { useTRPC } from '@/trpc/client';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.devDoido.queryOptions({ text: 'falaaa dev doido' }));
  return <div>{JSON.stringify(data)}</div>;
}
