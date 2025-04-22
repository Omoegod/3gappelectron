const fs = require('fs');
const path = require('path');

const configPathModem = path.join(__dirname, 'configmodem.conf');
const configPathLocal = path.join(__dirname, 'configlocal.conf');

function loadConfigModem() {
    try {
        const data = fs.readFileSync(configPathModem, 'utf8');
        const lines = data.split(/\r?\n/);
        const config = {};

        for (const line of lines) {
            if (!line || line.trim().startsWith('#')) continue; 
            const [key, ...rest] = line.split('=');
            if (key && rest.length > 0) {
                config[key.trim()] = rest.join('=').trim();
            }
        }

        return config;
    } catch (error) {
        console.error("Error loading config modem:", error);
        return null;
    }
}

function loadConfigLocal() {
    try {
        const data = fs.readFileSync(configPathLocal, 'utf8');
        const lines = data.split(/\r?\n/);
        const config = {};

        for (const line of lines) {
            if (!line || line.trim().startsWith('#')) continue; 
            const [key, ...rest] = line.split('=');
            if (key && rest.length > 0) {
                config[key.trim()] = rest.join('=').trim();
            }
        }

        return config;
    } catch (error) {
        console.error("Error loading config:", error);
        return null;
    }
}

function saveConfigModem(config) {
    const data = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    fs.writeFileSync(configPathModem, data, 'utf8');
}

function saveConfigLocal(config) {
    const data = Object.entries(config)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    fs.writeFileSync(configPathLocal, data, 'utf8');
}

module.exports = {
    loadConfigModem,
    loadConfigLocal,
    saveConfigModem,
    saveConfigLocal,
    configPathLocal,
    configPathModem
}
