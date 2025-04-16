const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    try {
      const config = await ipcRenderer.invoke('get-config');
  
      document.getElementById('comPortOpto').value = config.optCom?.comPort || "";
      document.getElementById('baudrateOpto').value = config.optCom?.baudRate || 2400;
      document.getElementById('flowControlOpto').value = config.optCom?.flowControl || 'rts';
      document.getElementById('stopBitsOpto').value = config.optCom?.stopBits || 1;
      document.getElementById('parityOpto').value = config.optCom?.parity || 'Even';
      document.getElementById('comPortUSB').value = config.usbCom?.comPort || "";
      document.getElementById('baudrateUSB').value = config.usbCom?.baudRate || 9600;
      document.getElementById('parityUSB').value = config.usbCom?.parity || "";
      document.getElementById('stopBitsUSB').value = config.usbCom?.stopBits || "";
      document.getElementById('dataBitsUSB').value = config.usbCom?.dataBits || "";
      document.getElementById('ipAddress').value = config.tcp?.ip || "";
      document.getElementById('portTcpIp').value = config.tcp?.port || "";
      document.getElementById('comPortRF232').value = config.rf232?.comPort || "";
      document.getElementById('baudrateRF232').value = config.rf232?.baudRate || "";
      document.getElementById('parityRF232').value = config.rf232?.parity || "";
      document.getElementById('stopBitsRF232').value = config.rf232?.stopBits || "";
      document.getElementById('dataBitsRF232').value = config.rf232?.dataBits || "";
     
    } catch (error) {
      console.error('Ошибка при загрузке конфигурации:', error);
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



document.addEventListener('DOMContentLoaded', async () => {
    try {
        const comPorts = await ipcRenderer.invoke('get-com-ports');

        const comPortSelects = document.querySelectorAll('select[id^="comPort"]');
        comPortSelects.forEach(select => {
            select.innerHTML = '';

            comPorts.forEach(port => {
                const option = document.createElement('option');
                option.value = port;
                option.textContent = port;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Ошибка при заполнении COM-портов:', error);
    }
});
