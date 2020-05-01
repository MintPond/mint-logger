'use strict';

const
    assert = require('assert'),
    MLogger = require('./../libs/loggers/abstract.Logger'),
    LoggerLevel = require('./../libs/const.LoggerLevel');

let logger;


describe('Logger', () => {

    context('basic', () => {
        beforeEach(() => { logger = new MLogger('_') });

        it('should have correct groupId', () => {
            assert.strictEqual(logger.groupId, '_');
        });

        it('should have correct contextName', () => {
            assert.strictEqual(logger.contextName, '');
        });

        it('should have correct level', () => {
            assert.strictEqual(logger.level, LoggerLevel.TRACE);
        });

        it('should be able to set level', () => {
            logger.level = LoggerLevel.SPECIAL;
            assert.strictEqual(logger.level, LoggerLevel.SPECIAL);
        });

        it('should have correct rootLogger', () => {
            assert.strictEqual(logger.rootLogger, logger);
        });
    });

    context('TRACE level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.TRACE;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, true);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, true);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, true);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, true);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, true);
        });

        it('should log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.TRACE)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.trace('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.DEBUG)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.debug('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.INFO)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.info('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.WARN)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.warn('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.ERROR)
                assert.strictEqual(log, 'message');
                assert.strictEqual(typeof logStack, 'object');
            };
            logger.error('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.TRACE);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.DEBUG);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.INFO);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.WARN);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.ERROR);
                assert.strictEqual(typeof ev.logStack, 'object');
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    context('DEBUG level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.DEBUG;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, false);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, true);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, true);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, true);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, true);
        });

        it('should NOT log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.trace('message');
            assert.strictEqual(isLogged, false);
        });

        it('should log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.DEBUG)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.debug('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.INFO)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.info('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.WARN)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.warn('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.ERROR)
                assert.strictEqual(log, 'message');
                assert.strictEqual(typeof logStack, 'object');
            };
            logger.error('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should NOT emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, () => {
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.DEBUG);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.INFO);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.WARN);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.ERROR);
                assert.strictEqual(typeof ev.logStack, 'object');
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    context('INFO level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.INFO;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, false);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, false);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, true);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, true);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, true);
        });

        it('should NOT log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.trace('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.debug('message');
            assert.strictEqual(isLogged, false);
        });

        it('should log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.INFO)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.info('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.WARN)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.warn('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.ERROR)
                assert.strictEqual(log, 'message');
                assert.strictEqual(typeof logStack, 'object');
            };
            logger.error('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should NOT emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, () => {
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, () => {
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.INFO);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.WARN);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.ERROR);
                assert.strictEqual(typeof ev.logStack, 'object');
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    context('WARN level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.WARN;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, false);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, false);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, false);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, true);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, true);
        });

        it('should NOT log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.trace('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.debug('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.info('message');
            assert.strictEqual(isLogged, false);
        });

        it('should log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.WARN)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.warn('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.ERROR)
                assert.strictEqual(log, 'message');
                assert.strictEqual(typeof logStack, 'object');
            };
            logger.error('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should NOT emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, () => {
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, () => {
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, () => {
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.WARN);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.ERROR);
                assert.strictEqual(typeof ev.logStack, 'object');
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    context('ERROR level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.ERROR;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, false);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, false);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, false);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, false);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, true);
        });

        it('should NOT log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.trace('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.debug('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.info('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.warn('message');
            assert.strictEqual(isLogged, false);
        });

        it('should log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.ERROR)
                assert.strictEqual(log, 'message');
                assert.strictEqual(typeof logStack, 'object');
            };
            logger.error('message');
            assert.strictEqual(isLogged, true);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should NOT emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, () => {
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, () => {
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, () => {
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, () => {
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.ERROR);
                assert.strictEqual(typeof ev.logStack, 'object');
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, true);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    context('SPECIAL level', () => {

        beforeEach(() => {
            logger = new MLogger('_');
            logger.level = LoggerLevel.SPECIAL;
        });

        it('should return correct value from canTrace property', () => {
            assert.strictEqual(logger.canTrace, false);
        });

        it('should return correct value from canDebug property', () => {
            assert.strictEqual(logger.canDebug, false);
        });

        it('should return correct value from canInfo property', () => {
            assert.strictEqual(logger.canInfo, false);
        });

        it('should return correct value from canWarn property', () => {
            assert.strictEqual(logger.canWarn, false);
        });

        it('should return correct value from canError property', () => {
            assert.strictEqual(logger.canError, false);
        });

        it('should NOT log a TRACE entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.trace('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a DEBUG entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.debug('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log an INFO entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.info('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log a WARN entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.warn('message');
            assert.strictEqual(isLogged, false);
        });

        it('should NOT log an ERROR entry', () => {
            let isLogged = false;
            logger.$log = function() {
                isLogged = true;
            };
            logger.error('message');
            assert.strictEqual(isLogged, false);
        });

        it('should log a SPECIAL entry', () => {
            let isLogged = false;
            logger.$log = function(level, log, logStack) {
                isLogged = true;
                assert.strictEqual(level, LoggerLevel.SPECIAL)
                assert.strictEqual(log, 'message');
                assert.strictEqual(logStack, undefined);
            };
            logger.special('message');
            assert.strictEqual(isLogged, true);
        });

        it('should NOT emit EVENT_LOG_TRACE on trace', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_TRACE, () => {
                isEmitted = true;
            });
            logger.trace('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_DEBUG on debug', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_DEBUG, () => {
                isEmitted = true;
            });
            logger.debug('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_INFO on info', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_INFO, () => {
                isEmitted = true;
            });
            logger.info('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_WARN on warn', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_WARN, () => {
                isEmitted = true;
            });
            logger.warn('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should NOT emit EVENT_LOG_ERROR on error', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_ERROR, () => {
                isEmitted = true;
            });
            logger.error('message');
            assert.strictEqual(isEmitted, false);
        });

        it('should emit EVENT_LOG_SPECIAL on special', () => {
            let isEmitted = false;
            logger.$log = function() {};
            logger.on(MLogger.EVENT_LOG_SPECIAL, ev => {
                assert.strictEqual(ev.message, 'message');
                assert.strictEqual(ev.level, LoggerLevel.SPECIAL);
                assert.strictEqual(ev.logStack, undefined);
                isEmitted = true;
            });
            logger.special('message');
            assert.strictEqual(isEmitted, true);
        });
    });

    describe('instanceof handling', () => {
        beforeEach(() => { logger = new MLogger('_'); });

        it('should return true when the instance is exact', () => {
            assert.strictEqual(logger instanceof MLogger, true);
        });

        it('should return false when the instance is NOT exact', () => {

            class NotLogger {}
            const not = new NotLogger();

            assert.strictEqual(not instanceof MLogger, false);
        });

        it('should return true when the instance extends the valid class', () => {

            class ExtendedLogger extends MLogger {}
            const extended = new ExtendedLogger('');

            assert.strictEqual(extended instanceof MLogger, true);
        });

        it('should return true if the instance meets all of the API criteria', () => {

            class Logger {
                createLogger() {}
                trace() {}
                debug() {}
                warn() {}
                info() {}
                error() {}
                special() {}
                get canTrace() {}
                get canDebug() {}
                get canWarn() {}
                get canInfo() {}
                get canError() {}
                get level() {}
                get groupId() {}
                get contextName() {}
                get rootLogger() {}
            }

            const substitute = new Logger();

            assert.strictEqual(substitute instanceof MLogger, true);
        });
    });
});
