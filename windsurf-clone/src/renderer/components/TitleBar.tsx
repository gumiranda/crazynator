import React, { useState, useEffect } from 'react';
import { Minus, Square, X, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  useEffect(() => {
    // Verificar estado inicial da janela
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.window.isMaximized();
      setIsMaximized(maximized);
    };

    checkMaximized();
  }, []);

  const handleMinimize = () => {
    window.electronAPI.window.minimize();
  };

  const handleMaximize = () => {
    window.electronAPI.window.maximize();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI.window.close();
  };

  return (
    <div className="titlebar">
      <div className="titlebar-drag-region">
        <div className="titlebar-left">
          <div className="app-icon">
            <Menu className="h-4 w-4" />
          </div>
          <div className="app-title">Windsurf Clone</div>
        </div>

        <div className="titlebar-center">
          {/* Aqui pode ir breadcrumbs ou outros elementos centrais */}
        </div>

        <div className="titlebar-right">
          <motion.button
            className={`titlebar-button minimize ${isHovered === 'minimize' ? 'hovered' : ''}`}
            onClick={handleMinimize}
            onMouseEnter={() => setIsHovered('minimize')}
            onMouseLeave={() => setIsHovered(null)}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Minus className="h-3 w-3" />
          </motion.button>

          <motion.button
            className={`titlebar-button maximize ${isHovered === 'maximize' ? 'hovered' : ''}`}
            onClick={handleMaximize}
            onMouseEnter={() => setIsHovered('maximize')}
            onMouseLeave={() => setIsHovered(null)}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Square className="h-3 w-3" />
          </motion.button>

          <motion.button
            className={`titlebar-button close ${isHovered === 'close' ? 'hovered' : ''}`}
            onClick={handleClose}
            onMouseEnter={() => setIsHovered('close')}
            onMouseLeave={() => setIsHovered(null)}
            whileHover={{ backgroundColor: '#e81123' }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;