mint-logger
===========

A _console_, _rolling file_, _log server_ and _remote log sending_ JSON based logger with process fork handling 
capability for NodeJS used by [MintPond Mining Pool](https://mintpond.com).

## Install ##
__Install as Dependency in NodeJS Project__
```bash
# Install from Github NPM repository

npm config set @mintpond:registry https://npm.pkg.github.com/mintpond
npm config set //npm.pkg.github.com/:_authToken <PERSONAL_ACCESS_TOKEN>

npm install @mintpond/mint-logger@1.0.0 --save
```
[Creating a personal access token](https://help.github.com/en/github/authenticating-to-github/creating-a-personal-access-token-for-the-command-line)

__Install & Test__
```bash
# Install nodejs v10
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install nodejs -y

# Download mint-logger
git clone https://github.com/MintPond/mint-loggers

# build & test
cd mint-logger
npm install
npm test
``` 

## Examples ##

__Configuration__
```javascript
const MasterLogger = require('@mintpond/mint-logger').MasterLogger;

const logger = new MasterLogger('logger'/*groupId*/);
logger.configure({
    level: 'info', // possible: trace, debug, info, warn, error
    streams: [
        { 
            name: 'console', // print log to console (stdout and stderr)
            useColors: true,
            level: 'trace', // main level overrides this if it is lower
            tags: ['timeMs', 'host', 'process', 'context'], // names of logged data properties to include as [tags] 
            excludeProperties: [] // names of properties in custom logged data to exclude from console display
        },
        {
            name: 'rollingFile', // rollover on new day or when file size gets too large
            autoArchive: true, // archive logs into tar.gz files automatically
            level: 'trace',
            logDir: './logs', // the directory where log files will be written
            file: 'log' // will output file as "./logs/log.2020_04_30.1588292809.0.log" (file.YYYY_MM_DD.startTime.fileSizeRolloverCount.log)
        },
        {
            name: 'remoteLog',
            level: 'trace',
            listen: [ // listen for connections from remote log clients and stream logs to them
                {
                    host: '127.0.0.1', // open a server on 127.0.0.1:18001
                    port: 18001
                }
            ],
            connect: [ // connect to remote log clients and stream logs to them
                {
                    host: '127.0.0.1', // connect to a server on 127.0.0.1:18002
                    port: 18002
                }
            ]
        }
    ]
});
```

__Cluster__
```javascript
const cluster = require('cluster');
const MasterLogger = require('@mintpond/mint-logger').MasterLogger;
const ForkLogger = require('@mintpond/mint-logger').ForkLogger;

let logger;

if (cluster.isMaster) {
    logger = new MasterLogger('logger'/*groupId*/);

    // Only the root master logger is configurable
    logger.configure({
        level: 'info', // possible: trace, debug, info, warn, error
        streams: [
            {
                name: 'rollingFile', // rollover on new day or when file size gets too large
                autoArchive: true,
                level: 'trace',
                logDir: './logs',
                file: 'log' // will output file as "./logs/log.2020_04_30.1588292809.0.log" (file.YYYY_MM_DD.startTime.fileSizeRolloverCount.log)
            }
        ]
    });

    // Fork process
    const fork = cluster.fork({});

    logger.info('Master started');
}
else {
    logger = new ForkLogger('logger'); // groupId assigns this fork logger to the master with the same groupId.

    logger.info('Fork process started'); // sends log to master where it will be sent to configured output streams.

    logger.trace('Trace message');
    logger.debug('Debug message');
    logger.warn('Warn message');
    logger.error('Error message');
    logger.special('Special message');
}
```

__Log Data__
```javascript

logger.info({
    msg: 'The primary message must be in a property called "msg"',
    data: [
        "Any data that can be converted to JSON can be logged",
        true
    ],
    moreStuff: "hello",
    note: "Every log entry automatically includes data such as time, process name, host, IP, PID and context."
});

``` 

__Contexts__
```javascript

// Create a logger with a sub context. Each log created by the new logger will include the context path.
const contextLogger = logger.createLogger('contextName');

// Create a logger whose context is "contextName.subContext"
const subContextLogger = contextLogger.createLogger('subContext');
```

__Events__
```javascript
const Logger = require('@mintpond/mint-logger').Logger;

logger.on(Logger.EVENT_LOG_TRACE, ev => {
    console.log(ev.message);
    console.log(ev.level);
});

logger.on(Logger.EVENT_LOG_DEBUG, ev => {
    console.log(ev.message);
    console.log(ev.level);
});

logger.on(Logger.EVENT_LOG_INFO, ev => {
    console.log(ev.message);
    console.log(ev.level);
});

logger.on(Logger.EVENT_LOG_WARN, ev => {
    console.log(ev.message);
    console.log(ev.level);
});

logger.on(Logger.EVENT_LOG_ERROR, ev => {
    console.log(ev.message);
    console.log(ev.level);
    console.log(ev.logStack);
});

logger.on(Logger.EVENT_LOG_SPECIAL, ev => {
    console.log(ev.message);
    console.log(ev.level);
});

```