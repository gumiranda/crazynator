import { Fragment, MessageRole, MessageType } from '@/generated/prisma';

interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment;
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
  return <div>MessageCard</div>;
};
