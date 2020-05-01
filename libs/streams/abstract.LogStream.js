'use strict';

const
    precon = require('@mintpond/mint-precon'),
    LoggerLevel = require('./../const.LoggerLevel');


class LogStream {

    /**
     * Constructor.
     *
     * @param name {string}
     */
    constructor(name) {
        precon.string(name, 'name');

        const _ = this;
        _._name = name;
    }

    /**
     * Get the name of the stream type.
     * @returns {string}
     */
    get name() { return this._name; }


    /**
     * Write log to the stream.
     *
     * @param level {string} (LoggerLevel)s
     * @param json {string} JSON serialized data.
     * @param data {*}
     */
    write(level, json, data) {
        throw new Error('Not implemented');
    }

    /**
     * End the stream.
     */
    end() {}


    $getLevelString(level) {

        switch(level) {
            case LoggerLevel.TRACE:
                return 'TRAC';
            case LoggerLevel.DEBUG:
                return 'DBUG';
            case LoggerLevel.INFO:
                return 'INFO';
            case LoggerLevel.WARN:
                return 'WARN';
            case LoggerLevel.ERROR:
                return 'ERRR';
            case LoggerLevel.SPECIAL:
                return '****';
            default:
                throw new Error(`Unrecognized logger level: ${level}`);
        }
    }
}

module.exports = LogStream;