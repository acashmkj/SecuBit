// Needed to run node.js tests
navigator = typeof navigator === 'undefined' ? {} : navigator;
window = typeof window === 'undefined' ? {} : window;
const JSEncrypt = require('jsencrypt').default;

const aesjs = require('aes-js');
const shuffle = require('crypto-shuffle');
const randomBytes = require('randombytes');

// const AES_KEY_LENGTH = 16; // 128bit
const AES_KEY_LENGTH = 32; // 256bit
// const RSA_KEY_LENGTH = 512;
const RSA_KEY_LENGTH = 1024;
// const RSA_KEY_LENGTH = 2048;
const IV_LENGTH = 16;

function a2hex(str) {
  return new Buffer(str, 'utf8').toString('hex');
}
function hex2a(hexx) {
  return new Buffer(hexx, 'hex').toString('utf8');
}
function base64ToHex(str, length) {
  let hex = new Buffer(str, 'base64').toString('hex');
  while (hex.length < length) {
    hex = `0${hex}`;
  }
  return hex;
}
function hexToBase64(str) {
  return new Buffer(str, 'hex').toString('base64');
}
function randomHex(size) {
  let hex = randomBytes(size).toString('hex');
  while (hex.length < size * 2) {
    hex = `0${hex}`;
  }
  return hex;
}

// https://en.wikipedia.org/wiki/Hybrid_cryptosystem
function encrypt(key, text) {
  const aesKey = randomHex(AES_KEY_LENGTH);
  const ivHex = randomHex(IV_LENGTH);
  const ivBytes = aesjs.utils.hex.toBytes(ivHex);
  const aesKeyArray = aesjs.utils.hex.toBytes(aesKey);
  const textBytes = aesjs.utils.hex.toBytes(text);
  const aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyArray, ivBytes);
  const encryptedBytes = aesCtr.encrypt(textBytes);
  const encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes);
  const rsaEncrypt = new JSEncrypt({ default_key_size: RSA_KEY_LENGTH });
  rsaEncrypt.setPublicKey(key);
  const keyLength =
    AES_KEY_LENGTH * ((RSA_KEY_LENGTH / 8 / AES_KEY_LENGTH) * 2);
  const encryptedKey = base64ToHex(rsaEncrypt.encrypt(aesKey), keyLength);
  // console.log(encryptedKey.length, ivHex.length, encryptedHex.length);
  return `${encryptedKey}${ivHex}${encryptedHex}`;
}

function decrypt(key, cypher) {
  const keyLength =
    AES_KEY_LENGTH * ((RSA_KEY_LENGTH / 8 / AES_KEY_LENGTH) * 2);
  let position = 0;
  const rsaData = hexToBase64(cypher.slice(position, position + keyLength));
  position = position + keyLength;
  const ivHex = cypher.slice(position, position + IV_LENGTH * 2);
  const ivBytes = aesjs.utils.hex.toBytes(ivHex);
  position = position + IV_LENGTH * 2;
  const aesData = cypher.slice(position);
  const rsaDecrypt = new JSEncrypt({ default_key_size: RSA_KEY_LENGTH });
  rsaDecrypt.setPrivateKey(key);
  const aesKey = rsaDecrypt.decrypt(rsaData);
  const aesKeyArray = aesjs.utils.hex.toBytes(aesKey);
  const textBytes = aesjs.utils.hex.toBytes(aesData);
  const aesCtr = new aesjs.ModeOfOperation.ctr(aesKeyArray, ivBytes);
  const decryptedBytes = aesCtr.decrypt(textBytes);
  const encryptedHex = aesjs.utils.hex.fromBytes(decryptedBytes);
  return encryptedHex;
}

function validateKeys(pubKey, privKey) {
  try {
    const key = new JSEncrypt({ default_key_size: RSA_KEY_LENGTH });
    key.setPrivateKey(privKey);
    if (key.getPublicKey() === pubKey) {
      return true;
    }
  } catch (err) {
    console.log('ERROR', err);
  }
  return false;
}

function generateKey() {
  const key = new JSEncrypt({ default_key_size: RSA_KEY_LENGTH });
  key.getPublicKey();
  return key;
}

module.exports = {
  encrypt,
  decrypt,
  generateKey,
  shuffle,
  hex2a,
  a2hex,
  validateKeys,
};
