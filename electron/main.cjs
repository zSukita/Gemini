const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'ArcanaSheet | RPG de Mesa D&D 5e',
    backgroundColor: '#090a0f',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';

  // Impedir abertura arbitrária de janelas filhas e delegar links externos ao navegador padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:') || url.startsWith('http:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Impedir navegação para origens externas não esperadas na janela do app
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      if (isDev) {
        if (parsedUrl.origin !== 'http://localhost:5173') {
          event.preventDefault();
          shell.openExternal(navigationUrl);
        }
      } else {
        if (parsedUrl.protocol !== 'file:') {
          event.preventDefault();
          shell.openExternal(navigationUrl);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Falha no carregamento da janela:', errorCode, errorDescription);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch((err) => {
      console.error('Erro ao abrir index.html:', err);
    });
  }

  // Custom menu
  const viewSubmenu = [
    { label: 'Alternar Tela Cheia', role: 'togglefullscreen' },
    { label: 'Zoom +', role: 'zoomIn' },
    { label: 'Zoom -', role: 'zoomOut' },
    { label: 'Zoom Padrão', role: 'resetZoom' },
  ];

  // Restringe ferramentas de desenvolvedor exclusivamente ao ambiente de desenvolvimento
  if (isDev) {
    viewSubmenu.push(
      { type: 'separator' },
      { label: 'Ferramentas do Desenvolvedor', role: 'toggleDevTools' }
    );
  }

  const menuTemplate = [
    {
      label: 'Jogo',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Forçar Recarregamento', role: 'forceReload' },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' },
      ],
    },
    {
      label: 'Exibir',
      submenu: viewSubmenu,
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
