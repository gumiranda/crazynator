import SandboxPreview from '@/components/SandboxPreview';
import { Fragment } from '@prisma/client';

type FragmentPreviewProps = {
  fragment: Fragment;
  onRefresh?: () => void;
};

export default function FragmentPreview({ fragment, onRefresh }: FragmentPreviewProps) {
  const handleSandboxRecreated = (newUrl: string) => {
    console.log('Sandbox recreated with new URL:', newUrl);
    // The fragment will be automatically updated in the database
    // The parent component should refetch data to get the updated fragment
    onRefresh?.();
  };

  return (
    <SandboxPreview
      fragment={fragment}
      onRefresh={onRefresh}
      onSandboxRecreated={handleSandboxRecreated}
    />
  );
}
