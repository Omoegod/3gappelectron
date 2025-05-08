const { ipcRenderer, ipcMain } = require('electron');

function updateRSSIColor(value) {
    const rssiElement = document.getElementById('RSSI');

    if (!rssiElement) {
        console.error('Элемент с ID "RSSI" не найден.');
        return;
    }

    if (value <= 70) {
        rssiElement.style.backgroundColor = "lightgreen"; 
    } else if (value > 70 && value <= 85) {
        rssiElement.style.backgroundColor = "lightsalmon"; 
    } else {
        rssiElement.style.backgroundColor = "lightcoral"; 
    }
}


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
    const saveButton = document.getElementById('btn3');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const collectedData = {};

            tabButtons.forEach((button, index) => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                tabContents[index].classList.add('active');

                const inputs = tabContents[index].querySelectorAll('input, select');
                inputs.forEach(input => {
                    collectedData[input.id] = input.value;
                });
            });

            const otherInputs = document.querySelectorAll('input:not(.tab-content input), select:not(.tab-content select)');
            otherInputs.forEach(input => {
                collectedData[input.id] = input.value;
            });

            console.log('Collected Data:', collectedData);

            ipcRenderer.send('save-config-modem', collectedData);
        });
    } else {
        console.error('Кнопка с ID "btn3" не найдена.');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('btn4');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    if (saveButton) {
        saveButton.addEventListener('click', () => {
            const collectedData = {};

            tabButtons.forEach((button, index) => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                tabContents[index].classList.add('active');

                const inputs = tabContents[index].querySelectorAll('input, select');
                inputs.forEach(input => {
                    collectedData[input.id] = input.value;
                });
            });

            const otherInputs = document.querySelectorAll('input:not(.tab-content input), select:not(.tab-content select)');
            otherInputs.forEach(input => {
                collectedData[input.id] = input.value;
            });

            console.log('Collected Data:', collectedData);

            ipcRenderer.send('save-file-config-modem', collectedData);

            ipcRenderer.on('save-file-config-modem-result', (event, result) => {
                if (result.success) {
                    console.log('Файл успешно сохранён:', result.filePath);
                } else {
                    console.error('Ошибка при сохранении файла:', result.error);
                }
            });
        });
    } else {
        console.error('Кнопка с ID "btn4" не найдена.');
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
            const rawLine = result.data;
            const [key, value] = rawLine.split('=').map(s => s.trim());
            console.log('Данные успешно прочитаны:', rawLine);

            const neededKeys = [
                'APN', 'USER', 'PWD', 'OP_MODE', 'PORT_SRV',
                'GSM_MODE', 'BAUDRATE', 'DATA_SIZE', 'STOP_SIZE', 'PARITY',
                'BAUDRATE3', 'DATA_SIZE3', 'STOP_SIZE3', 'PARITY3',
                'TOUT_TCP', 'TOUT_RELOAD', 'TOUT_SIM', 'TOUT_NET', 'TOUT_SRV',
                'FTP_HOST', 'FTP_USER', 'FTP_PWD', 'FTP_PORT', 'FTP_FSIZE'
            ];

            if (neededKeys.includes(key)) {
                const filteredData = { [key]: value };
                ipcRenderer.send('save-config-modem', filteredData);
            }

            document.getElementById(key).value = value;

            if (key === 'RSSI') {
                updateRSSIColor(value);
            }

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