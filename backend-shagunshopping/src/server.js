import 'dotenv/config';
import app from './app.js';
import connectDB from './config/db.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();
