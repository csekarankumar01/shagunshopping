import { useEffect, useRef } from 'react';

/*
  The CAPTCHA box on signup / password reset (Cloudflare Turnstile).
  If VITE_TURNSTILE_SITE_KEY isn't set this renders nothing at all — dev
  works with zero keys, and the server skips verification too. The script
  tag is injected once and shared, because two widgets fighting over one
  script load was a fun bug to find.
*/

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let scriptPromise = null;

const loadScript = () => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    if (window.turnstile) return resolve();
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
  return scriptPromise;
};

export default function Turnstile({ onVerify }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !ref.current || widgetId.current !== null) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY,
        callback: (token) => onVerify(token),
        'expired-callback': () => onVerify(''),
        'error-callback': () => onVerify(''),
        theme: 'light',
      });
    });
    return () => {
      cancelled = true;
      if (widgetId.current !== null && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onVerify]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="my-3 flex justify-center" />;
}

export const captchaEnabled = Boolean(SITE_KEY);
