import * as crypto from 'crypto';

export function generateSecureRandomNumber() {
  const randomBytes = crypto.randomBytes(4);
  const randomNumber = randomBytes.readUInt32BE(0);
  const randomNormalized = randomNumber / 0xffffffff;
  return randomNormalized.toString();
}
