// Bot protection via Cloudflare Turnstile (their free CAPTCHA).
// I made it opt-in by env: with no TURNSTILE_SECRET_KEY set, verification is
// skipped and the widget hides itself on the client, so local dev needs zero
// setup. In production both keys are set and every signup gets checked.
// Note it fails CLOSED on network errors — I'd rather block a real user for
// one retry than let a bot wave through while Cloudflare hiccups.
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
