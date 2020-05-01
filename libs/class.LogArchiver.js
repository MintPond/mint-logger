'use strict';

const
    async = require('async'),
    fs = require('fs-extra'),
    tar = require('tar-fs'),
    zlib = require('zlib'),
    precon = require('@mintpond/mint-precon');

/**
 * Tar and gzip log files.
 */
class LogArchiver {

    /**
     * Constructor.
     */
    constructor() {
        const _ = this;
        _._isBusy = false;
    }


    /**
     * Determine if the archiver is currently busy.
     * @returns {boolean}
     */
    get isBusy() { return this._isBusy; }


    /**
     * Archive log files by tar and gzip.
     *
     * @param args
     * @param args.targetFile {string} The file path to write to.
     * @param args.shouldDeleteLogs {boolean} True to delete log files that get archived.
     * @param [args.sourceDir=./logs] {string} The location of the log files to archive.
     * @param [args.ignoreFn] {function(name:string,header:*):boolean} A function called during tar packing for each file
     * to determine if it should be ignored.
     * @param [args.deleteFn] {function(name:string,header:*):boolean} A function called to determine if a file
     * should be deleted.
     * @param [args.clearFn] {function(name:string,header:*):boolean} A function called to determine if a log files
     * contents should be cleared after archiving. Cleared files will not be deleted.
     * @param [args.entries] {string[]} A specific whitelist of files to add to the tar.
     * @param [args.callback] {function()}
     * @returns {boolean} True if archiving is started, false if the archiver is already busy.
     */
    archive(args) {
        precon.string(args.targetFile, 'targetFile');
        precon.boolean(args.shouldDeleteLogs, 'shouldDeleteLogs');
        precon.opt_string(args.sourceDir, 'sourceDir');
        precon.opt_funct(args.ignoreFn, 'ignoreFn');
        precon.opt_funct(args.deleteFn, 'deleteFn');
        precon.opt_funct(args.clearFn, 'clearFn');
        precon.opt_array(args.entries, 'entries');
        precon.opt_funct(args.callback, 'callback');

        const _ = this;

        const targetFile = args.targetFile;
        const shouldDeleteLogs = args.shouldDeleteLogs;
        const sourceDir = args.sourceDir || './logs';
        const ignoreFn = args.ignoreFn;
        const deleteFn = args.deleteFn;
        const clearFn = args.clearFn;
        const entries = args.entries;
        const callback = args.callback;

        if (_._isBusy) {
            callback && callback('busy');
            return false;
        }

        _._isBusy = true;

        const toDeleteArr = [];
        const toClearArr = [];

        const gzip = zlib.createGunzip();

        const stream = fs.createWriteStream(targetFile);
        stream
            .on('close', () => {
                _finish && _finish();
                _finish = null;
            })
            .on('error', err => {
                _finish && _finish(err);
                _finish = null;
            });

        tar.pack(sourceDir, {
                ignore: (name, header) => {

                    if (ignoreFn && ignoreFn(name, header))
                        return true;

                    if (clearFn && clearFn(name, header)) {
                        toClearArr.push(name);
                        return false;
                    }

                    if (deleteFn) {
                        const shouldDelete = deleteFn(name, header);
                        if (shouldDelete === true) {
                            toDeleteArr.push(name);
                            return false;
                        }
                        else if (shouldDelete === false) {
                            return false;
                        }
                    }

                    if (shouldDeleteLogs)
                        toDeleteArr.push(name);

                    return false;
                },
                entries: entries,
                dmode: parseInt(555, 8), // all dirs should be readable
                fmode: parseInt(444, 8) // all files should be readable
            })
            .pipe(gzip.pipe(stream));

        function _finish(err) {
            if (!err) {
                async.eachLimit(toDeleteArr, 10, (filePath, eCallback) => {
                    fs.unlink(filePath, err => {
                        if (err)
                            console.log(`Error deleting log file "${filePath}": ${err}`);
                        eCallback();
                    });
                }, () => {

                    async.eachLimit(toClearArr, 10, (filePath, eCallback) => {
                        fs.truncate(filePath, err => {
                            if (err)
                                console.log(`Error clearing log file "${filePath}": ${err}`);
                            eCallback();
                        });
                    }, () => {
                        _._isBusy = false;
                        callback && callback();
                    });
                });
            }
            else {
                _._isBusy = false;
                callback && callback(err);
            }
        }

        return true;
    }
}

module.exports = LogArchiver;