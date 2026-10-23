const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let memoryServer = null;

const connectDB = async () => {
  const dbUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (dbUri) {
    try {
      const conn = await mongoose.connect(dbUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      return;
    } catch (error) {
      console.warn(`Primary DB Connection failed (${error.message}). Checking local MongoDB...`);
    }
  }

  // Try standard local MongoDB
  try {
    const fallbackConn = await mongoose.connect('mongodb://127.0.0.1:27017/precision_auto', { serverSelectionTimeoutMS: 2000 });
    console.log(`Local MongoDB Connected: ${fallbackConn.connection.host}`);
    return;
  } catch (localErr) {
    console.warn(`Local MongoDB daemon not running. Launching embedded Mongo database...`);
  }

  // Spin up embedded MongoDB instance
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const dbDir = path.join(__dirname, '../../.db_data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbPath: dbDir, dbName: 'precision_auto' }
      });
    } catch (e) {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'precision_auto' }
      });
    }

    const uri = memoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`Embedded MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
  } catch (fatalErr) {
    console.error(`Fatal DB Connection Error: ${fatalErr.message}`);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  if (memoryServer) await memoryServer.stop();
  process.exit(0);
});

module.exports = connectDB;
