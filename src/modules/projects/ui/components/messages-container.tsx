import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';

interface Props {
  projectId: string;
}

export const MessagesContainer = ({ projectId }: Props) => {
  const trpc = useTRPC();
  const { data: messages } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions({
      projectId,
    }),
  );
  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
    </div>
  );
};
