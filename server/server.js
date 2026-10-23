require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');

// Fallback JWT secrets if missing in deployment environment
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'precision_auto_secret_jwt_key_2026';
}
if (!process.env.JWT_REFRESH_SECRET) {
  process.env.JWT_REFRESH_SECRET = 'precision_auto_secret_jwt_refresh_key_2026';
}

// Map alternative Mongo URI variable names if configured in deployment dashboard
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL;
if (mongoUri) {
  process.env.MONGODB_URI = mongoUri;
} else {
  console.warn('WARNING: MONGODB_URI environment variable is not explicitly set. Database handler will attempt fallback connection.');
}

// Connect to Database
const startServer = async () => {
  await connectDB();

  // Auto-seed admin user & master records if database is missing seed data
  try {
    const autoSeedData = require('./src/utils/autoSeed');
    await autoSeedData();
  } catch (seedErr) {
    console.error('Auto-seed check note:', seedErr.message);
  }

  const PORT = process.env.PORT || 5000;

  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    // Close server & exit process
    server.close(() => process.exit(1));
  });
};

startServer();


