import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
