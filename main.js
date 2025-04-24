const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const { openPort, createPort, closePort, sendMessage, waitForResponse, waitForResponseWithSilence } = require('./renderer/js/port.js');
const { loadConfigLocal, loadConfigModem, saveConfigLocal, saveConfigModem, configPathLocal, configPathModem } = require('./renderer/js/modemConfig.js');
const { SerialPort } = require('serialport');
const net = require('net');

const isDevMode = process.env.NODE_ENV === 'development';

let settingsWindow;
let mainWindow;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const apn = Buffer.from([0x44, 0x03, 0x41, 0x50, 0x4e]); // пример APN
const user = Buffer.from([0x44, 0x04, 0x55, 0x53, 0x45, 0x52]); // пример USER
const pwd = Buffer.from([0x44, 0x03, 0x50, 0x57, 0x44]); // пример PWD
const opMode = Buffer.from([0x44, 0x07, 0x4f, 0x50, 0x5f, 0x4d, 0x4f, 0x44, 0x45]); // пример OP_MODE
const portSrv = Buffer.from([0x44, 0x08, 0x50, 0x4f, 0x52, 0x54, 0x5f, 0x53, 0x52, 0x56]); // пример PORT_SRV
const gsmMode = Buffer.from([0x44, 0x08, 0x47, 0x53, 0x4d, 0x5f, 0x4d, 0x4f, 0x44, 0x45]); // пример GSM_MODE
const baudrate = Buffer.from([0x44, 0x08, 0x42, 0x41, 0x55, 0x44, 0x52, 0x41, 0x54, 0x45]); // пример BAUDRATE
const dataSize = Buffer.from([0x44, 0x09, 0x44, 0x41, 0x54, 0x41, 0x5f, 0x53, 0x49, 0x5a, 0x45]); // пример DATA_SIZE
const stopSize = Buffer.from([0x44, 0x09, 0x53, 0x54, 0x4f, 0x50, 0x5f, 0x53, 0x49, 0x5a, 0x45]); // пример STOP_SIZE
const parity = Buffer.from([0x44, 0x06, 0x50, 0x41, 0x52, 0x49, 0x54, 0x59]); // пример PARITY
const baudrate3 = Buffer.from([0x44, 0x09, 0x42, 0x41, 0x55, 0x44, 0x52, 0x41, 0x54, 0x45, 0x33]); // пример BAUDRATE3
const dataSize3 = Buffer.from([0x44, 0x0a, 0x44, 0x41, 0x54, 0x41, 0x5f, 0x53, 0x49, 0x5a, 0x45, 0x33]); // пример DATA_SIZE3
const stopSize3 = Buffer.from([0x44, 0x0a, 0x53, 0x54, 0x4f, 0x50, 0x5f, 0x53, 0x49, 0x5a, 0x45, 0x33]); // пример STOP_SIZE3
const parity3 = Buffer.from([0x44, 0x07, 0x50, 0x41, 0x52, 0x49, 0x54, 0x59, 0x33]); // пример PARITY3
const toutTcp = Buffer.from([0x44, 0x08, 0x54, 0x4f, 0x55, 0x54, 0x5f, 0x54, 0x43, 0x50]); // пример TOUT_TCP
const toutReload = Buffer.from([0x44, 0x0b, 0x54, 0x4f, 0x55, 0x54, 0x5f, 0x52, 0x45, 0x4c, 0x4f, 0x41, 0x44]); // пример TOUT_RELOAD
const toutSim = Buffer.from([0x44, 0x08, 0x54, 0x4f, 0x55, 0x54, 0x5f, 0x53, 0x49, 0x4d]); // пример TOUT_SIM
const toutNet = Buffer.from([0x44, 0x08, 0x54, 0x4f, 0x55, 0x54, 0x5f, 0x4e, 0x45, 0x54]); // пример TOUT_NET
const toutSrv = Buffer.from([0x44, 0x08, 0x54, 0x4f, 0x55, 0x54, 0x5f, 0x53, 0x52, 0x56]); // пример TOUT_SRV
const ftpHost = Buffer.from([0x44, 0x08, 0x46, 0x54, 0x50, 0x5f, 0x48, 0x4f, 0x53, 0x54]); // пример FTP_HOST
const ftpUser = Buffer.from([0x44, 0x08, 0x46, 0x54, 0x50, 0x5f, 0x55, 0x53, 0x45, 0x52]); // пример FTP_USER
const ftpPwd = Buffer.from([0x44, 0x07, 0x46, 0x54, 0x50, 0x5f, 0x50, 0x57, 0x44]); // пример FTP_PWD
const ftpPort = Buffer.from([0x44, 0x08, 0x46, 0x54, 0x50, 0x5f, 0x50, 0x4f, 0x52, 0x54]); // пример FTP_PORT
const ftpFSize = Buffer.from([0x44, 0x09, 0x46, 0x54, 0x50, 0x5f, 0x46, 0x53, 0x49, 0x5a, 0x45]); // пример FTP_FSIZE
const rssi = Buffer.from([0x44, 0x04, 0x52, 0x53, 0x53, 0x49]); // пример RSSI
const devModel = Buffer.from([0x44, 0x09, 0x44, 0x45, 0x56, 0x5f, 0x4d, 0x4f, 0x44, 0x45, 0x4c]); // пример DEV_MODEL
const hw_ver = Buffer.from([0x44, 0x06, 0x48, 0x57, 0x5f, 0x56, 0x45, 0x52]); // пример HW_VER
const app_ver = Buffer.from([0x44, 0x07, 0x41, 0x50, 0x50, 0x5f, 0x56, 0x45, 0x52]); // пример APP_VER

