'use strict';

const ForkMessageType = {
    /**
     * Sends logger level between processes.
     */
    get LOGGER_LEVEL() { return 'logger-level' },
    /**
     * Request the logger level from a process.
     */
    get GET_LOGGER_LEVEL() { return 'logger-level-request' },
    /**
     * A log sent from a fork process to the master.
     */
    get LOG() { return 'logger-log' }
};

module.exports = ForkMessageType;