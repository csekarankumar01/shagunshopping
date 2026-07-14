import jwt from 'jsonwebtoken';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Signs a JWT and returns the token string.
 */
export const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};
