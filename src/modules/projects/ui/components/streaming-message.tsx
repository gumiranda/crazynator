import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useInngest } from '@/components/ui/inngest-provider';

interface StreamingMessageProps {
  messageId: string;
  projectId: string;
  initialContent?: string;
}

export const StreamingMessage = ({ 
  messageId, 
  projectId, 
  initialContent = '' 
}: StreamingMessageProps) => {
  const [streamingContent, setStreamingContent] = useState(initialContent);
  const [toolStatus, setToolStatus] = useState<string>('');
  const [isComplete, setIsComplete] = useState(false);
  const { latestData } = useInngest();

  useEffect(() => {
    if (latestData?.topic === 'streaming') {
      const streamingData = latestData.data;
      
      if (streamingData?.messageId === messageId) {
        if (streamingData.type === 'response') {
          setStreamingContent(streamingData.content);
          setToolStatus('');
        } else if (streamingData.type === 'tool_use') {
          setToolStatus(streamingData.content);
        }
      }
    } else if (latestData?.topic === 'realtime') {
      // When we get a final message, mark streaming as complete
      const realtimeData = latestData.data;
      if (realtimeData?.projectId === projectId && realtimeData?.type === 'RESULT') {
        setIsComplete(true);
      }
    }
  }, [latestData, messageId, projectId]);

  // Don't render if completed (final message will be shown instead)
  if (isComplete) {
    return null;
  }

  return (
    <div className="flex flex-col group px-2 sm:px-2 pb-4">
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image 
          src="/logo.svg" 
          alt="Crazy Code" 
          width={16} 
          height={16} 
          className="shrink-0 sm:w-[18px] sm:h-[18px]" 
        />
        <span className="text-xs sm:text-sm font-medium">Crazy Code</span>
      </div>
      
      <div className="pl-6 sm:pl-8.5 flex flex-col gap-y-3 sm:gap-y-4">
        {/* Tool status indicator */}
        {toolStatus && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>{toolStatus}</span>
          </div>
        )}
        
        {/* Streaming content */}
        {streamingContent && (
          <div className="text-sm sm:text-base">
            <StreamingText content={streamingContent} />
          </div>
        )}
        
        {/* Cursor indicator when streaming */}
        {!toolStatus && (
          <div className="inline-flex">
            <div className="w-2 h-4 bg-primary animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
};

// Component to simulate typewriter effect for streaming text
const StreamingText = ({ content }: { content: string }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < content.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(content.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
             }, 50); // Adjust speed here (lower = faster)

      return () => clearTimeout(timer);
    }
  }, [content, currentIndex]);

  // When content changes (new chunk received), continue from where we left off
  useEffect(() => {
    if (content.length > displayedContent.length) {
      // New content received, continue streaming
      setCurrentIndex(displayedContent.length);
    }
  }, [content, displayedContent.length]);

  return (
    <div className="whitespace-pre-wrap">
      {displayedContent}
      {currentIndex < content.length && (
        <span className="animate-pulse">|</span>
      )}
    </div>
  );
};