const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.json');

function loadConfig() {
    try {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error("Error loading config:", error);
        return null;
    }
}

function saveConfig(config) {
    try {
        const data = JSON.stringify(config, null, 2);
        fs.writeFileSync(configPath, data, 'utf8');
    } catch (error) {
        console.error("Error saving config:", error);
    }
}


module.exports = {
    loadConfig,
    saveConfig
}

// const modemConfig = {
//     usbCom:
//     {
//         comPort: "COM3",
//         baudRate: 9600,
//         dataBits: 8,
//         stopBits: 1,
//         parity: "none",
//         flowControl: "none"
//     },
//     optCom: {
//         comPort: "COM4",
//         baudRate: 2400,
//         dataBits: 8,
//         stopBits: 1,
//         parity: "Even",
//         flowControl: "none"
//     },
//     tcp: {
//         ip: "128.65.55.237",
//         port: 5000,
//         timeoutOpenConn: 10000,
//         timeoutAftOpen: 200,
//     },
//     network: {
//         opMode: 1,
//         port: 5000,
//         gsmMode: 1 
//     },
//     modem: {
//         apn: "m2m30.velcom.by",
//         user: "m2m30",
//         password: "m2m30"
//     },
//     uart1: {
//         baudRate: 9600,
//         dataBits: 8,
//         stopBits: 1,
//         parity: "none",
//         flowControl: "none"
//     },
//     uart2: {
//         baudRate: 9600,
//         dataBits: 8,
//         stopBits: 1,
//         parity: "none",
//         flowControl: "none"
//     },
//     timeout: {
//         timeoutTcp: 30,
//         timeoutModem: 1,
//         timeoutSim: 60000,
//         timeoutInet: 60000
//     },
// }