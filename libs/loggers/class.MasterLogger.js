'use strict';

const
    os = require('os'),
    path = require('path'),
    cluster = require('cluster'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    Logger = require('./abstract.Logger'),
    LoggerLevel = require('./../const.LoggerLevel'),
    ForkMessageType = require('./../const.ForkMessageType'),
    LogArchiver = require('./../class.LogArchiver'),
    ConsoleStream = require('./../streams/class.ConsoleStream'),
    RemoteLogStream = require('./../streams/class.RemoteLogStream'),
    RollingFileStream = require('./../streams/class.RollingFileStream');

const HOSTNAME = os.hostname();
const USERNAME = os.userInfo().username;
const EXTERNAL_IP = mu.getIPv4() || mu.getIPv6();


class MasterLogger extends Logger {

    /**
     * Constructor.
     *
     * @param groupId {string}
     * @param [contextName] {string}
     * @param [rootLogger] {MasterLogger}
     */
    constructor(groupId, contextName, rootLogger) {
        precon.string(groupId, 'groupId');
        precon.opt_string(contextName, 'context');
        precon.opt_instanceOf(rootLogger, MasterLogger, 'rootLogger');

        super(groupId, contextName || 'master', rootLogger);

        const _ = this;
        _._configOMap = {};
        _._rollingFileStream = null;
        _._consoleStream = null;
        _._remoteLogSteam = null;
        _._baseLog = {};
        _._archiver = new LogArchiver();
        _._streamsArr = rootLogger ? rootLogger._streamsArr : [];

        if (!rootLogger) {
            Object.keys(cluster.workers).forEach(workerId => {
                const worker = cluster.workers[workerId];
                _._listenToWorker(_, worker);
            });
            cluster.on('fork', _._listenToWorker.bind(_, _));
        }
    }


    /* Override */
    createLogger(contextName) {
        precon.string(contextName, 'contextName');

        const _ = this;
        contextName = _.contextName ? `${_.contextName}.${contextName}` : contextName;
        return new MasterLogger(_.groupId, contextName, _.rootLogger || _);
    }


    /* Override */
    $log(level, log, logStack) {
        const _ = this;

        if (LoggerLevel.toNumber(level) < LoggerLevel.toNumber(_.level))
            return;

        _.$masterLog(process.title, process.pid, _.contextName, level, log, logStack);
    }


    /**
     * Configure the logger.
     * Only use on the root logger.
     *
     * @param config
     * @param config.level {string} (LoggerLevel)
     * @param config.baseLog {object}
     * @param config.streams {object[]}
     * @param config.streams[].name {string}
     *
     */
    configure(config) {
        precon.notNull(config, 'config');
        precon.opt_oneOf(config.level, LoggerLevel.all, 'level');
        precon.opt_obj(config.baseLog, 'baseLog')

        const _ = this;

        if (_._rootLogger !== _)
            throw new Error(`Only root logger can be configured.`);

        _._localLevel = config.level || LoggerLevel.INFO;

        // extend baseLog
        _._baseLog = config.baseLog || {};

        // unload current streams
        _._streamsArr.forEach(stream => {
            stream.end();
        });
        _._streamsArr.length = 0;

        // load streams specified in config
        if (Array.isArray(config.streams))
            _._loadStreams(config.streams);

        // update cluster worker logger levels
        Object.keys(cluster.workers).forEach(workerId => {
            const worker = cluster.workers[workerId];
            worker.send({
                groupId: _.groupId,
                type: ForkMessageType.LOGGER_LEVEL,
                level: _.level
            });
        });
    }


    archive(callback) {
        precon.opt_funct(callback, 'callback');

        const _ = this;
        if (_._archiver.isBusy) {
            callback && callback(null, false);
            return false;
        }

        const filePath = `./logs/archive.${mu.getUtcYmdString()}.${mu.now()}.tar.gz`;

        _._archiver.archive({
            targetFile: filePath,
            shouldDeleteLogs: true,
            ignoreFn: name => {
                const currRollFile = _._rollingFileStream && _._rollingFileStream.file
                    ? path.basename(_._rollingFileStream.file)
                    : null;

                return path.extname(name) === '.gz'
                    || (currRollFile && path.basename(name) === currRollFile);
            },
            clearFn: name => {
                const basename = path.basename(name);
                return basename === 'err.log' || basename === 'forever.log';
            },
            callback: () => {
                callback && callback(null, filePath);
            }
        });
        return true;
    }


    $masterLog(processTitle, pid, contextName, level, log, logStack) {

        const _ = this;

        const data = {
            timeMs: Date.now(),
            ip: EXTERNAL_IP,
            host: HOSTNAME,
            user: USERNAME,
            process: processTitle || process.title,
            pid: pid || process.pid,
            context: contextName,
            level: level,
            log: log,
            logStack: logStack,
            ..._._baseLog
        };
        const json = JSON.stringify(data);

        _._streamsArr.forEach(stream => {
            stream.write(level, json, data);
        });
    }


    /* Override */
    $emitEvent(level, msg) {

        const _ = this;
        if (_.rootLogger !== _) {
            // emit local events
            super.$emitEvent(level, msg);
        }
        // emit events of all instances on root logger
        super.$emitEvent.bind(_.rootLogger, level, msg)();
    }


    _listenToWorker(logger, worker) {

        const _ = this;

        worker.on('message', message => {

            if (message.groupId !== _.groupId)
                return;

            switch (message.type) {

                case ForkMessageType.LOG:
                    logger.$masterLog(message.process, message.pid, message.contextName, message.level, message.log, message.logStack);
                    _.$emitEvent(message.level, message);
                    break;

                case ForkMessageType.GET_LOGGER_LEVEL:
                    worker.send({
                        groupId: _.groupId,
                        type: ForkMessageType.LOGGER_LEVEL,
                        level: logger.level
                    });
                    break;
            }
        });
    }


    _loadStreams(streamsConfig) {

        const _ = this;
        streamsConfig.forEach(config => {

            let stream;

            if (mu.isUndefined(config.enabled))
                config.enabled = true;

            switch (config.name) {

                case ConsoleStream.NAME:
                    _._consoleStream = stream = new ConsoleStream(config);
                    break;

                case RemoteLogStream.NAME:
                    _._remoteLogSteam = stream = new RemoteLogStream(config);
                    break;

                case RollingFileStream.NAME:
                    _._rollingFileStream = stream = new RollingFileStream(config, _.archive.bind(_));
                    break;

                default:
                    return;
            }

            _._streamsArr.push(stream);
        });
    }
}

module.exports = MasterLogger;