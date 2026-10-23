require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Atlas DB');
    
    const user = await User.findOne({ email: 'admin@example.com' });
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }

    console.log('Found user. Resetting password to password123...');
    // We must assign the plain text password so the pre('save') hook hashes it!
    user.password = 'password123';
    await user.save();
    
    console.log('Password successfully reset and hashed!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPassword();
