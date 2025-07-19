import { app, BrowserWindow, Menu, ipcMain, dialog, shell, nativeTheme } from 'electron';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import Store from 'electron-store';
import windowStateKeeper from 'electron-window-state';
import { autoUpdater } from 'electron-updater';

// Store para persistir configurações
const store = new Store();

interface Project {
  id: string;
  name: string;
  path: string;
  lastOpened: Date;
  type: 'folder' | 'file';
}

interface Terminal {
  id: string;
  name: string;
  cwd: string;
  process?: ChildProcess;
}

class WindsurfMain {
  private mainWindow: BrowserWindow | null = null;
  private terminals: Map<string, Terminal> = new Map();

  constructor() {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    await app.whenReady();
    
    // Configurações de segurança
    app.on('web-contents-created', (_, contents) => {
      contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
        shell.openExternal(navigationUrl);
      });
    });

    this.createMainWindow();
    this.setupIpcHandlers();
    this.createApplicationMenu();

    // Auto updater em produção
    if (app.isPackaged) {
      autoUpdater.checkForUpdatesAndNotify();
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  }

  private createMainWindow(): void {
    // Gerenciar estado da janela
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1400,
      defaultHeight: 900
    });

    this.mainWindow = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 1000,
      minHeight: 700,
      show: false,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden',
      titleBarOverlay: process.platform === 'win32' ? {
        color: '#1e1e1e',
        symbolColor: '#ffffff',
        height: 30
      } : undefined,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: path.join(__dirname, '../preload/preload.js'),
        webSecurity: true
      }
    });

    mainWindowState.manage(this.mainWindow);

    // Tema escuro por padrão (como o Windsurf)
    nativeTheme.themeSource = 'dark';

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show();
      
      if (!app.isPackaged) {
        this.mainWindow?.webContents.openDevTools();
      }
    });

    this.mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url);
      return { action: 'deny' };
    });

    // Carregar a aplicação
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.loadURL('http://localhost:5173');
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }
  }

  private setupIpcHandlers(): void {
    // Gerenciamento de projetos
    ipcMain.handle('projects:get-recent', () => {
      return store.get('recentProjects', []);
    });

    ipcMain.handle('projects:add-recent', (_, project: Project) => {
      const recent = store.get('recentProjects', []) as Project[];
      const filtered = recent.filter(p => p.path !== project.path);
      filtered.unshift(project);
      store.set('recentProjects', filtered.slice(0, 10)); // Manter apenas 10 recentes
    });

    // Diálogos de arquivo
    ipcMain.handle('dialog:open-file', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'JavaScript/TypeScript', extensions: ['js', 'jsx', 'ts', 'tsx'] },
          { name: 'Python', extensions: ['py', 'pyw'] },
          { name: 'Web', extensions: ['html', 'css', 'scss', 'vue', 'svelte'] },
          { name: 'Configuração', extensions: ['json', 'yaml', 'yml', 'toml', 'xml'] },
          { name: 'Markdown', extensions: ['md', 'mdx'] }
        ]
      });
      return result;
    });

    ipcMain.handle('dialog:open-folder', async () => {
      const result = await dialog.showOpenDialog(this.mainWindow!, {
        properties: ['openDirectory']
      });
      return result;
    });

    ipcMain.handle('dialog:save-file', async (_, options = {}) => {
      const result = await dialog.showSaveDialog(this.mainWindow!, {
        ...options,
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js'] },
          { name: 'TypeScript', extensions: ['ts'] },
          { name: 'Python', extensions: ['py'] },
          { name: 'HTML', extensions: ['html'] },
          { name: 'CSS', extensions: ['css'] },
          { name: 'JSON', extensions: ['json'] }
        ]
      });
      return result;
    });

    // Sistema de arquivos
    ipcMain.handle('fs:read-file', async (_, filePath: string) => {
      try {
        const fs = require('fs').promises;
        const content = await fs.readFile(filePath, 'utf8');
        return { success: true, content };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('fs:write-file', async (_, filePath: string, content: string) => {
      try {
        const fs = require('fs').promises;
        await fs.writeFile(filePath, content, 'utf8');
        return { success: true };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('fs:read-directory', async (_, dirPath: string) => {
      try {
        const fs = require('fs').promises;
        const path = require('path');
        const items = await fs.readdir(dirPath, { withFileTypes: true });
        
        const result = await Promise.all(
          items.map(async (item) => {
            const fullPath = path.join(dirPath, item.name);
            let stats;
            try {
              stats = await fs.stat(fullPath);
            } catch {
              stats = null;
            }
            
            return {
              name: item.name,
              path: fullPath,
              isDirectory: item.isDirectory(),
              isFile: item.isFile(),
              size: stats?.size || 0,
              modified: stats?.mtime || new Date()
            };
          })
        );
        
        return { success: true, items: result };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    // Terminal
    ipcMain.handle('terminal:create', (_, terminalId: string, cwd: string = process.cwd()) => {
      const terminal: Terminal = {
        id: terminalId,
        name: `Terminal ${terminalId}`,
        cwd
      };
      
      this.terminals.set(terminalId, terminal);
      return { success: true, terminal };
    });

    ipcMain.handle('terminal:execute', async (_, terminalId: string, command: string) => {
      const terminal = this.terminals.get(terminalId);
      if (!terminal) {
        return { success: false, error: 'Terminal não encontrado' };
      }

      try {
        return new Promise((resolve) => {
          const child = spawn(command, {
            shell: true,
            cwd: terminal.cwd,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let output = '';
          let error = '';

          child.stdout?.on('data', (data) => {
            output += data.toString();
            this.mainWindow?.webContents.send('terminal:output', terminalId, data.toString());
          });

          child.stderr?.on('data', (data) => {
            error += data.toString();
            this.mainWindow?.webContents.send('terminal:output', terminalId, data.toString());
          });

          child.on('close', (code) => {
            resolve({ success: true, output, error, exitCode: code });
          });

          child.on('error', (err) => {
            resolve({ success: false, error: err.message });
          });

          // Salvar processo para poder matá-lo depois
          terminal.process = child;
        });
      } catch (error) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('terminal:kill', (_, terminalId: string) => {
      const terminal = this.terminals.get(terminalId);
      if (terminal?.process) {
        terminal.process.kill();
        return { success: true };
      }
      return { success: false, error: 'Processo não encontrado' };
    });

    // Configurações
    ipcMain.handle('settings:get', (_, key: string) => {
      return store.get(key);
    });

    ipcMain.handle('settings:set', (_, key: string, value: any) => {
      store.set(key, value);
      return true;
    });

    ipcMain.handle('settings:get-all', () => {
      return store.store;
    });

    // Tema
    ipcMain.handle('theme:set', (_, theme: 'light' | 'dark' | 'system') => {
      nativeTheme.themeSource = theme;
      store.set('theme', theme);
    });

    ipcMain.handle('theme:get', () => {
      return store.get('theme', 'dark');
    });

    // Window controls
    ipcMain.handle('window:minimize', () => {
      this.mainWindow?.minimize();
    });

    ipcMain.handle('window:maximize', () => {
      if (this.mainWindow?.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow?.maximize();
      }
    });

    ipcMain.handle('window:close', () => {
      this.mainWindow?.close();
    });

    ipcMain.handle('window:is-maximized', () => {
      return this.mainWindow?.isMaximized() || false;
    });
  }

  private createApplicationMenu(): void {
    const template = [
      {
        label: 'Arquivo',
        submenu: [
          {
            label: 'Novo Arquivo',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.mainWindow?.webContents.send('menu:new-file')
          },
          {
            label: 'Nova Janela',
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => this.createMainWindow()
          },
          { type: 'separator' },
          {
            label: 'Abrir Arquivo...',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.mainWindow?.webContents.send('menu:open-file')
          },
          {
            label: 'Abrir Pasta...',
            accelerator: 'CmdOrCtrl+K CmdOrCtrl+O',
            click: () => this.mainWindow?.webContents.send('menu:open-folder')
          },
          { type: 'separator' },
          {
            label: 'Salvar',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.mainWindow?.webContents.send('menu:save')
          },
          {
            label: 'Salvar Como...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.mainWindow?.webContents.send('menu:save-as')
          },
          { type: 'separator' },
          {
            label: 'Sair',
            accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
            click: () => app.quit()
          }
        ]
      },
      {
        label: 'Editar',
        submenu: [
          { role: 'undo', label: 'Desfazer' },
          { role: 'redo', label: 'Refazer' },
          { type: 'separator' },
          { role: 'cut', label: 'Recortar' },
          { role: 'copy', label: 'Copiar' },
          { role: 'paste', label: 'Colar' },
          { role: 'selectall', label: 'Selecionar Tudo' },
          { type: 'separator' },
          {
            label: 'Localizar',
            accelerator: 'CmdOrCtrl+F',
            click: () => this.mainWindow?.webContents.send('menu:find')
          },
          {
            label: 'Localizar e Substituir',
            accelerator: 'CmdOrCtrl+H',
            click: () => this.mainWindow?.webContents.send('menu:replace')
          }
        ]
      },
      {
        label: 'Visualizar',
        submenu: [
          {
            label: 'Paleta de Comandos',
            accelerator: 'CmdOrCtrl+Shift+P',
            click: () => this.mainWindow?.webContents.send('menu:command-palette')
          },
          { type: 'separator' },
          {
            label: 'Explorer',
            accelerator: 'CmdOrCtrl+Shift+E',
            click: () => this.mainWindow?.webContents.send('menu:toggle-explorer')
          },
          {
            label: 'Terminal',
            accelerator: 'CmdOrCtrl+`',
            click: () => this.mainWindow?.webContents.send('menu:toggle-terminal')
          },
          { type: 'separator' },
          { role: 'reload', label: 'Recarregar' },
          { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Tela Cheia' }
        ]
      },
      {
        label: 'Terminal',
        submenu: [
          {
            label: 'Novo Terminal',
            accelerator: 'CmdOrCtrl+Shift+`',
            click: () => this.mainWindow?.webContents.send('menu:new-terminal')
          },
          {
            label: 'Dividir Terminal',
            accelerator: 'CmdOrCtrl+\\',
            click: () => this.mainWindow?.webContents.send('menu:split-terminal')
          }
        ]
      },
      {
        label: 'Ajuda',
        submenu: [
          {
            label: 'Sobre',
            click: () => {
              dialog.showMessageBox(this.mainWindow!, {
                type: 'info',
                title: 'Sobre Windsurf Clone',
                message: 'Windsurf Clone',
                detail: 'Clone do Windsurf IDE construído com Electron\nVersão 1.0.0'
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }
}

// Inicializar aplicação
new WindsurfMain();