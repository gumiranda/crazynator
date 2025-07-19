import { useTRPC } from '@/trpc/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { MessageCard } from './message-card';
import { MessageForm } from './message-form';
import { useRef, useEffect, useMemo, useState } from 'react';

import { Fragment } from '@/generated/prisma';

import { MessageLoading } from './message-loading';
import { StreamingMessage } from './streaming-message';
import { useInngest } from '@/components/ui/inngest-provider';

interface Props {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (fragment: Fragment | null) => void;
}

export const MessagesContainer = ({ projectId, activeFragment, setActiveFragment }: Props) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssitantMessageIdRef = useRef<string | null>(null);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);

  const trpc = useTRPC();
  const { latestData: realtimeData } = useInngest();

  const { data: messages, isPending } = useSuspenseQuery(
    trpc.messages.getMany.queryOptions(
      {
        projectId,
      },
      { refetchInterval: Infinity },
    ),
  );
  const allMessages = useMemo(() => {
    const baseMessages = [...messages];
    if (realtimeData && realtimeData.data && realtimeData.topic === 'realtime') {
      if (!baseMessages.find((message) => message.id === realtimeData.data.id)) {
        return [...baseMessages, realtimeData.data];
      }
    }
    return baseMessages;
  }, [messages, realtimeData]);
  useEffect(() => {
    const lastAssitantMessage = allMessages.findLast((message) => message.role === 'ASSISTANT');
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

  // Track streaming messages
  useEffect(() => {
    if (realtimeData?.topic === 'streaming') {
      const streamingData = realtimeData.data;
      if (streamingData?.messageId && !streamingMessageId) {
        setStreamingMessageId(streamingData.messageId);
      }
    } else if (realtimeData?.topic === 'realtime') {
      // When we get a final message, clear streaming state
      if (streamingMessageId) {
        setStreamingMessageId(null);
      }
    }
  }, [realtimeData, streamingMessageId]);
  if (isPending || !allMessages) {
    return <div>Loading...</div>;
  }
  const lastMessage = allMessages[allMessages.length - 1];

  const isLastMessageUser = lastMessage?.role === 'USER';
  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
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
            />
          ))}
          {isLastMessageUser && !streamingMessageId && <MessageLoading />}
          {streamingMessageId && (
            <StreamingMessage
              messageId={streamingMessageId}
              projectId={projectId}
            />
          )}
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
