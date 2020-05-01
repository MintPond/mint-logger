'use strict';

const
    precon = require('@mintpond/mint-precon'),
    Logger = require('./abstract.Logger'),
    ForkMessageType = require('./../const.ForkMessageType');


class ForkLogger extends Logger {

    /**
     * Constructor.
     *
     * @param groupId {string}
     * @param [contextName] {string}
     * @param [rootLogger] {ForkLogger}
     */
    constructor(groupId, contextName, rootLogger) {
        precon.string(groupId, 'groupId');
        precon.opt_string(contextName, 'context');
        precon.opt_instanceOf(rootLogger, ForkLogger, 'rootLogger');

        super(groupId, contextName, rootLogger);

        const _ = this;
        if (!rootLogger) {

            process.on('message', message => {
                if (message.type !== ForkMessageType.LOGGER_LEVEL || message.groupId !== _.groupId)
                    return;

                _._localLevel = message.level || _._localLevel;
            });

            process.send({
                groupId: _.groupId,
                type: ForkMessageType.GET_LOGGER_LEVEL
            });
        }
    }


    /* Override */
    createLogger(contextName) {
        precon.string(contextName, 'contextName');

        const _ = this;
        contextName = _.contextName ? `${_.contextName}.${contextName}` : contextName;
        return new ForkLogger(_.groupId, contextName, _.rootLogger || _);
    }


    /* Override */
    $log(level, log, logStack) {
        const _ = this;

        // Send log entry to master process
        process.send({
            groupId: _.groupId,
            type: ForkMessageType.LOG,
            process: process.title,
            pid: process.pid,
            contextName: _._contextName,
            level: level,
            log: log,
            logStack: logStack
        });
    }
}

module.exports = ForkLogger;