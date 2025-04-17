const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const { loadConfigLocal, loadConfigModem, saveConfigLocal, saveConfigModem, configPathLocal, configPathModem } = require('./renderer/js/modemConfig.js');
const { SerialPort } = require('serialport');
const net = require('net');

const isDevMode = process.env.NODE_ENV === 'development';

let settingsWindow;
let mainWindow;


ipcMain.on('read-module', async (event, connType) => {
  const config = loadConfigLocal();

  connType = parseInt(connType, 10);

  let portPath = '';
  let portOptions = {};

  if (connType === 1) {
    portPath = config.comPortOpto;
    portOptions = {
      baudRate: parseInt(config.baudRateOpto, 10),
      dataBits: parseInt(config.dataBitsOpto, 10),
      stopBits: parseInt(config.stopBitsOpto, 10),
      parity: config.parityOpto
    };

    const port = new SerialPort({ path: portPath, ...portOptions, autoOpen: false });

    try {
      await new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) return reject(err);
          console.log('Port open:', portPath);
          resolve();
        });
      });

      const message1 = Buffer.from([0x00, 0x03, 0x45, 0x41, 0x53, 0x59, 0xc9, 0xfd]);
      port.write(message1, (err) => {
        if (err) {
          console.error('Sending error:', err.message);
        } else {
          console.log('Data sent');
        }
      });

      let receivedData = '';
      const timeoutMs = 5000;

      const response1 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Waiting time expired for message 1');
          reject(new Error('Timeout waiting for message 1'));
        }, timeoutMs);

        port.on('data', (data) => {
          receivedData += data.toString();
          console.log('Received data:', data.toString());

          if (receivedData.length >= 10) {
            clearTimeout(timeout);
            resolve(receivedData);
          }
        });
      });

      console.log('Response to message 1:', receivedData);

      const message2 = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
      port.write(message2, (err) => {
        if (err) {
          console.error('Sending error for message 2:', err.message);
        } else {
          console.log('Message 2 sent');
        }
      });

      const response2 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Waiting time expired for message 2');
          reject(new Error('Timeout waiting for message 2'));
        }, timeoutMs);

        port.on('data', (data) => {
          receivedData += data.toString();
          console.log('Received data for message 2:', data.toString());

          if (receivedData.length >= 10) {
            clearTimeout(timeout);
            resolve(receivedData);
          }
        });
      });

      console.log('Response to message 2:', receivedData);

      port.close((err) => {
        if (err) {
          console.error('Error close port:', err.message);
        } else {
          console.log('Port closed:', portPath);
        }
      });

      mainWindow.webContents.send('read-result', {
        success: true,
        data: receivedData
      });

    } catch (err) {
      console.error('Error:', err.message);
      mainWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });
    }
    return;
  }
  else if (connType === 2) {
    portPath = config.comPortUsb;
    portOptions = {
      baudRate: parseInt(config.baudRateUsb, 10),
      dataBits: parseInt(config.dataBitsUsb, 10),
      stopBits: parseInt(config.stopBitsUsb, 10),
      parity: config.parityUsb
    };
  }
  else if (connType === 3) {
    portPath = config.comPortRf;
    portOptions = {
      baudRate: parseInt(config.baudRateRf, 10),
      dataBits: parseInt(config.dataBitsRf, 10),
      stopBits: parseInt(config.stopBitsRf, 10),
      parity: config.parityRf
    };
    const port = new SerialPort({ path: portPath, ...portOptions, autoOpen: false });

    try {
      await new Promise((resolve, reject) => {
        port.open((err) => {
          if (err) return reject(err);
          console.log('Port open:', portPath);
          resolve();
        });
      });

      const message1 = Buffer.from([0x00, 0x03, 0x45, 0x41, 0x53, 0x59, 0xc9, 0xfd]);
      port.write(message1, (err) => {
        if (err) {
          console.error('Sending error:', err.message);
        } else {
          console.log('Data sent');
        }
      });

      let receivedData = Buffer.alloc(0);
      const timeoutMs = 5000;

      const response1 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Waiting time expired for message 1');
          reject(new Error('Timeout waiting for message 1'));
        }, timeoutMs);

        port.on('data', (data) => {
          receivedData = Buffer.concat([receivedData, data]); 
          console.log('Received data:', data.toString('hex'));

          const expectedResponse = Buffer.from([0x00, 0x03, 0x45, 0x00, 0xb4, 0xc2]);
          if (receivedData.length >= expectedResponse.length && receivedData.slice(0, expectedResponse.length).equals(expectedResponse)) {
            clearTimeout(timeout);
            resolve(receivedData); 
          }
        });
      });

      console.log('Response to message 1:', receivedData.toString('hex'));

      const message2 = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
      port.write(message2, (err) => {
        if (err) {
          console.error('Sending error for message 2:', err.message);
        } else {
          console.log('Message 2 sent');
        }
      });

      const response2 = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn('Waiting time expired for message 2');
          reject(new Error('Timeout waiting for message 2'));
        }, timeoutMs);

        port.on('data', (data) => {
          receivedData += data.toString();
          console.log('Received data for message 2:', data.toString());

          // if (receivedData.length >= 10) {
          //   clearTimeout(timeout);
          //   resolve(receivedData);
          // }
        });
      });

      console.log('Response to message 2:', receivedData);

      port.close((err) => {
        if (err) {
          console.error('Error close port:', err.message);
        } else {
          console.log('Port closed:', portPath);
        }
      });

      mainWindow.webContents.send('read-result', {
        success: true,
        data: receivedData
      });

    } catch (err) {
      console.error('Error:', err.message);
      mainWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });
    }
    return;
  } else if (connType === 4) {
    const tcpOptions = {
      host: config.ipTcp,
      port: config.portTcp,
      timeout: 2000
    };

    const client = new net.Socket();

    client.setTimeout(tcpOptions.timeout);


    client.connect(tcpOptions.port, tcpOptions.host, () => {
      console.log(`Connect to ${tcpOptions.host}:${tcpOptions.port}`);

      const message = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
      client.write(message, () => {
        console.log('Data send to TCP');
      });
    });

    let fullData = '';

    client.on('data', (chunk) => {
      const str = chunk.toString();
      console.log('Get data TCP:', str);
      fullData += str;
    });



    client.on('timeout', () => {
      console.warn('Waiting time expired');
      client.destroy();
      if (fullData.length === 0) {
        mainWindow.webContents.send('read-result', {
          success: false,
          error: 'Connection timeout'
        });
      } else {
        console.warn('data send to read-result:');
        mainWindow.webContents.send('read-result', {
          success: true,
          data: parseModuleData(fullData)
        });
      }

    });

    client.on('error', (err) => {
      console.error('Error connecting to TCP server:', err.message);
      mainWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });
    });

    client.on('close', () => {
      console.log('TCP connection closed');
    });

    return;
  } else {
    console.error('Unknown connection type:', connType);
    return;
  }

  const port = new SerialPort({ path: portPath, ...portOptions, autoOpen: false });

  try {
    await new Promise((resolve, reject) => {
      port.open((err) => {
        if (err) return reject(err);
        console.log('Port open:', portPath);
        resolve();
      });
    });

    const message = Buffer.from([0x43, 0x4F, 0x4E, 0x46, 0x49, 0x47, 0x52, 0x45, 0x41, 0x44, 0xCF, 0xDB]);
    port.write(message, (err) => {
      if (err) {
        console.error('Sending error:', err.message);
      } else {
        console.log('Data sent');
      }
    });

    let receivedData = '';
    const timeoutMs = 5000;

    await new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('Waiting time expired');
        resolve();
      }, timeoutMs);

      port.on('data', (data) => {
        receivedData += data.toString(); // или data.toString('hex')
        console.log('Received:', data.toString());

        if (receivedData.length >= 10) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    port.close((err) => {
      if (err) {
        console.error('Error close port:', err.message);
      } else {
        console.log('Port closed:', portPath);
      }
    });

    // Отправка результата в рендер
    mainWindow.webContents.send('read-result', {
      success: true,
      data: receivedData
    });

  } catch (err) {
    console.error('Error:', err.message);
    mainWindow.webContents.send('read-result', {
      success: false,
      error: err.message
    });
  }

});

