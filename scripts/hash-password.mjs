import crypto from 'node:crypto';

const password = process.argv[2];
if (!password) {
  console.error('Usage: npm run hash-password -- <password>');
  process.exit(1);
}

const cost = 16384;
const blockSize = 8;
const parallelization = 1;
const salt = crypto.randomBytes(16).toString('base64url');
const hash = crypto.scryptSync(password, salt, 32, {
  N: cost,
  r: blockSize,
  p: parallelization,
  maxmem: 128 * cost * blockSize + 1024 * 1024
});

console.log(`scrypt$${cost}$${blockSize}$${parallelization}$${salt}$${hash.toString('base64url')}`);