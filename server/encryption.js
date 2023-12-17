// encryption.js
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const key = Buffer.from('your-secret-key'); // Change this to a strong secret key
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  const [ivString, encrypted] = text.split(':');
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivString, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
