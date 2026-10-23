const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://admin:admin123@cluster0.mongodb.net/PrecisionERP?retryWrites=true&w=majority').then(async () => {
  console.log('Connected to DB');
  
  const user = await User.findOne({ email: 'admin@example.com' });
  
  if (!user) {
    console.log('User admin@example.com not found');
    process.exit(1);
  }

  user.mfaEnabled = true;
  user.preferredMfaMethod = 'email';
  await user.save();

  console.log('Successfully enabled Email MFA for admin@example.com!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
