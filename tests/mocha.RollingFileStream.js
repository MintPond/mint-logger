'use strict';

const
    async = require('async'),
    assert = require('assert'),
    fs = require('fs-extra'),
    RollingFileStream = require('./../libs/streams/class.RollingFileStream'),
    LoggerLevel = require('./../libs/const.LoggerLevel');

let data;
let json;


describe('RollingFileStream', () => {

    beforeEach(done => {
        data = {
            groupId: '_',
            timeMs: 1588281135000,
            process: 'process',
            context: 'context',
            host: 'host',
            ip: 'ip',
            level: LoggerLevel.INFO,
            log: {
                msg: 'message',
                prop1: 'prop1',
                prop2: 'prop2',
                prop3: 'prop3',
            }
        };
        json = JSON.stringify(data);

        fs.ensureDir('./test-logs', done);
    });

    afterEach(done => {
        fs.remove('./test-logs', () => done());
    });

    it('should not log when disabled', () => {
        const stream = new RollingFileStream({
            enabled: false,
            logDir: './test-logs',
        });
        stream._writeStream = () => { throw new Error('Should not write'); }
        stream.write(LoggerLevel.INFO, json, data);
    });

    it('should write correct data', done => {
        const stream = new RollingFileStream({
            enabled: true,
            logDir: './test-logs',
            file: 'log'
        });
        stream._getFilePath = () => { return `./test-logs/log.${stream._date.today}.log`; }
        stream._getDayStartTime = () => { return 0; }
        stream.write(LoggerLevel.INFO, json, data);

        // no callback for write completion so we'll blindly wait a while
        setTimeout(() => {
            const log = fs.readFileSync('./test-logs/log.0.log', 'utf8');
            assert.strictEqual(log, json + '\n');

            stream.end();
            done();
        }, 100);
    });

    it('should rollover when day changes', done => {
        const stream = new RollingFileStream({
            enabled: true,
            logDir: './test-logs',
            file: 'log'
        });
        stream._getFilePath = () => { return `./test-logs/log.${stream._date.today}.log`; }
        stream._getDayStartTime = () => { return 0; }

        // no callback for write completion so we'll blindly wait a while
        async.waterfall([
            wCallback => {
                stream.write(LoggerLevel.INFO, json, data);
                setTimeout(() => {
                    const logFiles = fs.readdirSync('./test-logs');
                    const hasLog0 = !!logFiles.find(file => file === 'log.0.log');
                    const hasLog1 = !!logFiles.find(file => file === 'log.1.log');
                    assert.strictEqual(hasLog0, true);
                    assert.strictEqual(hasLog1, false);
                    wCallback();
                }, 100);
            },
            wCallback => {
                stream._getDayStartTime = () => { return 1; }
                stream.write(LoggerLevel.INFO, json, data);
                setTimeout(() => {
                    const logFiles = fs.readdirSync('./test-logs');
                    const hasLog0 = !!logFiles.find(file => file === 'log.0.log');
                    const hasLog1 = !!logFiles.find(file => file === 'log.1.log');
                    assert.strictEqual(hasLog0, true);
                    assert.strictEqual(hasLog1, true);
                    wCallback();
                }, 100);
            }
        ], () => {
            stream.end();
            done();
        });
    });


    it('should rollover when file size becomes too large', function (done) {
        this.timeout(20000)


        const stream = new RollingFileStream({
            enabled: true,
            logDir: './test-logs',
            file: 'log',
            maxSizeMB: 1
        });
        stream._getFilePath = () => { return `./test-logs/log.${stream._date.today}.${stream.rollCount}.log`; }
        stream._getDayStartTime = () => { return 0; }

        for (let i = 0; i < 10000; i++) {
            stream.write(LoggerLevel.INFO, json, data);
        }

        setTimeout(() => {

            const logFiles = fs.readdirSync('./test-logs');
            const hasLog0 = !!logFiles.find(file => file === 'log.0.0.log');
            const hasLog1 = !!logFiles.find(file => file === 'log.0.1.log');

            assert.strictEqual(hasLog0, true);
            assert.strictEqual(hasLog1, true);

            stream.end();
            done();
        }, 100);
    });

});