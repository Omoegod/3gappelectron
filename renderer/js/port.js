const { SerialPort } = require('serialport');
const net = require('net');
const { log } = require('console');

const activeListeners = new WeakMap();

const createPort = (config, connType) => {
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
        const port = new SerialPort({
            path: portPath,
            ...portOptions,
            autoOpen: false
        });
        return { port }
    } else if (connType === 2) {
        portPath = config.comPortUsb;
        portOptions = {
            baudRate: parseInt(config.baudRateUsb, 10),
            dataBits: parseInt(config.dataBitsUsb, 10),
            stopBits: parseInt(config.stopBitsUsb, 10),
            parity: config.parityUsb
        };
        const port = new SerialPort({
            path: portPath,
            ...portOptions,
            autoOpen: false
        });
        return { port }
    } else if (connType === 3) {
        portPath = config.comPortRf;
        portOptions = {
            baudRate: parseInt(config.baudRateRf, 10),
            dataBits: parseInt(config.dataBitsRf, 10),
            stopBits: parseInt(config.stopBitsRf, 10),
            parity: config.parityRf
        };
        const port = new SerialPort({
            path: portPath,
            ...portOptions,
            autoOpen: false
        });
        return { port }
    } else if (connType === 4) {
        portOptions = {
            host: config.ipTcp,
            port: config.portTcp,
            timeout: 2000
        };

        const client = new net.Socket();
        client.setTimeout(portOptions.timeout);


        return { client, portOptions };
    }


}

const openPort = (port) => {
    return new Promise((resolve, reject) => {
        port.open((err) => {
            if (err) return reject(err);
            console.log('Port open:', port.path);
            resolve();
        });
    });
};

const closePort = (port) => {
    return new Promise((resolve, reject) => {
        port.close((err) => {
            if (err) {
                console.error('Error closing port:', err.message);
                reject(err);
            } else {
                console.log('Port closed:', port.path);
                resolve();
            }
        });
    });
};


const sendMessage = (port, message, label) => {
    return new Promise((resolve, reject) => {
        log(`Sending message (${label}):`, message.toString('hex'));
        port.write(message, (err) => {
            if (err) {
                console.error(`Sending error (${label}):`, err.message);
                reject(err);
            } else {
                console.log(`Message sent (${label})`);
                resolve();
            }
        });
    });
};

const waitForResponse = (port, checkFn, timeoutMs, label) => {
    return new Promise((resolve, reject) => {
        let buffer = Buffer.alloc(0);
        const timeout = setTimeout(() => {
            port.removeAllListeners('data');
            console.warn(`Timeout waiting for ${label}`);
            reject(new Error(`Timeout: ${label}`));
        }, timeoutMs);

        port.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);
            console.log(`Received data (${label}):`, data.toString('hex'));
            if (checkFn(buffer)) {
                clearTimeout(timeout);
                port.removeAllListeners('data');
                resolve(buffer);
            }
        });
    });
};

function waitForResponseWithSilence(port, silenceMs = 50, timeoutMs = 3000, tag = '') {
    return new Promise((resolve, reject) => {
        if (activeListeners.has(port)) {
            port.off('data', activeListeners.get(port)); // снять предыдущего
        }

        let received = Buffer.alloc(0);
        let silenceTimeout;
        let globalTimeout;

        const cleanup = () => {
            clearTimeout(silenceTimeout);
            clearTimeout(globalTimeout);
            port.off('data', onData);
            activeListeners.delete(port);
        };

        const onData = (data) => {
            received = Buffer.concat([received, data]);
            console.log(`Received data (${tag}):`, data.toString());

            clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
                console.log(`[${tag}] Silence detected, response complete`);
                cleanup();
                resolve(received);
            }, silenceMs);
        };

        globalTimeout = setTimeout(() => {
            console.warn(`Global timeout waiting for ${tag}`);
            cleanup();
            reject(new Error(`[${tag}] Global timeout waiting for response`));
        }, 3000);

        port.on('data', onData);
        activeListeners.set(port, onData); // запомнить, чтобы потом снять
    });
}



module.exports = {
    openPort,
    createPort,
    closePort,
    sendMessage,
    waitForResponse,
    waitForResponseWithSilence

};  