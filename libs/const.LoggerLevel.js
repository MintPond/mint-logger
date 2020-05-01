'use strict';

const LoggerLevel = {
    /**
     * Typically used to follow program execution path but tends to produce a lot of log entries.
     */
    get TRACE() { return 'trace' },
    /**
     * Used for debugging purposes.
     */
    get DEBUG() { return 'debug' },
    /**
     * Log general information.
     */
    get INFO() { return 'info' },
    /**
     * Log a warning about a non-critical issue.
     */
    get WARN() { return 'warn' },
    /**
     * Log an error or exception.
     */
    get ERROR() { return 'error' },
    /**
     * Typically used for data and messages that are not normally logged, tend to be turned on and off manually, and
     * need to override whatever the current logger level settings are. Special logs always get logged.
     */
    get SPECIAL() { return 'special' }
};

module.exports = LoggerLevel;

Object.defineProperties(LoggerLevel, {
    /**
     * Get an array of all logger levels.
     */
    all: { value: [LoggerLevel.TRACE, LoggerLevel.DEBUG, LoggerLevel.INFO, LoggerLevel.WARN, LoggerLevel.ERROR, LoggerLevel.SPECIAL] },

    /**
     * Determine if logging can occur base on the specified log levels.
     *
     * @param level {string} The log level of the entry to log.
     * @param minLevel {string} The minimum log level required.
     * @returns {boolean}
     */
    canLog: { value: canLog },

    /**
     * Convert a log level name into a number that can be used to compare levels.
     *
     * @param level {string}
     * @returns {number}
     */
    toNumber: { value: toNumber },

    /**
     * Get a log level name from a number.
     *
     * @param num {number}
     * @returns {string}
     */
    fromNumber: { value: fromNumber }
});


function canLog(level, minLevel) {
    return toNumber(level) >= toNumber(minLevel);
}


function toNumber(level) {
    switch(level) {
        case LoggerLevel.TRACE:
            return 0;
        case LoggerLevel.DEBUG:
            return 1;
        case LoggerLevel.INFO:
            return 2;
        case LoggerLevel.WARN:
            return 3;
        case LoggerLevel.ERROR:
            return 4;
        case LoggerLevel.SPECIAL:
            return 5;
        default:
            throw new Error(`Invalid logger level: ${level}`);
    }
}


function fromNumber(num) {
    switch(num) {
        case 0:
            return LoggerLevel.TRACE;
        case 1:
            return LoggerLevel.DEBUG;
        case 2:
            return LoggerLevel.INFO;
        case 3:
            return LoggerLevel.WARN;
        case 4:
            return LoggerLevel.ERROR;
        case 5:
            return LoggerLevel.SPECIAL;
        default:
            throw new Error(`Invalid logger level number: ${num}`);
    }
}