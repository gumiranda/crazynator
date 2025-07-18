/* eslint-disable @typescript-eslint/no-explicit-any */
import { InngestSubscription } from '@inngest/realtime/hooks';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type Connection = InngestSubscription<any>;

type InngestConnectionStoreState = {
  connections: Map<string, Connection>;
  actions: {
    setConnection: (projectId: string, connection: Connection) => void;
    removeConnection: (projectId: string) => void;
    getConnection: (projectId: string) => Connection | undefined;
    reset: () => void;
  };
};

export const useInngestConnectionStore = createStore<InngestConnectionStoreState>()(
  immer((set, get) => ({
    connections: new Map(),
    actions: {
      setConnection: (projectId, connection) =>
        set((state) => {
          state.connections.set(projectId, connection);
        }),
      removeConnection: (projectId) =>
        set((state) => {
          state.connections.delete(projectId);
        }),
      reset: () => set({ connections: new Map() }),
      getConnection: (projectId) => get().connections.get(projectId),
    },
  })),
);
