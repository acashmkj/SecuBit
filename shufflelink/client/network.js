const io = require('socket.io-client');
const Client = require('./client').default;
const normalizeUrl = require('normalize-url');
const CLIENT_STATES = require('./client_states');

const DEFAULT_URL = 'http://localhost:8081';
const DEBUG = true;

class Network extends Client {
  constructor(params) {
    super(params);
    this.serverAddress = params.serverAddress || DEFAULT_URL;
  }
  checkBalance(address = this.keys.fromAddress) {
    if (this.isConnected && this.socket) {
      this.socket.emit(
        'checkBalance',
        { address, chain: this.chain },
        balance => {
          this.updateBalance(balance);
        }
      );
    }
  }
  async broadcastTx(tx) {
    const res = await fetch(`${this.serverAddress}/txdrop`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tx, chain: this.chain }),
    });
    return res.json();
  }
  async connect() {
    await this.disconnect();
    return this.connectToServer();
  }
  connectToServer() {
    return new Promise(resolve => {
      this.isConnecting = true;
      this.isConnected = false;
      let usedPromise = false;
      this.socket = io(this.serverAddress, {
        // path: '/myownpath'
      });
      this.socket.on('join', (params, cb) => {
        DEBUG && console.log('join', params);
        cb(this.join(params));
      });
      this.socket.on('shuffle', async (params, cb) => {
        DEBUG && console.log('shuffle');
        cb(await this.shuffle(params));
      });
      this.socket.on('sign', (params, cb) => {
        DEBUG && console.log('sign');
        cb(this.sign(params));
      });
      this.socket.on('blame', (params, cb) => {
        DEBUG && console.log('blame');
        cb(this.blame(params));
      });
      this.socket.on('roundSuccess', (params, cb) => {
        DEBUG && console.log('roundSuccess');
        cb(this.roundSuccess(params));
      });
      this.socket.on('roundError', (params, cb) => {
        DEBUG && console.log('roundError', params);
        cb(this.setRoundError(params));
      });
      this.socket.on('balance', (params, cb) => {
        DEBUG && console.log('balance');
        cb(this.updateBalance(params));
      });
      this.socket.on('connect', () => {
        DEBUG && console.log('Client Connected');
        if (!usedPromise) {
          usedPromise = true;
          resolve();
        }
        this.isConnecting = false;
        this.isConnected = true;
        this.checkBalance();
      });
      this.socket.on('disconnect', () => {
        DEBUG && console.log('Client Disconnected');
        this.disconnected();
      });
      this.socket.connect();
    });
  }
  disconnected() {
    this.setState(CLIENT_STATES.unjoined);
    this.isConnecting = false;
    this.isConnected = false;
    this.roundParams = null;
    this.roundError = null;
  }
  async disconnect() {
    if (this.socket) {
      await this.socket.disconnect();
      await this.socket.destroy();
      this.socket = null;
    }
    this.disconnected();
  }
  async setServer(serverAddress) {
    await this.disconnect();
    try {
      this.serverAddress = normalizeUrl(serverAddress);
    } catch (err) {
      this.serverAddress = serverAddress;
    }
  }
  updateKeyIndexes(params) {
    super.updateKeyIndexes(params);
    this.checkBalance();
  }

  getRoundInfo() {
    const roundInfo = super.getRoundInfo();
    return Object.assign({}, roundInfo, {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      isDisconnected: !this.isConnected && !this.isConnecting,
    });
  }
}

// module.exports = Network;
export default Network;
// exports.default = Network;
