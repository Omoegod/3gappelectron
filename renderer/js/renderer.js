const { ipcRenderer, ipcMain } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const config = await ipcRenderer.invoke('get-config');

        document.getElementById('typeConnect').value = config.network?.connType || 1;
        document.getElementById('typeGSM').value = config.network?.gsmMode || 1;
        document.getElementById('apn').value = config.modem?.apn || '';
        document.getElementById('username').value = config.modem?.user || '';
        document.getElementById('password').value = config.modem?.password || '';
        document.getElementById('tcp').value = config.network?.opMode || 1;
        document.getElementById('port').value = config.network?.port || "";
        document.getElementById('baudrate1').value = config.uart1?.baudRate || "";
        document.getElementById('dataBits1').value = config.uart1?.dataBits || "";
        document.getElementById('stopBits1').value = config.uart1?.stopBits || "";
        document.getElementById('parity1').value = config.uart1?.parity || "";
        document.getElementById('baudrate2').value = config.uart2?.baudRate || "";
        document.getElementById('dataBits2').value = config.uart2?.dataBits || "";
        document.getElementById('stopBits2').value = config.uart2?.stopBits || "";
        document.getElementById('parity2').value = config.uart2?.parity || "";
        document.getElementById('toutTCP').value = config.timeout?.timeoutOpenConn || "";
        document.getElementById('toutReload').value = config.timeout?.timeoutModem || "";
        document.getElementById('toutSIM').value = config.timeout?.timeoutSim || "";
        document.getElementById('toutNet').value = config.timeout?.timeoutInet || "";
        document.getElementById('toutSRV').value = config.timeout?.timeoutTcp || "";


    } catch (error) {
        console.error('Ошибка при загрузке конфигурации:', error);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const readButton = document.getElementById('btn1');
    if (readButton) {
        readButton.addEventListener('click', () => {
            ipcRenderer.send('read-module');
        });
    } else {
        console.error('Кнопка с ID "btn1" не найдена.');
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const writeButton = document.getElementById('btn2');
    if (writeButton) {
        writeButton.addEventListener('click', () => {
            const newConfig = {
                network: {
                    connType: parseInt(document.getElementById('typeConnect').value),
                    gsmMode: parseInt(document.getElementById('typeGSM').value),
                    opMode: parseInt(document.getElementById('tcp').value),
                    port: parseInt(document.getElementById('port').value),
                },
                modem: {
                    apn: document.getElementById('apn').value,
                    user: document.getElementById('username').value,
                    password: document.getElementById('password').value,
                },
                uart1: {
                    baudRate: parseInt(document.getElementById('baudrate1').value),
                    dataBits: parseInt(document.getElementById('dataBits1').value),
                    stopBits: parseInt(document.getElementById('stopBits1').value),
                    parity: document.getElementById('parity1').value,
                    flowControl: 'none' 
                },
                uart2: {
                    baudRate: parseInt(document.getElementById('baudrate2').value),
                    dataBits: parseInt(document.getElementById('dataBits2').value),
                    stopBits: parseInt(document.getElementById('stopBits2').value),
                    parity: document.getElementById('parity2').value,
                    flowControl: 'none'
                },
                timeout: {
                    timeoutOpenConn: parseInt(document.getElementById('toutTCP').value),
                    timeoutModem: parseInt(document.getElementById('toutReload').value),
                    timeoutSim: parseInt(document.getElementById('toutSIM').value),
                    timeoutInet: parseInt(document.getElementById('toutNet').value),
                    timeoutTcp: parseInt(document.getElementById('toutSRV').value)
                }
            };

            ipcRenderer.send('update-config', newConfig); // отправляем в main
            ipcRenderer.send('write-module'); // затем отправляем команду на запись
        });
    }
});




document.addEventListener('DOMContentLoaded', () => {
    const settingsButton = document.getElementById('btn6');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            ipcRenderer.send('open-settings-window');
        });
    } else {
        console.error('Кнопка с ID "btn6" не найдена.');
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(button.dataset.tab).classList.add('active');
        });
    });
});