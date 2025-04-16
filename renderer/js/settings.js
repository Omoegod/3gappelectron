const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Удаляем активный класс со всех кнопок и контента
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Добавляем активный класс к текущей кнопке и соответствующему контенту
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
