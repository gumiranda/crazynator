import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/TitleBar';
import Sidebar from './components/Sidebar';
import Explorer from './components/Explorer';
import Editor from './components/Editor';
import Terminal from './components/Terminal';
import CommandPalette from './components/CommandPalette';
import StatusBar from './components/StatusBar';
import WelcomeTab from './components/WelcomeTab';
import { useEditorStore } from './stores/editorStore';
import { useUIStore } from './stores/uiStore';
import { useTerminalStore } from './stores/terminalStore';
import './App.css';

const App: React.FC = () => {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const { openTabs, activeTabId } = useEditorStore();
  const { 
    sidebarCollapsed, 
    explorerVisible, 
    terminalVisible,
    setSidebarCollapsed,
    setExplorerVisible,
    setTerminalVisible 
  } = useUIStore();
  const { createTerminal } = useTerminalStore();

  useEffect(() => {
    // Configurar listeners de menu
    const setupMenuListeners = () => {
      window.electronAPI.menu.onCommandPalette(() => {
        setIsCommandPaletteOpen(true);
      });

      window.electronAPI.menu.onToggleExplorer(() => {
        setExplorerVisible(!explorerVisible);
      });

      window.electronAPI.menu.onToggleTerminal(() => {
        setTerminalVisible(!terminalVisible);
      });

      window.electronAPI.menu.onNewTerminal(() => {
        createTerminal();
        setTerminalVisible(true);
      });

      window.electronAPI.menu.onNewFile(() => {
        // Implementar criação de novo arquivo
        console.log('Novo arquivo');
      });

      window.electronAPI.menu.onOpenFile(() => {
        // Implementar abertura de arquivo
        console.log('Abrir arquivo');
      });

      window.electronAPI.menu.onOpenFolder(() => {
        // Implementar abertura de pasta
        console.log('Abrir pasta');
      });

      window.electronAPI.menu.onSave(() => {
        // Implementar salvamento
        console.log('Salvar');
      });

      window.electronAPI.menu.onSaveAs(() => {
        // Implementar salvar como
        console.log('Salvar como');
      });

      window.electronAPI.menu.onFind(() => {
        // Implementar busca
        console.log('Buscar');
      });

      window.electronAPI.menu.onReplace(() => {
        // Implementar substituir
        console.log('Substituir');
      });
    };

    setupMenuListeners();
  }, [explorerVisible, terminalVisible, setExplorerVisible, setTerminalVisible, createTerminal]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P - Command Palette
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }

      // Ctrl/Cmd + ` - Toggle Terminal
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setTerminalVisible(!terminalVisible);
      }

      // Ctrl/Cmd + B - Toggle Sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarCollapsed(!sidebarCollapsed);
      }

      // Ctrl/Cmd + Shift + E - Toggle Explorer
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        setExplorerVisible(!explorerVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [terminalVisible, sidebarCollapsed, explorerVisible, setTerminalVisible, setSidebarCollapsed, setExplorerVisible]);

  const hasActiveTab = openTabs.length > 0 && activeTabId;

  return (
    <div className="app">
      <TitleBar />
      
      <div className="app-body">
        <Sidebar />
        
        <AnimatePresence>
          {explorerVisible && !sidebarCollapsed && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 300 }}
              exit={{ width: 0 }}
              transition={{ duration: 0.2 }}
              className="explorer-panel"
            >
              <Explorer />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="main-content">
          <div className="editor-area">
            {hasActiveTab ? (
              <Editor />
            ) : (
              <WelcomeTab />
            )}
          </div>

          <AnimatePresence>
            {terminalVisible && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 300 }}
                exit={{ height: 0 }}
                transition={{ duration: 0.2 }}
                className="terminal-panel"
              >
                <Terminal />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <StatusBar />

      <AnimatePresence>
        {isCommandPaletteOpen && (
          <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;