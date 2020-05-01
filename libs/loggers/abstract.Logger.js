'use strict';

const
    EventEmitter = require('events'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    pu = require('@mintpond/mint-utils').prototypes,
    LoggerLevel = require('./../const.LoggerLevel');


class Logger extends EventEmitter {

    /**
     * Constructor.
     *
     * @param groupId {string} An ID for the logger group. This ensures that multiple master loggers will only handle
     * logs from fork workers with the same groupId.
     * @param [contextName] {string} The name of the context.
     * @param [rootLogger] {Logger} The root logger instance.
     */
    constructor(groupId, contextName, rootLogger) {
        precon.string(groupId, 'groupId');
        precon.opt_string(contextName, 'context');
        precon.opt_instanceOf(rootLogger, Logger, 'rootLogger');

        super();

        const _ = this;
        _._groupId = groupId;
        _._contextName = contextName || '';
        _._rootLogger = rootLogger || _;
        _._localLevel = LoggerLevel.TRACE;
    }


    /**
     * Name of event to emit when a trace is logged.
     * @returns {string}
     */
    static get EVENT_LOG_TRACE() { return 'log-trace' }

    /**
     * Name of event to emit when a debug is logged.
     * @returns {string}
     */
    static get EVENT_LOG_DEBUG() { return 'log-debug' }

    /**
     * Name of event to emit when info is logged.
     * @returns {string}
     */
    static get EVENT_LOG_INFO() { return 'log-info' }

    /**
     * Name of event to emit when a warning is logged.
     * @returns {string}
     */
    static get EVENT_LOG_WARN() { return 'log-warn' }

    /**
     * Name of event to emit when an error is logged.
     * @returns {string}
     */
    static get EVENT_LOG_ERROR() { return 'log-error' }

    /**
     * Name of event to emit when an error is logged.
     * @returns {string}
     */
    static get EVENT_LOG_SPECIAL() { return 'log-special' }


    /**
     * Get the ID of the logger group.
     * @returns {string}
     */
    get groupId() { return this._groupId; }

    /**
     * The name of the logger context
     * @returns {string}
     */
    get contextName() { return this._contextName; }

    /**
     * Get the current logger level implemented by the instance.
     * @returns {string}
     */
    get level() { return this._rootLogger._localLevel; }
    set level(level) {
        precon.oneOf(level, LoggerLevel.all, 'level');
        this._rootLogger._localLevel = level;
    }

    /**
     * Determine if the logger can log traces.
     * @return {boolean}
     */
    get canTrace() { return LoggerLevel.toNumber(this.level) <= LoggerLevel.toNumber(LoggerLevel.TRACE); }

    /**
     * Determine if the logger can log debugs.
     * @return {boolean}
     */
    get canDebug() { return LoggerLevel.toNumber(this.level) <= LoggerLevel.toNumber(LoggerLevel.DEBUG); }

    /**
     * Determine if the logger can log info.
     * @return {boolean}
     */
    get canInfo() { return LoggerLevel.toNumber(this.level) <= LoggerLevel.toNumber(LoggerLevel.INFO); }

    /**
     * Determine if the logger can log warnings.
     * @return {boolean}
     */
    get canWarn() { return LoggerLevel.toNumber(this.level) <= LoggerLevel.toNumber(LoggerLevel.WARN); }

    /**
     * Determine if the logger can log errors.
     * @return {boolean}
     */
    get canError() { return LoggerLevel.toNumber(this.level) <= LoggerLevel.toNumber(LoggerLevel.ERROR); }

    /**
     * Get the root logger with the root context.
     * @returns {Logger}
     */
    get rootLogger() { return this._rootLogger; }


    /**
     * Create a new logger instance with a sub context of the current instance.
     * @param contextName {string}
     * @returns {Logger}
     */
    createLogger(contextName) {
        throw new Error('Not implemented')
    }


    /**
     * Log a trace.
     * @param msg {string|object}
     */
    trace(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.TRACE, msg);
    }


    /**
     * Log a debug.
     * @param msg {string|object}
     */
    debug(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.DEBUG, msg);
    }


    /**
     * Log info.
     * @param msg {string|object}
     */
    info(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.INFO, msg);
    }


    /**
     * Log a warning.
     * @param msg {string|object}
     */
    warn(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.WARN, msg);
    }


    /**
     * Log an error.
     * @param msg {string|object}
     */
    error(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.ERROR, msg);
    }


    /**
     * Log a special message. These are always displayed in the log regardless of level.
     * @param msg {string|object}
     */
    special(msg) {
        precon.notNull(msg, 'msg');

        const _ = this;
        _.$logLevel(LoggerLevel.SPECIAL, msg);
    }


    $log(level, log, logStack) {
        throw new Error('Not implemented');
    }


    $logLevel(level, msg) {

        const _ = this;

        if (!LoggerLevel.canLog(level, _.level))
            return;

        let logStack = undefined;

        // write errors to console
        if (level === LoggerLevel.ERROR) {

            logStack = new Error('log stack').stack.split('\n').map(str => { return str.trim(); });

            if (mu.isString(msg.stack))
                msg.stack = msg.stack.split('\n').map(str => { return str.trim(); });
        }

        _.$log(level, msg, logStack);

        _.$emitEvent(level, msg, logStack);
    }


    $emitEvent(level, msg, logStack) {

        const _ = this;

        switch (level) {

            case LoggerLevel.TRACE:
                _.emit(Logger.EVENT_LOG_TRACE, { message: msg, level: level, logStack: logStack });
                break;

            case LoggerLevel.DEBUG:
                _.emit(Logger.EVENT_LOG_DEBUG, { message: msg, level: level, logStack: logStack });
                break;

            case LoggerLevel.INFO:
                _.emit(Logger.EVENT_LOG_INFO, { message: msg, level: level, logStack: logStack });
                break;

            case LoggerLevel.WARN:
                _.emit(Logger.EVENT_LOG_WARN, { message: msg, level: level, logStack: logStack });
                break;

            case LoggerLevel.ERROR:
                _.emit(Logger.EVENT_LOG_ERROR, { message: msg, level: level, logStack: logStack });
                break;

            case LoggerLevel.SPECIAL:
                _.emit(Logger.EVENT_LOG_SPECIAL, { message: msg, level: level, logStack: logStack });
                break;
        }
    }


    static [Symbol.hasInstance](obj) {
        return pu.isInstanceOfByName(obj, 'Logger') &&
            pu.isFunction(obj.createLogger) &&
            pu.isFunction(obj.trace) &&
            pu.isFunction(obj.debug) &&
            pu.isFunction(obj.info) &&
            pu.isFunction(obj.warn) &&
            pu.isFunction(obj.error) &&
            pu.isFunction(obj.special) &&
            pu.hasGetters(obj,
                'canTrace', 'canDebug', 'canWarn', 'canInfo', 'canError',
                'level', 'groupId', 'contextName', 'rootLogger');
    }
}

module.exports = Logger;