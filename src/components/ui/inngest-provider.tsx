/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useInngestSubscription, InngestSubscription } from '@inngest/realtime/hooks';
import { useTRPC } from '@/trpc/client';

type InngestContextType = InngestSubscription<any>;

const InngestContext = React.createContext<InngestContextType | null>(null);

export const InngestProvider = ({
  children,
  projectId,
}: {
  children: React.ReactNode;
  projectId: string;
}) => {
  const [hasMounted, setHasMounted] = useState(false);

  const trpc = useTRPC();

  const { mutateAsync: generateToken } = useMutation(
    trpc.projects.generateSubscriptionToken.mutationOptions(),
  );

  const value = useInngestSubscription({
    refreshToken: () => generateToken({ projectId }),
    topics: ['realtime', 'streaming'],
  });

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return <div>Loading...</div>;

  return <InngestContext.Provider value={value}>{children}</InngestContext.Provider>;
};

export const useInngest = () => {
  const context = React.useContext(InngestContext);
  if (!context) {
    throw new Error('useInngest must be used within InngestProvider');
  }
  return context;
};
