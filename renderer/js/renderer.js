const { ipcRenderer, ipcMain } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const configModem = await ipcRenderer.invoke('get-config-modem');

        const configLocal = await ipcRenderer.invoke('get-config-local');

        document.getElementById('connType').value = configLocal.connType || 1;
        document.getElementById('GSM_MODE').value = configModem.GSM_MODE || 0;
        document.getElementById('APN').value = configModem.APN || '';
        document.getElementById('USER').value = configModem.USER || '';
        document.getElementById('PWD').value = configModem.PWD || '';
        document.getElementById('OP_MODE').value = configModem.OP_MODE || 1;
        document.getElementById('PORT_SRV').value = configModem.PORT_SRV || "";
        document.getElementById('BAUDRATE').value = configModem.BAUDRATE || "";
        document.getElementById('DATA_SIZE').value = configModem.DATA_SIZE || "";
        document.getElementById('STOP_SIZE').value = configModem.STOP_SIZE || "";
        document.getElementById('PARITY').value = configModem.PARITY || "";
        document.getElementById('BAUDRATE3').value = configModem.BAUDRATE3 || "";
        document.getElementById('DATA_SIZE3').value = configModem.DATA_SIZE3 || "";
        document.getElementById('STOP_SIZE3').value = configModem.STOP_SIZE3 || "";
        document.getElementById('PARITY3').value = configModem.PARITY3 || "";
        document.getElementById('TOUT_TCP').value = configModem.TOUT_TCP || "";
        document.getElementById('TOUT_RELOAD').value = configModem.TOUT_RELOAD || "";
        document.getElementById('TOUT_SIM').value = configModem.TOUT_SIM || "";
        document.getElementById('TOUT_NET').value = configModem.TOUT_NET || "";
        document.getElementById('TOUT_SRV').value = configModem.TOUT_SRV || "";


    } catch (error) {
        console.error('Ошибка при загрузке конфигурации:', error);
    }
});



document.addEventListener('DOMContentLoaded', () => {
    const readButton = document.getElementById('btn1');

    if (readButton) {
        readButton.addEventListener('click', () => {
            const selectedType = document.getElementById('connType').value;
            ipcRenderer.send('read-module', selectedType);
        });
    } else {
        console.error('Кнопка с ID "btn1" не найдена.');
    }

    ipcRenderer.on('read-result', (event, result) => {
        if (result.success) {
            const data = result.data;
            console.log('Данные успешно прочитаны:', data);
            Object.keys(data).forEach(key => {
                const el = document.getElementById(key);
                if (el) {
                    el.value = data[key];
                } else {
                    console.warn(`Поле с id "${key}" не найдено`);
                }
            });

            const neededKeys = [
                'APN', 'USER', 'PWD', 'OP_MODE', 'PORT_SRV',
                'GSM_MODE', 'BAUDRATE', 'DATA_SIZE', 'STOP_SIZE', 'PARITY',
                'BAUDRATE3', 'DATA_SIZE3', 'STOP_SIZE3', 'PARITY3',
                'TOUT_TCP', 'TOUT_RELOAD', 'TOUT_SIM', 'TOUT_NET', 'TOUT_SRV',
                'FTP_HOST', 'FTP_USER', 'FTP_PWD', 'FTP_PORT', 'FTP_FSIZE'
            ];
            const filteredData = {};
            for (const key of neededKeys) {
                if (key in data) {
                    filteredData[key] = data[key];
                }
            }
            ipcRenderer.send('save-config-modem', filteredData); // Сохраняем данные в файл
        } else {
            console.error('Ошибка при чтении:', result.error);
        }
    });
});


document.addEventListener('DOMContentLoaded', () => {
    const readButton = document.getElementById('btn2');
    if (readButton) {
        readButton.addEventListener('click', () => {
            const selectedType = document.getElementById('connType').value;

            const configString = collectConfigFromHtml();
            
            ipcRenderer.send('write-module', selectedType, configString);
            
        });
    }
});


function collectConfigFromHtml() {
    const ids = [
        'APN', 'USER', 'PWD', 'OP_MODE', 'GSM_MODE', 
        'PORT_SRV', 'BAUDRATE', 'DATA_SIZE', 'STOP_SIZE', 'PARITY',
        'BAUDRATE3', 'DATA_SIZE3', 'STOP_SIZE3', 'PARITY3',
        'TOUT_TCP', 'TOUT_RELOAD', 'TOUT_SIM', 'TOUT_NET', 'TOUT_SRV'
    ];

    let result = '';

    ids.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            result += `${id}=${element.value}\n`;
        }
    });

    return result;
}

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