/**
 * Cloudflare Turnstile verification (free CAPTCHA).
 * If TURNSTILE_SECRET_KEY is not set, verification is skipped so local dev
 * works without keys — the widget also hides itself on the client when the
 * site key is absent. Set both keys in production to activate bot protection.
 */
export const verifyCaptcha = async (token, ip) => {
  if (!process.env.TURNSTILE_SECRET_KEY) return true; // not configured -> skip
  if (!token) return false;
  try {
    const body = new URLSearchParams({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    });
    if (ip) body.append('remoteip', ip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = await resp.json();
    return data.success === true;
  } catch (err) {
    console.error('Captcha verify failed:', err.message);
    return false; // fail closed — better to block than let bots through
  }
};

/** Express middleware: expects req.body.captchaToken */
export const requireCaptcha = async (req, res, next) => {
  const ok = await verifyCaptcha(req.body.captchaToken, req.ip);
  if (!ok) return res.status(400).json({ message: 'Captcha verification failed — please try again' });
  next();
};
