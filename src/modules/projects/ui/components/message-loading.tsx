import Image from 'next/image';
import { useEffect, useState } from 'react';

const ShimmerMessages = () => {
  const messages = [
    'Thinking...',
    'Brainstorming...',
    'Creating...',
    'Building...',
    'Almost done...',
    'Wait a minute',
    'Let me think...',
    'I need to think...',
  ];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [messages.length]);
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm sm:text-base text-muted-foreground animate-pulse">
        {messages[currentMessageIndex]}
      </span>
    </div>
  );
};
export const MessageLoading = () => {
  return (
    <div className="flex flex-col group px-2 sm:px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image src="/logo.svg" alt="Crazy Code" width={16} height={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
        <span className="text-xs sm:text-sm font-medium">Crazy Code</span>
      </div>
      <div className="pl-6 sm:pl-8.5 flex flex-col gap-y-3 sm:gap-y-4">
        <ShimmerMessages />
      </div>
    </div>
  );
};
