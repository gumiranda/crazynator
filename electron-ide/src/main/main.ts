import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import * as path from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import windowStateKeeper from 'electron-window-state';
import contextMenu from 'electron-context-menu';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';

// Configuração do store para persistir dados
const store = new Store();

// Context menu customizado
contextMenu({
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  prepend: (defaultActions, params, browserWindow) => [
    {
      label: 'Inspecionar elemento',
      click: () => {
        browserWindow.webContents.inspectElement(params.x, params.y);
      }
    }
  ]
});

class MainWindow {
  private window: BrowserWindow | null = null;

  constructor() {
    this.createWindow();
  }

  private createWindow(): void {
    // Gerenciar estado da janela
    const mainWindowState = windowStateKeeper({
      defaultWidth: 1400,
      defaultHeight: 900
    });

    // Criar janela principal
    this.window = new BrowserWindow({
      x: mainWindowState.x,
      y: mainWindowState.y,
      width: mainWindowState.width,
      height: mainWindowState.height,
      minWidth: 800,
      minHeight: 600,
      show: false,
      autoHideMenuBar: true,
      titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
      webPreferences: {
        preload: path.join(__dirname, '../preload/preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    // Gerenciar estado da janela
    mainWindowState.manage(this.window);

    this.window.on('ready-to-show', () => {
      this.window?.show();
      
      if (is.dev) {
        this.window?.webContents.openDevTools();
      }
    });

    this.window.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    // Carregar aplicação
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.window.loadURL(process.env['ELECTRON_RENDERER_URL']);
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.setupIpcHandlers();
  }

  private setupIpcHandlers(): void {
    // Handler para integração com sistema Crazy Code
    ipcMain.handle('crazy-code:get-projects', async () => {
      try {
        // Integração com API do sistema atual
        const projects = store.get('projects', []);
        return projects;
      } catch (error) {
        console.error('Erro ao buscar projetos:', error);
        return [];
      }
    });

    ipcMain.handle('crazy-code:save-project', async (_, project) => {
      try {
        const projects = store.get('projects', []) as any[];
        const existingIndex = projects.findIndex(p => p.id === project.id);
        
        if (existingIndex >= 0) {
          projects[existingIndex] = project;
        } else {
          projects.push(project);
        }
        
        store.set('projects', projects);
        return { success: true };
      } catch (error) {
        console.error('Erro ao salvar projeto:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('crazy-code:open-file-dialog', async () => {
      const result = await dialog.showOpenDialog(this.window!, {
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Todos os arquivos', extensions: ['*'] },
          { name: 'JavaScript', extensions: ['js', 'jsx'] },
          { name: 'TypeScript', extensions: ['ts', 'tsx'] },
          { name: 'Python', extensions: ['py'] },
          { name: 'HTML', extensions: ['html', 'htm'] },
          { name: 'CSS', extensions: ['css', 'scss', 'sass'] },
          { name: 'JSON', extensions: ['json'] }
        ]
      });
      
      return result;
    });

    ipcMain.handle('crazy-code:open-folder-dialog', async () => {
      const result = await dialog.showOpenDialog(this.window!, {
        properties: ['openDirectory']
      });
      
      return result;
    });

    ipcMain.handle('crazy-code:save-file-dialog', async (_, defaultPath?: string) => {
      const result = await dialog.showSaveDialog(this.window!, {
        defaultPath,
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

    // Handler para configurações
    ipcMain.handle('settings:get', (_, key: string) => {
      return store.get(key);
    });

    ipcMain.handle('settings:set', (_, key: string, value: any) => {
      store.set(key, value);
      return true;
    });

    // Handler para terminal
    ipcMain.handle('terminal:execute', async (_, command: string) => {
      try {
        const { spawn } = require('child_process');
        const child = spawn(command, { shell: true });
        
        return new Promise((resolve, reject) => {
          let output = '';
          let error = '';
          
          child.stdout.on('data', (data: Buffer) => {
            output += data.toString();
          });
          
          child.stderr.on('data', (data: Buffer) => {
            error += data.toString();
          });
          
          child.on('close', (code: number) => {
            resolve({ output, error, code });
          });
          
          child.on('error', (err: Error) => {
            reject(err);
          });
        });
      } catch (error) {
        return { output: '', error: error.message, code: 1 };
      }
    });
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }
}

// Menu da aplicação
function createMenu(): void {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Novo Projeto',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.getWindow()?.webContents.send('menu:new-project');
          }
        },
        {
          label: 'Abrir Projeto',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.getWindow()?.webContents.send('menu:open-project');
          }
        },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.getWindow()?.webContents.send('menu:save');
          }
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
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
        { role: 'selectall', label: 'Selecionar Tudo' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { role: 'reload', label: 'Recarregar' },
        { role: 'forceReload', label: 'Forçar Recarregamento' },
        { role: 'toggleDevTools', label: 'Ferramentas do Desenvolvedor' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Zoom Real' },
        { role: 'zoomIn', label: 'Aumentar Zoom' },
        { role: 'zoomOut', label: 'Diminuir Zoom' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Tela Cheia' }
      ]
    },
    {
      label: 'Janela',
      submenu: [
        { role: 'minimize', label: 'Minimizar' },
        { role: 'close', label: 'Fechar' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre Crazy Code IDE',
          click: () => {
            dialog.showMessageBox(mainWindow.getWindow()!, {
              type: 'info',
              title: 'Sobre',
              message: 'Crazy Code IDE',
              detail: 'IDE baseada no VS Code integrada com o sistema Crazy Code\nVersão 1.0.0'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template as any);
  Menu.setApplicationMenu(menu);
}

let mainWindow: MainWindow;

// Configurações do app
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.crazycode.ide');

  // Verificações de segurança
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Criar janela principal
  mainWindow = new MainWindow();
  
  // Criar menu
  createMenu();

  // Auto updater (apenas em produção)
  if (!is.dev) {
    autoUpdater.checkForUpdatesAndNotify();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = new MainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Eventos de segurança
app.on('web-contents-created', (_, contents) => {
  contents.on('new-window', (navigationEvent) => {
    navigationEvent.preventDefault();
  });
});