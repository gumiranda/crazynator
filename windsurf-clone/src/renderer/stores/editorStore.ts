import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface EditorTab {
  id: string;
  path: string;
  name: string;
  content: string;
  language: string;
  isDirty: boolean;
  isPreview: boolean;
}

interface EditorState {
  openTabs: EditorTab[];
  activeTabId: string | null;
  workspacePath: string | null;
  
  // Actions
  openFile: (path: string, content: string, language: string, isPreview?: boolean) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => Promise<void>;
  setWorkspacePath: (path: string) => void;
  renameTab: (tabId: string, newName: string) => void;
  markTabAsDirty: (tabId: string, isDirty: boolean) => void;
  promotePreviewTab: (tabId: string) => void;
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    openTabs: [],
    activeTabId: null,
    workspacePath: null,

    openFile: (path: string, content: string, language: string, isPreview = false) => {
      const { openTabs } = get();
      const existingTab = openTabs.find(tab => tab.path === path);
      
      if (existingTab) {
        // Se a aba já existe, apenas ative ela
        set({ activeTabId: existingTab.id });
        return;
      }

      // Se estamos abrindo uma preview e já existe uma preview, substitua
      if (isPreview) {
        const previewTabIndex = openTabs.findIndex(tab => tab.isPreview);
        if (previewTabIndex !== -1) {
          const newTabs = [...openTabs];
          const tabId = `tab-${Date.now()}-${Math.random()}`;
          const newTab: EditorTab = {
            id: tabId,
            path,
            name: path.split('/').pop() || 'Untitled',
            content,
            language,
            isDirty: false,
            isPreview: true
          };
          
          newTabs[previewTabIndex] = newTab;
          set({ 
            openTabs: newTabs,
            activeTabId: tabId 
          });
          return;
        }
      }

      // Criar nova aba
      const tabId = `tab-${Date.now()}-${Math.random()}`;
      const newTab: EditorTab = {
        id: tabId,
        path,
        name: path.split('/').pop() || 'Untitled',
        content,
        language,
        isDirty: false,
        isPreview
      };

      set(state => ({
        openTabs: [...state.openTabs, newTab],
        activeTabId: tabId
      }));
    },

    closeTab: (tabId: string) => {
      const { openTabs, activeTabId } = get();
      const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
      
      if (tabIndex === -1) return;

      const newTabs = openTabs.filter(tab => tab.id !== tabId);
      let newActiveTabId = activeTabId;

      // Se fechamos a aba ativa, escolher uma nova aba ativa
      if (activeTabId === tabId) {
        if (newTabs.length > 0) {
          // Escolher a aba anterior ou a próxima
          const nextIndex = Math.min(tabIndex, newTabs.length - 1);
          newActiveTabId = newTabs[nextIndex]?.id || null;
        } else {
          newActiveTabId = null;
        }
      }

      set({
        openTabs: newTabs,
        activeTabId: newActiveTabId
      });
    },

    setActiveTab: (tabId: string) => {
      set({ activeTabId: tabId });
    },

    updateTabContent: (tabId: string, content: string) => {
      set(state => ({
        openTabs: state.openTabs.map(tab =>
          tab.id === tabId 
            ? { ...tab, content, isDirty: tab.content !== content }
            : tab
        )
      }));
    },

    saveTab: async (tabId: string) => {
      const { openTabs } = get();
      const tab = openTabs.find(t => t.id === tabId);
      
      if (!tab) return;

      try {
        const result = await window.electronAPI.fs.writeFile(tab.path, tab.content);
        
        if (result.success) {
          set(state => ({
            openTabs: state.openTabs.map(t =>
              t.id === tabId ? { ...t, isDirty: false } : t
            )
          }));
        } else {
          console.error('Erro ao salvar arquivo:', result.error);
        }
      } catch (error) {
        console.error('Erro ao salvar arquivo:', error);
      }
    },

    setWorkspacePath: (path: string) => {
      set({ workspacePath: path });
    },

    renameTab: (tabId: string, newName: string) => {
      set(state => ({
        openTabs: state.openTabs.map(tab =>
          tab.id === tabId ? { ...tab, name: newName } : tab
        )
      }));
    },

    markTabAsDirty: (tabId: string, isDirty: boolean) => {
      set(state => ({
        openTabs: state.openTabs.map(tab =>
          tab.id === tabId ? { ...tab, isDirty } : tab
        )
      }));
    },

    promotePreviewTab: (tabId: string) => {
      set(state => ({
        openTabs: state.openTabs.map(tab =>
          tab.id === tabId ? { ...tab, isPreview: false } : tab
        )
      }));
    }
  }))
);