#!/usr/bin/env node
'use strict';

/*
Connects to a log server or log relay server and prints the log entries it receives onto stdout.
 */

// Default host name of the log server to connect to
const defaultHost = '127.0.0.1';

// Default Port number of the log server to connect to
const defaultPort = 18001

// show these property values as tags
const tagPropertiesArr = ['timeMs', 'host', 'ip', 'context', 'user', 'process'];

// Do not show logs with these contexts
const excludeContextsArr = ['webTraffic', 'apiTraffic', 'smtp-email'];

// Do not show logs with these messages
const excludeMsgArr = [];

// Do not show these properties with these names
const excludeLogPropertiesArr = [];

// The format of timeMs tag
const timeFormat = 'yyyy-mm-dd HH:MM:ss Z';

const
    net = require('net'),
    dateFormat = require('dateformat');

require('colors');

const argsArr = process.argv.slice(2);
if (argsArr[0] === '--help') {
    console.log(`node client [hostName] [port]`)
    process.exit(0);
    return;
}

const connectHost = argsArr[0] || defaultHost;
const connectPort = argsArr [1] || defaultPort;

_connect(connectHost, connectPort);


function _connect(host, port) {

    const client = net.connect(port, host, () => {

        client.on('error', error => {

            if (error.code === 'ECONNREFUSED') {
                console.error(`Failed to connect to log server at ${host}:${port}`);
            }
            else {
                console.error(`Socket error ${JSON.stringify(error)}`);
            }
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
                    _printEntry(entry, entryJson);
                }
                else {
                    hasErrors = true;
                }
            });

            if (hasErrors) {
                console.log(`dataParseErrors from: ${dataStr}`);
            }
        });
    });

    client.on('close', () => {
        setTimeout(() => {
            process.exit(0);
        }, 1);
    });
}


function _printEntry(entry) {

    if (typeof entry === 'string') {
        console.log(entry.gray);
        return;
    }

    if (entry.context && excludeContextsArr.indexOf(entry.context) !== -1)
        return;

    const timeMs = entry.timeMs || Date.now();
    const log = entry.log ? entry.log : entry;
    const msg = typeof log === 'string' ? log : log.msg;
    if (msg && excludeMsgArr.indexOf(msg) !== -1)
        return;

    let tags = '';
    let props = '';
    let output = '';



    tagPropertiesArr.forEach(propertyName => {
        const tag = entry[propertyName];
        if (!tag)
            return; // continue

        if (propertyName === 'timeMs') {
            tags += `[${dateFormat(timeMs, timeFormat)}] `;
        }
        else {
            tags += `[${tag}] `;
        }
    });

    tags += `${_getLevelString(entry.level)}: `;

    if (Array.isArray(log)) {
        props += JSON.stringify(log, null, 2);
    }
    else if (typeof log === 'object') {

        Object.keys(log).forEach(name => {

            if (typeof log[name] === 'function')
                return;

            if (excludeLogPropertiesArr.indexOf(name) !== -1)
                return;

            if (name[0] === '_')
                return;

            const value = typeof log[name] === 'object' || Array.isArray(log[name])
                ? JSON.stringify(log[name])
                : log[name];

            props += `${name}: ${value}; `;
        });
    }

    output += _levelToTagColor(entry.level, tags);

    if (msg)
        output += _levelToMsgColor(entry.level, String(msg).replace('\\n', '\n'));

    if (props)
        output += ` { ${props}}`.gray;

    process.stdout.write(output + '\n');
}


function _getLevelString(level) {

    switch(level) {
        case 'trace':
            return 'TRAC';
        case 'debug':
            return 'DBUG';
        case 'info':
            return 'INFO';
        case 'warn':
            return 'WARN';
        case 'error':
            return 'ERRR';
        case 'special':
            return 'SPEC';
        default:
            return 'INFO';
    }
}


function _levelToTagColor(level, text) {

    switch(level) {
        case 'trace':
            return text.gray;
        case 'debug':
            return text.blue;
        case 'info':
            return text.green;
        case 'warn':
            return text.yellow;
        case 'error':
            return text.red;
        case 'special':
            return text.special;
        default:
            return text.white;
    }
}


function _levelToMsgColor(level, text) {

    switch (level) {
        case 'trace':
            return text.gray;
        case 'debug':
        case 'info':
        case 'special':
            return text.white;
        case 'warn':
            return text.yellow;
        case 'error':
            return text.red;
        default:
            return text.white;
    }
}


function _parseJSON(json) {
    try {
        return JSON.parse(json);
    }
    catch (e) {
        console.log(`parseError: ${json}`);
        return null;
    }
}










