import { contextBridge, ipcRenderer } from 'electron';

// Definir tipos para as APIs
interface ElectronAPI {
  // Projetos
  projects: {
    getRecent: () => Promise<any[]>;
    addRecent: (project: any) => Promise<void>;
  };

  // Diálogos
  dialog: {
    openFile: () => Promise<any>;
    openFolder: () => Promise<any>;
    saveFile: (options?: any) => Promise<any>;
  };

  // Sistema de arquivos
  fs: {
    readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
    readDirectory: (path: string) => Promise<{ success: boolean; items?: any[]; error?: string }>;
  };

  // Terminal
  terminal: {
    create: (id: string, cwd?: string) => Promise<any>;
    execute: (id: string, command: string) => Promise<any>;
    kill: (id: string) => Promise<any>;
    onOutput: (callback: (id: string, data: string) => void) => void;
  };

  // Configurações
  settings: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<boolean>;
    getAll: () => Promise<any>;
  };

  // Tema
  theme: {
    set: (theme: 'light' | 'dark' | 'system') => Promise<void>;
    get: () => Promise<string>;
  };

  // Controles da janela
  window: {
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    close: () => Promise<void>;
    isMaximized: () => Promise<boolean>;
  };

  // Menu eventos
  menu: {
    onNewFile: (callback: () => void) => void;
    onOpenFile: (callback: () => void) => void;
    onOpenFolder: (callback: () => void) => void;
    onSave: (callback: () => void) => void;
    onSaveAs: (callback: () => void) => void;
    onFind: (callback: () => void) => void;
    onReplace: (callback: () => void) => void;
    onCommandPalette: (callback: () => void) => void;
    onToggleExplorer: (callback: () => void) => void;
    onToggleTerminal: (callback: () => void) => void;
    onNewTerminal: (callback: () => void) => void;
    onSplitTerminal: (callback: () => void) => void;
  };
}

// Implementar as APIs
const electronAPI: ElectronAPI = {
  projects: {
    getRecent: () => ipcRenderer.invoke('projects:get-recent'),
    addRecent: (project) => ipcRenderer.invoke('projects:add-recent', project)
  },

  dialog: {
    openFile: () => ipcRenderer.invoke('dialog:open-file'),
    openFolder: () => ipcRenderer.invoke('dialog:open-folder'),
    saveFile: (options) => ipcRenderer.invoke('dialog:save-file', options)
  },

  fs: {
    readFile: (path) => ipcRenderer.invoke('fs:read-file', path),
    writeFile: (path, content) => ipcRenderer.invoke('fs:write-file', path, content),
    readDirectory: (path) => ipcRenderer.invoke('fs:read-directory', path)
  },

  terminal: {
    create: (id, cwd) => ipcRenderer.invoke('terminal:create', id, cwd),
    execute: (id, command) => ipcRenderer.invoke('terminal:execute', id, command),
    kill: (id) => ipcRenderer.invoke('terminal:kill', id),
    onOutput: (callback) => {
      ipcRenderer.on('terminal:output', (_, id, data) => callback(id, data));
    }
  },

  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:get-all')
  },

  theme: {
    set: (theme) => ipcRenderer.invoke('theme:set', theme),
    get: () => ipcRenderer.invoke('theme:get')
  },

  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:is-maximized')
  },

  menu: {
    onNewFile: (callback) => ipcRenderer.on('menu:new-file', callback),
    onOpenFile: (callback) => ipcRenderer.on('menu:open-file', callback),
    onOpenFolder: (callback) => ipcRenderer.on('menu:open-folder', callback),
    onSave: (callback) => ipcRenderer.on('menu:save', callback),
    onSaveAs: (callback) => ipcRenderer.on('menu:save-as', callback),
    onFind: (callback) => ipcRenderer.on('menu:find', callback),
    onReplace: (callback) => ipcRenderer.on('menu:replace', callback),
    onCommandPalette: (callback) => ipcRenderer.on('menu:command-palette', callback),
    onToggleExplorer: (callback) => ipcRenderer.on('menu:toggle-explorer', callback),
    onToggleTerminal: (callback) => ipcRenderer.on('menu:toggle-terminal', callback),
    onNewTerminal: (callback) => ipcRenderer.on('menu:new-terminal', callback),
    onSplitTerminal: (callback) => ipcRenderer.on('menu:split-terminal', callback)
  }
};

// Expor APIs de forma segura
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Declaração de tipos para TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}