const { app, BrowserWindow, ipcMain } = require('electron');

const { loadConfig, saveConfig } = require('./renderer/js/modemConfig.js');
const { SerialPort } = require('serialport');

const isDevMode = process.env.NODE_ENV === 'development';

let settingsWindow;


ipcMain.on('read-module', async () => {
  const config = loadConfig();

  typeConnect = parseInt(config.network?.connType, 10);

  let portPath = '';
  let portOptions = {};

  if (typeConnect === 1) {
    portPath = config.optCom?.comPort;
    portOptions = {
      baudRate: config.optCom?.baudRate,
      dataBits: config.optCom?.dataBits,
      stopBits: config.optCom?.stopBits,
      parity: config.optCom?.parity
    };
  }
  else if (typeConnect === 2) {
    portPath = config.usbCom?.comPort;
    portOptions = {
      baudRate: config.usbCom?.baudRate,
      dataBits: config.usbCom?.dataBits,
      stopBits: config.usbCom?.stopBits,
      parity: config.usbCom?.parity
    };
  }
  else if (typeConnect === 3) {
    portPath = config.rf232com?.comPort;
    portOptions = {
      baudRate: config.rf232com?.baudRate,
      dataBits: config.rf232com?.dataBits,
      stopBits: config.rf232com?.stopBits,
      parity: config.rf232com?.parity
    };
  } else if (typeConnect === 4) {
    const tcpOptions = {
      host: config.tcp?.ip,
      port: config.tcp?.port,
      timeout: config.tcp?.timeoutOpenConn
    };

    const client = new net.Socket(); // создаём TCP-клиент

    client.setTimeout(tcpOptions.timeout);

    client.connect(tcpOptions.port, tcpOptions.host, () => {
      console.log(`✅ Подключено к ${tcpOptions.host}:${tcpOptions.port}`);

      // Отправка данных по TCP
      const message = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
      client.write(message, () => {
        console.log('📤 Данные отправлены по TCP');
      });
    });

    client.on('data', (data) => {
      console.log('📥 Получено от TCP-сервера:', data.toString());

      // Можно обработать полученные данные
      settingsWindow.webContents.send('read-result', {
        success: true,
        data: data.toString()
      });

      // Закрытие соединения после получения данных
      client.end();
    });

    client.on('timeout', () => {
      console.warn('⏰ Время ожидания истекло');
      client.destroy(); // Закрытие соединения по тайм-ауту
      settingsWindow.webContents.send('read-result', {
        success: false,
        error: 'Тайм-аут соединения'
      });
    });

    client.on('error', (err) => {
      console.error('❌ Ошибка при соединении с TCP сервером:', err.message);
      settingsWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });
    });

    client.on('close', () => {
      console.log('🔒 TCP соединение закрыто');
    });

    return;
  } else {
    console.error('Неизвестный тип подключения:', typeConnect);
    return;
  }

  const port = new SerialPort({ path: portPath, ...portOptions, autoOpen: false });

  try {
    await new Promise((resolve, reject) => {
      port.open((err) => {
        if (err) return reject(err);
        console.log('Порт открыт:', portPath);
        resolve();
      });
    });

    // Отправка данных (пример команды)
    const message = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
    port.write(message, (err) => {
      if (err) {
        console.error('Ошибка отправки:', err.message);
      } else {
        console.log('Данные отправлены');
      }
    });

    let receivedData = '';
    const timeoutMs = 5000;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Время ожидания истекло');
        resolve();
      }, timeoutMs);

      port.on('data', (data) => {
        receivedData += data.toString(); // или data.toString('hex')
        console.log('Получено:', data.toString());

        if (receivedData.length >= 10) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    port.close((err) => {
      if (err) {
        console.error('Ошибка при закрытии порта:', err.message);
      } else {
        console.log('🔒 Порт закрыт');
      }
    });

    // Отправка результата в рендер
    settingsWindow.webContents.send('read-result', {
      success: true,
      data: receivedData
    });

  } catch (err) {
    console.error('Ошибка:', err.message);
    settingsWindow.webContents.send('read-result', {
      success: false,
      error: err.message
    });
  }

});




ipcMain.on('write-module', () => {
  saveConfig();
  // Здесь вы можете обработать данные, полученные из рендерера
  // Например, отправить их обратно в рендерер или выполнить другие действия
});

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