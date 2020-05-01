'use strict';

module.exports = {
    Logger: require('./libs/loggers/abstract.Logger'),
    MasterLogger: require('./libs/loggers/class.MasterLogger'),
    ForkLogger:  require('./libs/loggers/class.ForkLogger'),
    ForkMessageType: require('./libs/const.ForkMessageType'),
    LoggerLevel: require('./libs/const.LoggerLevel')
}