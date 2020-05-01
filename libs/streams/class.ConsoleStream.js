'use strict';

const
    colors = require('colors'),
    dateFormat = require('dateformat'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    LogStream = require('./abstract.LogStream'),
    LoggerLevel = require('./../const.LoggerLevel');

const NAME = 'console';


class ConsoleStream extends LogStream {

    static get NAME() { return NAME; }


    /**
     * Constructor.
     *
     * @param config
     * @param [config.enabled=true] {boolean}
     * @param [config.useColors=true] {boolean}
     * @param [config.level=TRACE] {string} (LoggerLevel)
     * @param [config.timeFormat=yy-mm-dd HH:MM:ss Z] {string}
     * @param [config.tags=['timeMs', 'host', 'ip', 'context', 'process']] {string[]}
     * @param [config.excludeProperties=[]] {string[]}
     * @param [stdout] {WriteStream}
     * @param [stderr] {WriteStream}
     */
    constructor(config, stdout, stderr) {
        precon.obj(config, 'config');
        precon.opt_boolean(config.enabled, 'enabled');
        precon.opt_boolean(config.useColors, 'useColors');
        precon.opt_oneOf(config.level, LoggerLevel.all, 'level');
        precon.opt_string(config.timeFormat, 'timeFormat');
        precon.opt_arrayOf(config.tags, 'string', 'tags');
        precon.opt_arrayOf(config.excludeProperties, 'string', 'excludeProperties');

        super(NAME);

        const _ = this;
        _._config = config;
        _._tagBufferArr = [];
        _._msgBufferArr = [];
        _._propBufferArr = [];

        if (mu.isUndefined(config.enabled))
            config.enabled = true;

        if (mu.isUndefined(config.useColors))
            config.useColors = true;

        if (!config.timeFormat)
            config.timeFormat = 'UTC:yy-mm-dd HH:MM:ss Z';

        if (!config.tags)
            config.tags = ['timeMs', 'host', 'ip', 'context', 'process'];

        if (!config.excludeProperties)
            config.excludeProperties = [];

        if (!config.level)
            config.level = LoggerLevel.TRACE;

        _._stdout = stdout || process.stdout;
        _._stderr = stderr || process.stderr;
    }


    /* Override */
    write(level, json, data) {
        precon.oneOf(level, LoggerLevel.all, 'level');
        precon.string(json, 'serialized');
        precon.notNull(data, 'data');

        const _ = this;
        if (!json || !_._config.enabled || !LoggerLevel.canLog(level, _._config.level))
            return;

        if (level !== data.level)
            throw new Error('Level mismatch');

        _._tagBufferArr.length = 0;
        _._msgBufferArr.length = 0;
        _._propBufferArr.length = 0;

        _._config.tags.forEach(tagName => {

            if (!(tagName in data))
                return; // continue

            if (tagName === 'timeMs') {
                const date = new Date(data.timeMs);
                _._tagBufferArr.push(`[${dateFormat(date, _._config.timeFormat)}] `);
            }
            else {
                _._tagBufferArr.push(`[${data[tagName]}] `);
            }
        });

        _._tagBufferArr.push(`${_.$getLevelString(data.level)}: `);

        if (!Array.isArray(data.log) && mu.isObject(data.log)) {
            Object.keys(data.log).forEach(name => {

                // message will be printed elsewhere
                if (name === 'msg')
                    return; //continue

                // disregard private properties
                if (name[0] === '_')
                    return; // continue

                // disregard functions
                if (mu.isFunction(data[name]))
                    return; //continue

                // disregard excluded
                if (_._config.excludeProperties.indexOf(name) !== -1)
                    return; // continue

                const value = mu.isObject(data.log[name]) || mu.isArray(data.log[name])
                    ? JSON.stringify(data.log[name])
                    : data.log[name];

                _._propBufferArr.push(`${name}: ${value}; `);
            });
        }

        _._msgBufferArr.push(_._addTagColor(data.level, _._tagBufferArr.join('')));

        const msg = mu.isString(data.log) ? data.log : data.log.msg;
        msg && _._msgBufferArr.push(_._msgToColor(data.level, String(msg).replace('\\n', '\n'), 40));

        if (_._propBufferArr.length)
            _._msgBufferArr.push(_._propsToColor(data.level, ` { ${_._propBufferArr.join('')}}`));

        _._msgBufferArr.push('\n');

        if (data.level === LoggerLevel.ERROR) {
            _._stderr.write(_._msgBufferArr.join(''));
        }
        else {
            _._stdout.write(_._msgBufferArr.join(''));
        }
    }


    _addTagColor(level, text) {

        const _ = this;
        if (!_._config.useColors)
            return text;

        switch (level) {
            case LoggerLevel.TRACE:
                return text.gray;

            case LoggerLevel.DEBUG:
                return text.blue;

            case LoggerLevel.INFO:
                return text.green;

            case LoggerLevel.WARN:
                return text.yellow;

            case LoggerLevel.ERROR:
                return text.red;

            case LoggerLevel.SPECIAL:
                return text.magenta;

            default:
                throw new Error(`Unrecognized logger level: ${level}`);
        }
    }


    _msgToColor(level, text) {

        const _ = this;
        if (!_._config.useColors)
            return text;

        switch (level) {
            case LoggerLevel.TRACE:
            case LoggerLevel.DEBUG:
            case LoggerLevel.INFO:
                return text.white;
            case LoggerLevel.WARN:
                return text.yellow;
            case LoggerLevel.ERROR:
                return text.red;
            case LoggerLevel.SPECIAL:
                return text.magenta;

            default:
                throw new Error(`Unrecognized logger level: ${level}`);
        }
    }

    _propsToColor(level, text) {

        const _ = this;
        if (!_._config.useColors)
            return text;

        switch (level) {
            case LoggerLevel.TRACE:
            case LoggerLevel.DEBUG:
            case LoggerLevel.INFO:
            case LoggerLevel.WARN:
            case LoggerLevel.ERROR:
                return text.gray;
            case LoggerLevel.SPECIAL:
                return text.white;

            default:
                throw new Error(`Unrecognized logger level: ${level}`);
        }
    }
}

module.exports = ConsoleStream;