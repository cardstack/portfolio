const { randomBytes, pbkdf2Sync, pbkdf2 : pbkdf2Node } = require('crypto');
const pbkdf2 = require('util').promisify(pbkdf2Node);
const iterations = 100000;
const keyLength = 32;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await pbkdf2(password, salt, iterations, keyLength, 'sha512');

  return `${hash.toString('hex')}:${salt.toString('hex')}`;
}
function hashPasswordSync(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, keyLength, 'sha512');

  return `${hash.toString('hex')}:${salt.toString('hex')}`;
}

async function comparePassword(password, hash) {
  if (!hash || !password) { return false; }

  let [_hash, salt] = hash.split(':');
  if (!salt) { return false; }

  let passwordHash = (await pbkdf2(password, Buffer.from(salt, 'hex'), iterations, keyLength, 'sha512')).toString('hex');
  return passwordHash === _hash;
}

module.exports = {
  hashPassword,
  hashPasswordSync,
  comparePassword
};
