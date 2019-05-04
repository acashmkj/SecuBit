const fs = require('fs');
const util = require('util');
const path = require('path');
const readFile = util.promisify(fs.readFile);

async function get(debugMode) {
  let CONFIG;
  if (debugMode) {
    CONFIG = require('../../config.example.json');
    CONFIG.PORT = 10374; // Random port
    CONFIG.BCASH = true;
    CONFIG.BCOIN = true;
    CONFIG.TESTNET = true;
    CONFIG.LOG_TO_FILE = false;
    CONFIG.LETSENCRYPT_SSL = false;
    CONFIG.FETCH_RATES = false;
    return CONFIG;
  }
  try {
    const str = await readFile(path.join(__dirname, '../../config.json'));
    CONFIG = JSON.parse(str);
    // console.log('Using config file config.json', CONFIG);
  } catch (err) {
    // Default settings
    console.log('Could not find config.json. Using defaults');
    CONFIG = require('../../config.example.json');
  }
  return CONFIG;
}

module.exports = {
  get,
};