ipcMain.on('save-config-modem', (event, configData) => {
  const lines = Object.entries(configData)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFile(configPathModem, lines, 'utf8', (err) => {
    if (err) {
      console.error('Ошибка при сохранении модем-конфига:', err);
    } else {
      console.log('Конфиг модема успешно сохранён!');
    }
  });
});

function parseModuleData(raw) {
  const result = {};
  raw.split(/\r?\n/).forEach(line => {
    const [key, val] = line.split('=');
    if (key && val !== undefined) {
      result[key.trim()] = val.trim();
    }
  });
  return result;
}


ipcMain.on('write-module', () => {
  saveConfig();
  // Здесь вы можете обработать данные, полученные из рендерера
  // Например, отправить их обратно в рендерер или выполнить другие действия
});

ipcMain.handle('get-com-ports', async () => {
  console.log('get-com-ports event received');
  try {
    const ports = await SerialPort.list();

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
  mainWindow = new BrowserWindow({
    width: isDevMode ? 1800 : 945,
    height: 975,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // if (isDevMode) {
  mainWindow.webContents.openDevTools();
  //}

  mainWindow.loadFile('index.html');

  mainWindow.setMenu(null);

  ipcMain.handle('get-config-modem', () => {
    return loadConfigModem();
  });

  ipcMain.handle('get-config-local', () => {
    return loadConfigLocal();
  });


}

app.whenReady().then(createWindow);


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});