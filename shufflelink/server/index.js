const Bitcoin = require('../dist/shufflelink/client/bitcoin_bcoin').default;
const Config = require('./configuration');

(async () => {
  const CONFIG = await Config.get(false);

  let bitcoinUtilsCore;
  if (CONFIG.BCOIN) {
    bitcoinUtilsCore = new Bitcoin({
      ...CONFIG,
      APIKEY: CONFIG.BCOIN_APIKEY,
      URI: CONFIG.BCOIN_URI,
      bcoin: require('bcoin'),
      CHAIN: CONFIG.TESTNET ? 'tBTC' : 'BTC',
    });
  }
  let bitcoinUtilsCash;
  if (CONFIG.BCASH) {
    bitcoinUtilsCash = new Bitcoin({
      ...CONFIG,
      APIKEY: CONFIG.BCASH_APIKEY,
      URI: CONFIG.BCASH_URI,
      bcoin: require('bcash'),
      CHAIN: CONFIG.TESTNET ? 'tBCH' : 'BCH',
    });
  }

  const Server = require('./server');
  const server = new Server({
    bitcoinUtilsCore,
    bitcoinUtilsCash,
    CONFIG,
    DEBUG_TEST_MODE: false,
    AUTO_START: true,
  });

  console.log('Running server.', server.CONFIG);
})();
