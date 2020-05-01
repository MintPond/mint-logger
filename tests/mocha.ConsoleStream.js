'use strict';

const
    assert = require('assert'),
    ConsoleStream = require('./../libs/streams/class.ConsoleStream'),
    LoggerLevel = require('./../libs/const.LoggerLevel');

let json;
let data;

describe('ConsoleStream', () => {

    beforeEach(() => {
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
    });

    it('should not log when disabled', () => {
        const stdout = () => { throw new Error('Unexpected out'); };
        const stderr = () => { throw new Error('Unexpected err'); };
        const stream = new ConsoleStream({ enabled: false }, stdout, stderr);
        stream.write(LoggerLevel.INFO, json, data);
    });

    it('should output correct string to console', () => {
        const stdout = {write: (msg) => {
                assert.strictEqual(msg,
                    '[20-04-30 21:12:15 UTC] [host] [ip] [context] [process] INFO: message { prop1: prop1; prop2: prop2; prop3: prop3; }\n');
            }};
        const stderr = { write: () => { throw new Error('Unexpected err'); }};
        const stream = new ConsoleStream({
            enabled: true,
            useColors: false
        }, stdout, stderr);
        stream.write(LoggerLevel.INFO, json, data);
    });

    it('should constrain tags as configured', () => {
        const stdout = {write: (msg) => {
                assert.strictEqual(msg,
                    '[host] [ip] INFO: message { prop1: prop1; prop2: prop2; prop3: prop3; }\n');
            }};
        const stderr = { write: () => { throw new Error('Unexpected err'); }};
        const stream = new ConsoleStream({
            enabled: true,
            useColors: false,
            tags: ['host', 'ip']
        }, stdout, stderr);
        stream.write(LoggerLevel.INFO, json, data);
    });

    it('should constrain log properties as configured', () => {
        const stdout = {write: (msg) => {
                assert.strictEqual(msg,
                    '[20-04-30 21:12:15 UTC] [host] [ip] [context] [process] INFO: message { prop2: prop2; }\n');
            }};
        const stderr = { write: () => { throw new Error('Unexpected err'); }};
        const stream = new ConsoleStream({
            enabled: true,
            useColors: false,
            excludeProperties: ['prop1', 'prop3']
        }, stdout, stderr);
        stream.write(LoggerLevel.INFO, json, data);
    });

    it('should send errors to stderr', () => {
        let isErrPrinted = false;
        const stdout = {write: () => { throw new Error('Incorrect output'); }};
        const stderr = { write: () => {
            isErrPrinted = true;
        }};
        const stream = new ConsoleStream({
            enabled: true,
            useColors: false
        }, stdout, stderr);

        data.level = LoggerLevel.ERROR;
        json = JSON.stringify(data);

        stream.write(LoggerLevel.ERROR, json, data);
    });
});