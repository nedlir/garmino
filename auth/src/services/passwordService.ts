import bcrypt from 'bcrypt';
import { logger } from '../utils/logger';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (err) {
    logger.error({ err }, 'Error hashing password');
    throw err;
  }
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (err) {
    logger.error({ err }, 'Error comparing password');
    throw err;
  }
};
