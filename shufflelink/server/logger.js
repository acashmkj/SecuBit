const joinPath = require('path');
const moment = require('moment');
const simpleLogger = require('simple-node-logger');

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';

function parseMsg(msg) {
  const arr = msg.reduce((prev, next) => {
    prev.push(' ');
    prev.push(next);
    return prev;
  }, []);
  return arr;
}

function genType(type, logger) {
  return {
    log: {
      WRITE: (...msg) => logger.info(`${type}:`, ...parseMsg(msg)),
      PRINT: (...msg) =>
        console.log(
          `${moment().format(timestampFormat)} INFO  ${type}:`,
          ...msg
        ),
    },
    error: {
      WRITE: (...msg) => logger.error(`${type}:`, ...parseMsg(msg)),
      PRINT: (...msg) =>
        console.log(
          `${moment().format(timestampFormat)} ERROR ${type}:`,
          ...msg
        ),
    },
  };
}

function genLogger(logFilePath) {
  if (!logFilePath) return;
  return simpleLogger.createSimpleLogger({
    logFilePath,
    timestampFormat,
  });
}

function gen(type, path) {
  const log = genLogger(path);
  const OBJ = genType(type, log);
  return {
    log: path ? OBJ.log.WRITE : OBJ.log.PRINT,
    error: path ? OBJ.error.WRITE : OBJ.error.PRINT,
    print: OBJ.log.PRINT,
  };
}

class logger {
  constructor(path) {
    this.tBTC = gen(
      'BTC',
      path && joinPath.join(path, '/coordinator_tbtc.log')
    );
    this.tBCH = gen(
      'BCH',
      path && joinPath.join(path, '/coordinator_tbch.log')
    );
    this.BTC = gen('BTC', path && joinPath.join(path, '/coordinator_btc.log'));
    this.BCH = gen('BCH', path && joinPath.join(path, '/coordinator_bch.log'));
    const OTH = gen('___', path && joinPath.join(path, '/coordinator_oth.log'));

    this.undefined = OTH;
    this[''] = OTH;
    this[undefined] = OTH;
    this[null] = OTH;
    this.null = OTH;
    this.log = OTH.log;
    this.error = OTH.error;
    this.print = OTH.print;
  }
}

module.exports = logger;
