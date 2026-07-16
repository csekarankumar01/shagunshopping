import { useEffect, useRef } from 'react';

/*
  Cloudflare Turnstile widget (the CAPTCHA on signup / password reset).
  Renders nothing when VITE_TURNSTILE_SITE_KEY is absent, so local dev needs
  no keys — the server skips verification too when its secret is missing.
  The script tag is added once and shared by every instance on the page.
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
