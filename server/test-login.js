require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const testLogin = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'admin@example.com' }).select('+password');
  console.log('User found:', !!user);
  if (user) {
    const isMatch = await user.matchPassword('password123');
    console.log('Password match:', isMatch);
    console.log('Hashed password in DB:', user.password);
  }
  process.exit(0);
};

testLogin();
