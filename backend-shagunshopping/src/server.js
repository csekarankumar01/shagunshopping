import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const setupKeepAlive = () => {
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SERVER_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://shagunshopping.onrender.com' : null);

  if (!targetUrl) return;

  const PING_INTERVAL = 10 * 60 * 1000; // 10 minutes (Render sleeps after 15 min)
  console.log(`[KeepAlive] Configured keep-alive ping for ${targetUrl}/api/health every 10 min`);

  setInterval(async () => {
    try {
      const res = await fetch(`${targetUrl}/api/health`);
      if (res.ok) {
        console.log(`[KeepAlive] Heartbeat ping successful (${new Date().toISOString()})`);
      }
    } catch (err) {
      console.warn(`[KeepAlive] Heartbeat ping warning: ${err.message}`);
    }
  }, PING_INTERVAL);
};

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
    setupKeepAlive();
  });
};

start();