ipcMain.on('write-module', async (event, connType, msg) => {

  const config = loadConfigLocal();
  connType = parseInt(connType, 10);

  const sendAndReceiveParam = async (port, label, msg2) => {
    const msg1 = Buffer.from([0x00, 0x03, 0x45, 0x41, 0x53, 0x59, 0xc9, 0xfd]);
    const expectedResp1 = Buffer.from([0x00, 0x03, 0x45, 0x00, 0xb4, 0xc2]);

    await sendMessage(port, msg1, `${label} - prefix`);

    const resp1 = await waitForResponse(
      port,
      (data) =>
        data.length >= expectedResp1.length &&
        data.slice(0, expectedResp1.length).equals(expectedResp1),
      5000,
      `${label} - response prefix`
    );

    console.log(`[${label}] Prefix OK:`, resp1.toString('hex'));

    await sleep(100);

    await sendMessage(port, msg2, `${label} - message 2`);

    const resp2 = await waitForResponseWithSilence(port, 150, 3000, `${label} response`);

    console.log(`[${label}] Response OK:`, resp2.toString());

    mainWindow.webContents.send('write-result', {
      success: true,
      label,
      data: resp2.toString()
    });
  };

  if (connType === 1) {

    const { port } = createPort(config, connType);

    try {
      await openPort(port);

      const lines = msg.trim().split('\n');
      for (const line of lines) {
        const [id, value] = line.split('=');

        if (!id || !value) continue; 

        const payload = Buffer.from(line, "utf-8");
        const packet = Buffer.concat([
          Buffer.from([0x44, 0x2A]),            // Start byte (0x2A)
          Buffer.from([payload.length]),  // Length
          payload                         // Actual data
        ]);

        try {
          await sendAndReceiveParam(port, id, packet, () => true); // line = `${id}=${value}`
        } catch (err) {
          console.error('Error during sequential message exchange:', err.message);
          mainWindow.webContents.send('write-result', {
            success: false,
            error: err.message
          });
          break;
        }
      }

      const accept = Buffer.from([0x44, 0x2B, 0x00, 0x00]);
      const acceptId = "accept"

      try {
        await sendAndReceiveParam(port, acceptId, accept, () => true);
      }
      catch (err) {
        console.error('Error during sequential message exchange:', err.message);
        mainWindow.webContents.send('write-result', {
          success: false,
          error: err.message
        });
      }
      await closePort(port);
    } catch (err) {
      console.error('Error during sequential message exchange:', err.message);
      mainWindow.webContents.send('write-result', {
        success: false,
        error: err.message
      });

      if (port.isOpen) {
        port.close(() => console.log('Port closed after error'));
      }
    }
    return;
  } else if (connType === 2) {

    const { port } = createPort(config, connType);

  } else if (connType === 3) {

    const { port } = createPort(config, connType);

    try {
      await openPort(port);

      const lines = msg.trim().split('\n');
      for (const line of lines) {
        const [id, value] = line.split('=');

        if (!id || !value) continue; 

        const payload = Buffer.from(line, "utf-8");
        const packet = Buffer.concat([
          Buffer.from([0x44, 0x2A]),            // Start byte (0x2A)
          Buffer.from([payload.length]),  // Length
          payload                         // Actual data
        ]);

        

        try {
          await sendAndReceiveParam(port, id, packet, () => true); // line = `${id}=${value}`
        } catch (err) {
          console.error('Error during sequential message exchange:', err.message);
          mainWindow.webContents.send('write-result', {
            success: false,
            error: err.message
          });
          break;
        }
      }

      const accept = Buffer.from([0x44, 0x2B, 0x00, 0x00]);
      const acceptId = "accept"

      try {
        await sendAndReceiveParam(port, acceptId, accept, () => true);
      }
      catch (err) {
        console.error('Error during sequential message exchange:', err.message);
        mainWindow.webContents.send('write-result', {
          success: false,
          error: err.message
        });
      }
      await closePort(port);
    } catch (err) {
      console.error('Error during sequential message exchange:', err.message);
      mainWindow.webContents.send('write-result', {
        success: false,
        error: err.message
      });

      if (port.isOpen) {
        port.close(() => console.log('Port closed after error'));
      }
    }
    return;

  } else if (connType === 4) {

    const { client, portOptions } = createPort(config, connType);

    client.connect(portOptions.port, portOptions.host, () => {
      console.log(`Connect to ${portOptions.host}:${portOptions.port}`);

      const prefxix = "CONFIGWRITE\n"

      const message = prefxix + msg;
      client.write(message, () => {
        console.log('Data send to TCP');
      });
    });


    client.on('timeout', () => {
      console.warn('Waiting time expired');
      client.destroy();
    });

    client.on('error', (err) => {
      console.error('Error connecting to TCP server:', err.message);
      mainWindow.webContents.send('write-result', {
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
});


ipcMain.on('read-module', async (event, connType) => {
  const config = loadConfigLocal();

  connType = parseInt(connType, 10);

  const sendAndReceiveParam = async (port, label, msg2) => {
    const msg1 = Buffer.from([0x00, 0x03, 0x45, 0x41, 0x53, 0x59, 0xc9, 0xfd]);
    const expectedResp1 = Buffer.from([0x00, 0x03, 0x45, 0x00, 0xb4, 0xc2]);

    await sendMessage(port, msg1, `${label} - prefix`);

    const resp1 = await waitForResponse(
      port,
      (data) =>
        data.length >= expectedResp1.length &&
        data.slice(0, expectedResp1.length).equals(expectedResp1),
      5000,
      `${label} - response prefix`
    );

    console.log(`[${label}] Prefix OK:`, resp1.toString('hex'));

    await sleep(200);

    await sendMessage(port, msg2, `${label} - message 2`);

    const resp2 = await waitForResponseWithSilence(port, 150, 3000, `${label} response`);

    console.log(`[${label}] Response OK:`, resp2.toString());

    mainWindow.webContents.send('read-result', {
      success: true,
      label,
      data: resp2.toString()
    });
  };

  if (connType === 1) {

    const { port } = createPort(config, connType);

    try {
      await openPort(port);

      await sendAndReceiveParam(port, 'APN', apn, () => true);
      await sendAndReceiveParam(port, 'USER', user, () => true);
      await sendAndReceiveParam(port, 'PWD', pwd, () => true);
      await sendAndReceiveParam(port, 'OP_MODE', opMode, () => true);
      await sendAndReceiveParam(port, 'PORT_SRV', portSrv, () => true);
      await sendAndReceiveParam(port, 'GSM_MODE', gsmMode, () => true);
      await sendAndReceiveParam(port, 'BAUDRATE', baudrate, () => true);
      await sendAndReceiveParam(port, 'DATA_SIZE', dataSize, () => true);
      await sendAndReceiveParam(port, 'STOP_SIZE', stopSize, () => true);
      await sendAndReceiveParam(port, 'PARITY', parity, () => true);
      await sendAndReceiveParam(port, 'BAUDRATE3', baudrate3, () => true);
      await sendAndReceiveParam(port, 'DATA_SIZE3', dataSize3, () => true);
      await sendAndReceiveParam(port, 'STOP_SIZE3', stopSize3, () => true);
      await sendAndReceiveParam(port, 'PARITY3', parity3, () => true);
      await sendAndReceiveParam(port, 'TOUT_TCP', toutTcp, () => true);
      await sendAndReceiveParam(port, 'TOUT_RELOAD', toutReload, () => true);
      await sendAndReceiveParam(port, 'TOUT_SIM', toutSim, () => true);
      await sendAndReceiveParam(port, 'TOUT_NET', toutNet, () => true);
      await sendAndReceiveParam(port, 'TOUT_SRV', toutSrv, () => true);
      await sendAndReceiveParam(port, 'FTP_HOST', ftpHost, () => true);
      await sendAndReceiveParam(port, 'FTP_USER', ftpUser, () => true);
      await sendAndReceiveParam(port, 'FTP_PWD', ftpPwd, () => true);
      await sendAndReceiveParam(port, 'FTP_PORT', ftpPort, () => true);
      await sendAndReceiveParam(port, 'FTP_FSIZE', ftpFSize, () => true);
      await sendAndReceiveParam(port, 'RSSI', rssi, () => true);
      await sendAndReceiveParam(port, 'DEV_MODEL', devModel, () => true);
      await sendAndReceiveParam(port, 'HW_VER', hw_ver, () => true);
      await sendAndReceiveParam(port, 'APP_VER', app_ver, () => true);


      await closePort(port);
    } catch (err) {
      console.error('Error during sequential message exchange:', err.message);
      mainWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });

      if (port.isOpen) {
        port.close(() => console.log('Port closed after error'));
      }
    }

    return;
  }
  else if (connType === 2) {

    const { port } = createPort(config, connType);

  }
  else if (connType === 3) {

    const { port } = createPort(config, connType);

    try {
      await openPort(port);

      await sendAndReceiveParam(port, 'APN', apn, () => true);
      await sendAndReceiveParam(port, 'USER', user, () => true);
      await sendAndReceiveParam(port, 'PWD', pwd, () => true);
      await sendAndReceiveParam(port, 'OP_MODE', opMode, () => true);
      await sendAndReceiveParam(port, 'PORT_SRV', portSrv, () => true);
      await sendAndReceiveParam(port, 'GSM_MODE', gsmMode, () => true);
      await sendAndReceiveParam(port, 'BAUDRATE', baudrate, () => true);
      await sendAndReceiveParam(port, 'DATA_SIZE', dataSize, () => true);
      await sendAndReceiveParam(port, 'STOP_SIZE', stopSize, () => true);
      await sendAndReceiveParam(port, 'PARITY', parity, () => true);
      await sendAndReceiveParam(port, 'BAUDRATE3', baudrate3, () => true);
      await sendAndReceiveParam(port, 'DATA_SIZE3', dataSize3, () => true);
      await sendAndReceiveParam(port, 'STOP_SIZE3', stopSize3, () => true);
      await sendAndReceiveParam(port, 'PARITY3', parity3, () => true);
      await sendAndReceiveParam(port, 'TOUT_TCP', toutTcp, () => true);
      await sendAndReceiveParam(port, 'TOUT_RELOAD', toutReload, () => true);
      await sendAndReceiveParam(port, 'TOUT_SIM', toutSim, () => true);
      await sendAndReceiveParam(port, 'TOUT_NET', toutNet, () => true);
      await sendAndReceiveParam(port, 'TOUT_SRV', toutSrv, () => true);
      await sendAndReceiveParam(port, 'FTP_HOST', ftpHost, () => true);
      await sendAndReceiveParam(port, 'FTP_USER', ftpUser, () => true);
      await sendAndReceiveParam(port, 'FTP_PWD', ftpPwd, () => true);
      await sendAndReceiveParam(port, 'FTP_PORT', ftpPort, () => true);
      await sendAndReceiveParam(port, 'FTP_FSIZE', ftpFSize, () => true);
      await sendAndReceiveParam(port, 'RSSI', rssi, () => true);
      await sendAndReceiveParam(port, 'DEV_MODEL', devModel, () => true);
      await sendAndReceiveParam(port, 'HW_VER', hw_ver, () => true);
      await sendAndReceiveParam(port, 'APP_VER', app_ver, () => true);


      await closePort(port);
    } catch (err) {
      console.error('Error during sequential message exchange:', err.message);
      mainWindow.webContents.send('read-result', {
        success: false,
        error: err.message
      });

      if (port.isOpen) {
        port.close(() => console.log('Port closed after error'));
      }
    }

    return;
  } else if (connType === 4) {

    const { client, portOptions } = createPort(config, connType);

    client.connect(portOptions.port, portOptions.host, () => {
      console.log(`Connect to ${portOptions.host}:${portOptions.port}`);

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
  let currentConfig = {};

  if (fs.existsSync(configPathModem)) {
    const content = fs.readFileSync(configPathModem, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value !== undefined) {
        currentConfig[key.trim()] = value.trim();
      }
    }
  }

  for (const [key, value] of Object.entries(configData)) {
    currentConfig[key] = value;
  }


  const updatedLines = Object.entries(currentConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  fs.writeFile(configPathModem, updatedLines, 'utf8', (err) => {
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