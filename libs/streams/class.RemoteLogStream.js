'use strict';

const
    async = require('async'),
    net = require('net'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    LogStream = require('./abstract.LogStream'),
    LoggerLevel = require('./../const.LoggerLevel');

const NAME = 'remoteLog';


class RemoteLogStream extends LogStream {

    static get NAME() { return NAME; }


    /**
     * Constructor.
     *
     * @param config
     * @param [config.enabled=true] {boolean}
     * @param [config.level=INFO] {string} (LoggerLevel)
     */
    constructor(config) {
        precon.notNull(config, 'config');
        precon.opt_boolean(config.enabled, 'enabled');
        precon.opt_oneOf(config.level, LoggerLevel.all, 'level');

        super(NAME);

        const _ = this;
        _._config = config;
        _._socketMap = new Map();
        _._listenersArr = [];
        _._total = 0;

        if (mu.isUndefined(config.enabled))
            config.enabled = true;

        if (!config.level)
            config.level = LoggerLevel.TRACE;

        _.initRemotes();
    }


    /**
     * Listen for log clients and connect to remote log clients.
     * @param [conf] {object}
     */
    initRemotes(conf) {

        const _ = this;
        conf = conf || _._config;

        _.clear();

        if (Array.isArray(conf.listen)) {
            conf.listen.forEach(listenInfo => {
                _.listen(listenInfo.host, listenInfo.port);
            });
        }
        else if (conf.listen) {
            _.listen(conf.listen.host, conf.listen.port);
        }

        if (Array.isArray(conf.connect)) {
            conf.connect.forEach(connectInfo => {
                _.connect(connectInfo.host, connectInfo.port);
            });
        }
        else if (conf.connect) {
            _.connect(conf.connect.host, conf.connect.port);
        }
    }


    /**
     * Listen for log clients.
     *
     * @param host {string}
     * @param listenPort {port}
     */
    listen(host, listenPort) {
        precon.string(host, 'host');
        precon.minMaxInteger(listenPort, 1, 65535, 'port');

        const _ = this;
        const listener = new Listener(host, listenPort, _);
        _._listenersArr.push(listener);
        listener.start();
    }


    /**
     * Disconnect all clients and clear log servers.
     *
     * @param [callback] {function()}
     */
    clear(callback) {
        precon.opt_funct(callback, 'callback');

        const _ = this;

        async.each(_._listenersArr, (listener, eachCallback) => {
            listener.stop(() => {
                eachCallback();
            });
        }, () => {

            for (const socket of _._socketMap.values()) {
                if (socket.timeoutHandle) {
                    clearTimeout(socket.timeoutHandle);
                }
                socket.isEnded = true;
                socket.end();
            }
            _._socketMap.clear();
            callback && callback();
        });
    }


    /**
     * Connect to a remote log server or relay.
     *
     * @param host {string}
     * @param port {number}
     */
    connect(host, port) {
        precon.string(host, 'host');
        precon.minMaxInteger(port, 1, 65535, 'port');

        const _ = this;
        const socketKey = `connect:${host}:${port}`;

        let socket = _._socketMap.get(socketKey);
        if (socket) {
            socket.isEnded = true;
            socket.end();
        }

        socket = net.connect(port, host, () => {
            console.log(`Connected to log stream host: ${host}:${port}`);
        });

        _._socketMap.set(socketKey, socket);

        socket.on('error', error => {
            if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
                console.error((`Log stream host socket error: ${error.code} ${JSON.stringify(error)} ${error.stack}`).gray);
            }
        });

        socket.on('close', () => {
            socket.isClosed = true;
            !socket.isEnded && (socket.timeoutHandle = setTimeout(() => {
                _.connect(host, port);
            }, 3000));
        });
    }


    /* Override */
    write(level, serialized, data) {
        precon.oneOf(level, LoggerLevel.all, 'level');
        precon.string(serialized, 'serialized');
        precon.notNull(data, 'data');

        const _ = this;
        if (!serialized || !_._config.enabled || !LoggerLevel.canLog(level, _._config.level))
            return;

        for (const socket of _._socketMap.values()) {
            if (!socket.isClosed)
                socket.write(`${serialized}\n`);
        }
    }
}


class Listener {

    constructor(host, port, logStream) {

        const _ = this;
        _._host = host;
        _._port = port;
        _._ownSocketsMap = new Map();
        _._server = null;
        _._isListening = false;
        _._logStream = logStream;
    }


    start() {

        const _ = this;

        _._server = net.createServer(socket => {

            _._logStream._total++;
            const socketKey = `client${_._logStream._total}`;

            _._ownSocketsMap.set(socketKey, socket);
            _._logStream._socketMap.set(socketKey, socket);

            socket.on('close', () => {
                _._removeClient(socketKey);
            });

            socket.on('error', err => {
                _._removeClient(socketKey);
            });
        });

        try {
            _._isListening = true;
            _._server.listen(_._port, _._host, () => {});
        }
        catch (e) {
            //logger.error('Failed to start log server: ' + JSON.stringify({
            //    error: e,
            //    stack: e.stack
            //}, null, 4));
        }
    }


    stop(callback) {
        precon.opt_funct(callback, 'callback');

        const _ = this;
        if (_._isListening) {
            try {
                _._server.close(() => {
                    callback && callback();
                });
            }
            catch (e) {
                console.error('Error while closing log server: ' + JSON.stringify({
                    error: String(e),
                    stack: e.stack
                }, null, 4))
            }
        }

        for (const [key, socket] of _._ownSocketsMap.entries()) {
            socket.end();
            _._removeClient(key);
        }

        if (!_._isListening) {
            callback && callback();
        }

        _._isListening = false;
    }


    _removeClient(socketKey) {
        const _ = this;
        _._ownSocketsMap.delete(socketKey);
        _._logStream._socketMap.delete(socketKey);
    }
}

module.exports = RemoteLogStream;