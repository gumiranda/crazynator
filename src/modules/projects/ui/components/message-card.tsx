import { Card, CardContent } from '@/components/ui/card';
import { Fragment, MessageRole, MessageType } from '@/generated/prisma';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ChevronRightIcon, Code2Icon } from 'lucide-react';
import Image from 'next/image';
interface UserMessageProps {
  content: string;
}
const UserMessage = ({ content }: UserMessageProps) => {
  return (
    <div className="flex justify-end pb-4 pr-2 pl-4 sm:pl-10">
      <Card className="rounded-lg bg-muted p-3 shadow-none border-none max-w-[90%] sm:max-w-[80%] break-words">
        <CardContent className="p-0">{content}</CardContent>
      </Card>
    </div>
  );
};

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}
const FragmentCard = ({ fragment, isActiveFragment, onFragmentClick }: FragmentCardProps) => {
  return (
    <button
      className={cn(
        'flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-2 sm:p-3 hover:bg-secondary transition-colors cursor-pointer',
        isActiveFragment && 'bg-primary text-primary-foreground border-primary hover:bg-primary',
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="w-3 h-3 sm:w-4 sm:h-4 mt-0.5 shrink-0" />
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-xs sm:text-sm font-medium line-clamp-1">{fragment.title}</span>
        <span className="text-xs sm:text-sm">Preview</span>
      </div>
      <div className="flex items-center justify-center mt-0.5">
        <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
      </div>
    </button>
  );
};

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}
const AssistantMessage = ({
  content,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: AssistantMessageProps) => {
  return (
    <div
      className={cn(
        'flex flex-col group px-2 sm:px-4 pb-4',
        type === 'ERROR' && 'text-red-700 dark:text-red-500',
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image src="/logo.svg" alt="Crazy Code" width={16} height={16} className="shrink-0 sm:w-[18px] sm:h-[18px]" />
        <span className="text-xs sm:text-sm font-medium">Crazy Code</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>
      <div className="pl-6 sm:pl-8.5 flex flex-col gap-y-3 sm:gap-y-4">
        <span className="text-sm sm:text-base">{content}</span>
        {fragment && type === 'RESULT' && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
};

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
}

export const MessageCard = ({
  content,
  role,
  fragment,
  createdAt,
  isActiveFragment,
  onFragmentClick,
  type,
}: MessageCardProps) => {
  if (role === 'ASSISTANT') {
    return (
      <AssistantMessage
        content={content}
        fragment={fragment}
        createdAt={createdAt}
        isActiveFragment={isActiveFragment}
        onFragmentClick={onFragmentClick}
        type={type}
      />
    );
  }
  return <UserMessage content={content} />;
};
