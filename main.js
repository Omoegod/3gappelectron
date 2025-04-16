const { app, BrowserWindow, ipcMain } = require('electron');

const { loadConfig, saveConfig } = require('./renderer/js/modemConfig.js');
const SerialPort = require('serialport');

const isDevMode = process.env.NODE_ENV === 'development';

let settingsWindow;

ipcMain.handle('get-com-ports', async () => {
  console.log('get-com-ports event received');
  try {
      const ports = await SerialPort.SerialPort.list(); 
      console.log('Available COM ports:', ports);
      return ports.map(port => port.path); 
  } catch (error) {
      console.error('Ошибка при получении списка COM-портов:', error);
      return [];
  }
});

ipcMain.on('open-settings-window', () => {
  console.log('open-settings-window event received');
  if (!settingsWindow) {
    settingsWindow = new BrowserWindow({
      width: 800,
      height: 590,
      title: 'Настройки подключения',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    settingsWindow.loadFile('settings.html');

    settingsWindow.on('closed', () => {
      settingsWindow = null;
    });

    settingsWindow.setMenu(null);

  
  } else {
    settingsWindow.focus();
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: isDevMode ? 1800 : 945,
    height: 975,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // if (isDevMode) {
  // win.webContents.openDevTools();
  //}

  win.loadFile('index.html');

  win.setMenu(null);

  ipcMain.handle('get-config', () => {
    return loadConfig();
  });


}

app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});