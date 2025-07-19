'use client';

import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useCurrentTheme } from '@/hooks/use-current-theme';
import { SettingsDialog } from '@/modules/user-settings/ui/settings-dialog';

type UserControlProps = {
  showName?: boolean;
};

export default function UserControl({ showName = false }: UserControlProps) {
  const currentTheme = useCurrentTheme();

  return (
    <div className="flex items-center space-x-2">
      <SettingsDialog />
      <UserButton
        showName={showName}
        appearance={{
          elements: {
            userButtonBox: 'rounded-md!',
            userButtonAvatarBox: 'rounded-md! size-8!',
            userButtonTrigger: 'rounded-md!',
          },
          baseTheme: currentTheme === 'dark' ? dark : undefined,
        }}
      />
    </div>
  );
}
