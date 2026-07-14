import jwt from 'jsonwebtoken';

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

/**
 * Signs a JWT and sets it as an httpOnly cookie.
 * httpOnly means client-side JS can never read the token (XSS protection).
 * In production (client + API on different domains) the cookie must be
 * SameSite=None + Secure to be sent cross-site over HTTPS.
 */
export const sendTokenCookie = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: THIRTY_DAYS,
  });
};

export const clearTokenCookie = (res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    expires: new Date(0),
  });
};
