'use strict';

const
    async = require('async'),
    assert = require('assert'),
    fs = require('fs-extra'),
    path = require('path'),
    zlib = require('zlib'),
    tarFs = require('tar-fs'),
    LogArchiver = require('./../libs/class.LogArchiver');

let archiver;

const TARGET_FILE = './test-logs/archived.tar.gz';


describe('LogArchiver', () => {

    beforeEach(done => {

        async.series([
            fs.ensureDir.bind(fs, './test-logs'),
            fs.writeFile.bind(fs, './test-logs/log1.log', '"log1"\n'),
            fs.writeFile.bind(fs, './test-logs/log2.log', '"log2"\n'),
            fs.writeFile.bind(fs, './test-logs/log3.log', '"log3"\n'),
            fs.writeFile.bind(fs, './test-logs/log4.log', '"log4"\n')
        ], () => {
            archiver = new LogArchiver();
            done();
        });
    });

    afterEach(done => {
        fs.remove('./test-logs', () => done());
    });

    it('should ignore specified files', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            ignoreFn: fileName => {
                return path.basename(fileName) !== 'log1.log';
            },
            sourceDir: './test-logs',
            shouldDeleteLogs: true,
            callback: () => {

                fs.removeSync('./test-logs/log2.log');
                fs.removeSync('./test-logs/log3.log');
                fs.removeSync('./test-logs/log4.log');

                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 1);

                _extractTarGz(err => {

                    if (err)
                        throw err;

                    const fileNames = fs.readdirSync('./test-logs');
                    assert.strictEqual(fileNames.length, 2);

                    const log1 = fs.readFileSync('./test-logs/log1.log', 'utf8');
                    assert.strictEqual(log1, '"log1"\n');

                    done();
                });
            }
        });
    });

    it('should delete log files when deleteFiles is true', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            sourceDir: './test-logs',
            shouldDeleteLogs: true,
            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 1);
                assert.strictEqual(fileNames[0], 'archived.tar.gz');
                done();
            }
        });
    });

    it('should NOT delete log files when deleteFiles is false', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            sourceDir: './test-logs',
            shouldDeleteLogs: false,
            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 5);
                done();
            }
        });
    });

    it('should NOT delete log file if is specified to be ignored even when deleteFiles is true', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            shouldDeleteLogs: true, // delete all archived logs
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            deleteFn: fileName => {
                // dont delete log1.log
                if (path.basename(fileName) === 'log1.log')
                    return false;
            },
            sourceDir: './test-logs',
            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 2);

                const log1 = fileNames.find(fileName => path.basename(fileName) === 'log1.log');
                assert.strictEqual(!!log1, true);

                done();
            }
        });
    });

    it('should delete log file if is specified to be deleted even when deleteFiles is false', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            shouldDeleteLogs: false, // Dont delete any log files.
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            deleteFn: fileName => {
                // Delete log1.log
                if (path.basename(fileName) === 'log1.log')
                    return true;
            },
            sourceDir: './test-logs',

            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 4);

                const log1 = fileNames.find(fileName => path.basename(fileName) === 'log1.log');
                assert.strictEqual(!!log1, false);

                done();
            }
        });
    });

    it('should not delete files that are specified to be cleared', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            shouldDeleteLogs: true, // Delete all archived log files
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            clearFn: fileName => {
                // Clear contents of log1.log
                if (path.basename(fileName) === 'log1.log')
                    return true;
            },
            sourceDir: './test-logs',

            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 2);

                const log1 = fileNames.find(fileName => path.basename(fileName) === 'log1.log');
                assert.strictEqual(!!log1, true);

                done();
            }
        });
    });

    it('should clear contents of files that are specified to be cleared', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            shouldDeleteLogs: true, // Delete all archived log files
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            clearFn: fileName => {
                // Clear contents of log1.log
                if (path.basename(fileName) === 'log1.log')
                    return true;
            },
            sourceDir: './test-logs',

            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 2);

                const log1Contents = fs.readFileSync('./test-logs/log1.log', 'utf8');
                assert.strictEqual(log1Contents, '');

                done();
            }
        });
    });

    it('should NOT clear contents of files that are not specified to be cleared', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            shouldDeleteLogs: false,
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            clearFn: fileName => {
                // Clear contents of log1.log
                if (path.basename(fileName) === 'log1.log')
                    return true;
            },
            sourceDir: './test-logs',

            callback: () => {
                const fileNames = fs.readdirSync('./test-logs');
                assert.strictEqual(fileNames.length, 5);

                const log2Contents = fs.readFileSync('./test-logs/log2.log', 'utf8');
                assert.strictEqual(log2Contents, '"log2"\n');

                done();
            }
        });
    });

    it('should pack all log files into tar.gz file', done => {
        archiver.archive({
            targetFile: TARGET_FILE,
            ignoreFn: fileName => {
                return path.extname(fileName) !== '.log';
            },
            sourceDir: './test-logs',
            shouldDeleteLogs: true,
            callback: () => {

                _extractTarGz(err => {

                    if (err)
                        throw err;

                    const fileNames = fs.readdirSync('./test-logs');
                    assert.strictEqual(fileNames.length, 5);

                    const log1 = fs.readFileSync('./test-logs/log1.log', 'utf8');
                    assert.strictEqual(log1, '"log1"\n');

                    const log2 = fs.readFileSync('./test-logs/log2.log', 'utf8');
                    assert.strictEqual(log2, '"log2"\n');

                    const log3 = fs.readFileSync('./test-logs/log3.log', 'utf8');
                    assert.strictEqual(log3, '"log3"\n');

                    const log4 = fs.readFileSync('./test-logs/log4.log', 'utf8');
                    assert.strictEqual(log4, '"log4"\n');

                    done();
                });
            }
        });
    });
});


function _extractTarGz(callback) {

    const stream = fs.createReadStream('./test-logs/archived.tar.gz')
        .on('error', err => {
            callback && callback(err);
            callback = null;
        });

    const gunzip = zlib.createGunzip();

    const tarExtract = tarFs.extract('./test-logs', {
        readable: true,
        writable: false,
        ignore: () => false,
        finish: () => {
            callback && callback();
            callback = null;
        }
    });

    stream.pipe(gunzip.pipe(tarExtract));
}
