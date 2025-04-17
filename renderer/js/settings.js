const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', async () => {
    try {
      const config = await ipcRenderer.invoke('get-config-local');
      console.log('Полученная конфигурация:', config);
      
      document.getElementById('comPortOpto').value = config.comPortOpto || "";
      document.getElementById('baudrateOpto').value = config.baudRateOpto || 2400;
      document.getElementById('flowControlOpto').value = config.flowControlOpto || 'rts';
      document.getElementById('stopBitsOpto').value = config.stopBitsOpto || 1;
      document.getElementById('parityOpto').value = config.parityOpto || 'Even';
      document.getElementById('comPortUsb').value = config.comPortUsb || "";
      document.getElementById('baudrateUsb').value = config.baudRateUsb || 9600;
      document.getElementById('parityUsb').value = config.parityUsb || "None";
      document.getElementById('stopBitsUsb').value = config.stopBitsUsb || 1;
      document.getElementById('dataBitsUsb').value = config.dataBitsUsb || 8;
      document.getElementById('ipTcp').value = config.ipTcp || "";
      document.getElementById('portTcp').value = config.portTcp || "";
      document.getElementById('comPortRf').value = config.comPortRf || "";
      document.getElementById('baudrateRf').value = config.baudRateRf || 9600;
      document.getElementById('parityRf').value = config.parityRf || "None";
      document.getElementById('stopBitsRf').value = config.stopBitsRf || 1;
      document.getElementById('dataBitsRf').value = config.dataBitsRf || 8;
     
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


