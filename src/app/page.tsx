import { caller } from '@/trpc/server';

export default async function Home() {
  const data = await caller.devDoido({ text: 'falaaa dev doido SERVER' });
  return <div>{JSON.stringify(data)}</div>;
}
