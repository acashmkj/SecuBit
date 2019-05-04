const app = require('express')();
const bodyParser = require('body-parser');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const Coordinator = require('../server/coordinator');

class Server extends Coordinator {
  constructor(params) {
    super(params);

    const {
      CONFIG: {
        SERVE_STATIC_APP,
        LETSENCRYPT_SSL,
        LETSENCRYPT_EMAIL,
        LETSENCRYPT_URLS,
        PORT,
        TIMEOUT,
      },
    } = params;

    app.use(cors());
    app.use(compression());
    app.use(bodyParser.json());

    app.post('/txdrop', async (req, res) => {
      try {
        const { chain, tx } = req.body;
        this.logger[chain].log('/txdrop', tx);
        res.send(await this.broadcastTx({ tx, chain }));
      } catch (err) {
        res.send({ error: err.message });
      }
    });

    if (SERVE_STATIC_APP) {
      app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../../secubitwallet.html'), err => {
          !err && this.logger.log('Sent index.html');
          !!err && this.logger.error('Error sending index.html', err);
        });
      });
    }

    let server;
    if (LETSENCRYPT_SSL) {
      this.logger.log('Running Production');
      const greenlock = require('greenlock-express').create({
        // Let's Encrypt v2 is ACME draft 11
        version: 'draft-11',
        server: 'https://acme-v02.api.letsencrypt.org/directory',
        // server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
        // Note: If at first you don't succeed, switch to staging to debug
        email: LETSENCRYPT_EMAIL,
        agreeTos: true,
        approveDomains: LETSENCRYPT_URLS,
        // You MUST have access to write to directory where certs are saved
        // ex: /home/foouser/acme/etc
        configDir: require('path').join(require('os').homedir(), 'acme', 'etc'),
        app,
        communityMember: false,
        debug: true,
      });
      server = greenlock.listen(80, 443);
    } else {
      server = require('http').Server(app);
      server.listen(PORT);
    }

    this.io = require('socket.io')(server, {
      pingInterval: 10000,
      pingTimeout: 5000,
    });
    this.io.on('connection', client => {
      const uuid = client.id;
      this.logger.log('Connected: ', uuid);
      client.on('checkBalance', async ({ address, chain }, callback) => {
        const response = await this.balance({ address, chain });
        this.logger[chain].log('checkBalance:', address, response.balance);
        callback({ ...response, utxos: undefined });
      });
      client.on('disconnect', () => {
        this.logger.log('Disconnected: ', uuid);
        // TODO: Do something if round is started
        this.disconnected(uuid);
      });

      const genFunc = name => param => {
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(
            () => reject(new Error(`Timeout: ${name}`)),
            (TIMEOUT || 5) * 1000
          );
          client.emit(name, param, response => {
            clearTimeout(timeout);
            resolve(response);
          });
        });
      };

      this.connected({
        uuid,
        join: genFunc('join'),
        shuffle: genFunc('shuffle'),
        sign: genFunc('sign'),
        blame: genFunc('blame'),
        roundSuccess: genFunc('roundSuccess'),
        roundError: genFunc('roundError'),
        balance: genFunc('balance'),
      });
    });

    this.logger.log('Listening on', LETSENCRYPT_SSL ? '80 and 443' : PORT);
  }
  exit() {
    return new Promise(resolve => {
      super.exit();
      this.io.httpServer.close();
      this.io.close();
      this.io = null;
      resolve();
    });
  }
}

module.exports = Server;
