#!/usr/bin/env node
'use strict';

/*
Relay server that receives log entries from input clients (RemoteLogStream) and forwards them to
output clients (client.js). A recent history of log entries is kept in memory so they can be sent to new connections.
*/

// Default host to listen for incoming connections to receive logs.
const defaultInputHost = '0.0.0.0';

// Default port to listen for incoming connections to receive logs.
const defaultInputPort = 18002;

// Default host to listen for incoming connections to send logs.
const defaultOutputHost = '127.0.0.1';

// Default port to listen for incoming connections to send logs.
const defaultOutputPort = 18001;

// The max number of log entries to store in memory so they can be sent to new connections.
const maxHistorySize = 1024;

// Do not relay logs with these contexts
const excludeContextsArr = ['webTraffic', 'apiTraffic', 'smtp-email'];

// Do not relay logs with these messages
const excludeMsgArr = [];

// Maps IP address to friendly name
const machineNamesOMap = {
    '127.0.0.1': 'localhost'
};

const
    net = require('net'),
    mu = require('@mintpond/mint-utils'),
    SimpleRingBuffer = require('@mintpond/mint-utils').SimpleRingBuffer;

const args = process.argv.slice(2);
if (argsArr[0] === '--help') {
    console.log(`node relay [inputHost] [inputPort] [outputHost] [outputPort]`)
    process.exit(0);
    return;
}

const inputListenHost = args[0] || defaultInputHost;
const inputListenPort = args[1] || defaultInputPort;
const outputListenHost = args[2] || defaultOutputHost;
const outputListenPort = args[3] || defaultOutputPort;

const history = new SimpleRingBuffer(maxHistorySize);
const outputClientMap = new Map();
let outputClientIds = 0;

_inputListen(inputListenHost, inputListenPort);
_outputListen(outputListenHost, outputListenPort);


function _log(entry, json) {

    if (entry.context && excludeContextsArr.indexOf(entry.context) !== -1)
        return;

    const msg = mu.isString(entry) ? entry : entry.msg;
    if (msg && excludeMsgArr.indexOf(msg) !== -1)
        return;

    history.push(json);
    for (const client of outputClientMap.values()) {
        _sendLog(client, json);
    }
}


function _relayLog(msg) {
    const json = JSON.stringify(msg);
    history.push(json);
    for (const client of outputClientMap.values()) {
        _sendLog(client, json);
    }
}


function _sendLog(client, json) {
    client.write(json + '\n');
}


function _inputListen(host, port) {

    const server = net.createServer(client => {

        const machineName = machineNamesOMap[client.remoteAddress] || client.remoteAddress;

        _relayLog(`[${machineName}] Input client connected.`);

        client.on('error', error => {
            _relayLog(`[${machineName}] Input socket error: ${JSON.stringify(error)}`);
        });

        const dataBufferArr = [];
        client.on('data', data => {

            if (!data)
                return;

            let dataStr = data.toString();
            if (!dataStr)
                return;

            dataBufferArr.push(dataStr);
            if (dataStr.endsWith('\n')) {
                dataStr = dataBufferArr.join('');
                dataBufferArr.length = 0;
            }
            else {
                return;
            }

            const entries = dataStr.split('\n').filter(entry => {
                return !!entry;
            });

            let hasErrors = false;

            entries.forEach(entryJson => {

                const entry = _parseJSON(entryJson);
                if (entry) {
                    _log(entry, entryJson);
                }
                else {
                    hasErrors = true;
                }
            });

            if (hasErrors)
                _relayLog(`[${machineName}] Input dataParseErrors from: ${dataStr}`);
        });

        client.on('close', () => {
            _relayLog(`[${machineName}] Input connection closed.`);
        });
    });

    try {
        server.listen(port, host, () => {
            _relayLog(`Listening for inputs on ${host}:${port}`);
        });
    }
    catch (e) {
        _relayLog(`Failed to listen for inputs: ${JSON.stringify({
            error: e,
            stack: e.stack
        }, null, 4)}`);
    }
}


function _outputListen(host, port) {

    const server = net.createServer(client => {

        outputClientIds++;
        client.relayId = outputClientIds;

        const machineName = machineNamesOMap[client.remoteAddress] || client.remoteAddress;
        _relayLog(`[${machineName}] Output client connected.`);

        client.on('error', error => {
            outputClientMap.delete(client.relayId);
            _relayLog(`[${machineName}] Output socket error: ${error.toString()}`);
        });

        client.on('close', () => {
            outputClientMap.delete(client.relayId);
            _relayLog(`[${machineName}] Output connection closed.`);
        });

        const historyArr = history.toArray();
        const chunksArr = mu.chunk(historyArr, 32);
        chunksArr.forEach(chunk => {
            const msg = chunk.join('\n') + '\n';
            client.write(msg);
        });
        outputClientMap.set(client.relayId, client);
    });

    try {
        server.listen(port, host, () => {
            _relayLog(`Listening for outputs on ${host}:${port}`);
        });
    }
    catch (e) {
        _relayLog(`Failed to listen for outputs: ${JSON.stringify({
            error: e,
            stack: e.stack
        }, null, 4)}`);
    }
}


function _parseJSON(json) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        _relayLog(`parseError: ${json}`);
        return null;
    }
}