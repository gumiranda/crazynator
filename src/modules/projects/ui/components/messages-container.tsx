import { useMemo, useRef, useEffect } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { MessageCard } from './message-card';
import { MessageForm } from './message-form';
import { Fragment } from '@/generated/prisma';
import { useTRPC } from '@/trpc/client';
import { useRealtime } from '@inngest/realtime';
import { MessageLoading } from './message-loading';

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export const MessagesContainer = ({ projectId, activeFragment, setActiveFragment }: Props) => {
  const trpc = useTRPC();
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssitantMessageIdRef = useRef<string | null>(null);

  const realtimeData = useRealtime({ id: projectId });

  const { data: messages, isPending } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      { refetchInterval: 2500 },
    ),
  );

  const allMessages = useMemo(() => {
    const baseMessages = [...messages];
    if (realtimeData && realtimeData.data) {
      if (!baseMessages.find((message) => message.id === realtimeData.data.id)) {
        return [...baseMessages, realtimeData.data];
      }
    }
    return baseMessages;
  }, [messages, realtimeData]);

  const lastAssitantMessage = allMessages.findLast((message) => message.role === 'ASSISTANT');
  useEffect(() => {
    if (
      lastAssitantMessage?.fragment &&
      lastAssitantMessage?.id !== lastAssitantMessageIdRef.current
    ) {
      setActiveFragment(lastAssitantMessage.fragment);
      lastAssitantMessageIdRef.current = lastAssitantMessage.id;
    }
  }, [allMessages, setActiveFragment]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);
  if (isPending || !allMessages) {
    return <MessageLoading />;
  }
  const lastMessage = allMessages[allMessages.length - 1];

  const isLastMessageUser = lastMessage?.role === 'USER';

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-y-auto">
        <div className="pt-1 sm:pt-2 pr-1">
          {allMessages.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment ?? null}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={() => {
                setActiveFragment(message.fragment);
              }}
              type={message.type}
              images={message.images as string[] | undefined}
            />
          ))}
          {isLastMessageUser && <MessageLoading />}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="relative p-2 sm:p-3 pt-1">
        <div className="to-background/70 pointer-events-none absolute -top-4 sm:-top-6 right-0 left-0 h-4 sm:h-6 bg-gradient-to-b from-transparent" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};
