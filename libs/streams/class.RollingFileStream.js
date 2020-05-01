'use strict';

const
    fs = require('fs-extra'),
    path = require('path'),
    precon = require('@mintpond/mint-precon'),
    mu = require('@mintpond/mint-utils'),
    LogStream = require('./abstract.LogStream'),
    LoggerLevel = require('./../const.LoggerLevel');

const NAME = 'rollingFile';


class RollingFileStream extends LogStream {

    static get NAME() { return NAME; }


    /**
     * Constructor.
     *
     * @param config
     * @param [config.enabled=true] {boolean}
     * @param [config.autoArchive=true] {boolean}
     * @param [config.level=TRACE] {string} (LoggerLevel)
     * @param [config.logDir=./logs] {string}
     * @param [config.file=log] {string}
     * @param [config.maxSizeMB=10] {number}
     * @param [archiveFn] {function} A function to call in order to archive log files.
     */
    constructor(config, archiveFn) {
        precon.notNull(config, 'config');
        precon.opt_boolean(config.enabled, 'enabled');
        precon.opt_boolean(config.autoArchive, 'autoArchive');
        precon.opt_oneOf(config.level, LoggerLevel.all, 'level');
        precon.opt_string(config.logDir, 'logDir');
        precon.opt_string(config.file, 'file');
        precon.opt_positiveInteger(config.maxSizeMB, 'maxSizeMB');
        precon.opt_funct(archiveFn, 'archiveFn');

        super(NAME);

        const _ = this;
        _._archiveFn = archiveFn;
        _._config = config;
        _._startTime = mu.now();
        _._writtenBytes = 0;

        _._date = {
            today: 0,
            count: 0
        };

        _._check = {
            today: _._getDayStartTime(),
            count: 0,
            path: null
        };
        _._stream = null;
        _._filePath = null;

        if (mu.isUndefined(config.enabled))
            config.enabled = true;

        if (mu.isUndefined(config.autoArchive))
            config.autoArchive = true;

        if (!config.level)
            config.level = LoggerLevel.TRACE;

        if (!config.logDir)
            config.logDir = './logs';

        if (!config.file)
            config.file = 'log';

        if (!config.maxSizeMB)
            config.maxSizeMB = 10;

        fs.ensureDirSync(config.logDir, 0o2775);
    }


    /**
     * Get the current file that logs are being written to.
     * @returns {null|string}
     */
    get file() { return this._filePath; }

    /**
     * Get the number of file rollovers for the current day.
     * @returns {number}
     */
    get rollCount() { return this._date.count; }


    /* Override */
    write(level, json, data) {
        precon.oneOf(level, LoggerLevel.all, 'level');
        precon.string(json, 'json');
        precon.notNull(data, 'data');

        const _ = this;

        if (!json || !_._config.enabled || !LoggerLevel.canLog(level, _._config.level))
            return;

        _._updateDateInfo(_._check);
        let isDateChanged = _._check.today !== _._date.today;
        let isCountChanged = _._check.count !== _._date.count;

        if (!_._stream || isDateChanged || isCountChanged || _._check.logDir !== _._config.logDir) {

            if (isDateChanged)
                _._check.count = 0;

            _._date.today = _._check.today;
            _._date.count = _._check.count;

            _._filePath = _._getFilePath();

            _._stream = _._createWriteStream(_._filePath, _._stream);

            _._writeStream(_._stream, json);

            if (isDateChanged && _._config.autoArchive)
                _._archiveFn && setTimeout(_._archiveFn, 7000);
        }
        else {
            _._writeStream(_._stream, json);
        }
    }


    /* Override */
    end() {
        const _ = this;
        _._stream && _._stream.end();
    }


    _updateDateInfo(info) {

        const _ = this;
        info.today = _._getDayStartTime();
        info.logDir = _._config.logDir;
        info.count = info.count || 0;

        if (_._config.maxSizeMB && _._writtenBytes >= (_._config.maxSizeMB * 1024 * 1024)) {
            info.count++;
            _._writtenBytes = 0;
        }

        return info;
    }


    _getDayStartTime() {
        return mu.getDayStartTime();
    }


    _getFilePath() {
        const _ = this;
        const file = `${_._config.file}.${mu.getUtcYmdString(_._date.today)}.${_._startTime}.${mu.padNum2(_._date.count)}.log`;
        return path.join(_._config.logDir, file);
    }


    _createWriteStream(filePath, currentStream) {
        if (currentStream)
            currentStream.end();
        return fs.createWriteStream(filePath, { flags: 'a', encoding: 'utf8' });
    }


    _writeStream(stream, json) {

        const _ = this;

        _._writtenBytes += Buffer.byteLength(json, 'utf8');

        try {
            stream.write(json + '\n');
        }
        catch (e) {
            console.error(JSON.stringify({
                error: String(e),
                json: json,
                stack: e.stack
            }, null, 4));
        }
    }
}

module.exports = RollingFileStream;