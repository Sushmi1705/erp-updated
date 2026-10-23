require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Role = require('./src/models/Role');

const checkAndSeed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/org-manager');
    console.log('Connected to DB');
    
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    if (users.length === 0) {
      console.log('No users found. Seeding Super Admin...');
      let superAdminRole = await Role.findOne({ name: 'Super Admin' });
      if (!superAdminRole) {
        superAdminRole = await Role.create({
          name: 'Super Admin',
          description: 'Full system access',
          isSystem: true,
          permissions: [] // Usually full access bypasses this anyway
        });
      }
      
      const admin = await User.create({
        firstName: 'System',
        lastName: 'Admin',
        email: 'admin@example.com',
        password: 'password123',
        role: superAdminRole._id,
        status: 'Active'
      });
      console.log('Admin seeded:', admin.email);
    } else {
      for (const u of users) {
        console.log(`User: ${u.email}, Status: ${u.status}`);
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkAndSeed();
