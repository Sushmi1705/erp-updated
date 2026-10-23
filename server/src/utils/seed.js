const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Role = require('../models/Role');

dotenv.config({ path: '../../.env' });

const seedDatabase = async () => {
  try {
    // Explicitly connect using the hardcoded string if dotenv fails to resolve relative path
    await mongoose.connect('mongodb://localhost:27017/org-management');
    console.log('MongoDB Connected for Seeding');

    // Clear existing
    await User.deleteMany();
    await Role.deleteMany();

    // Create Super Admin Role
    const superAdminRole = await Role.create({
      name: 'Super Admin',
      description: 'System Administrator with full access',
      isSystem: true,
      permissions: [
        { module: 'All', actions: ['manage'] }
      ]
    });

    // Create Admin User
    await User.create({
      firstName: 'System',
      lastName: 'Admin',
      email: 'admin@example.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: superAdminRole._id,
      status: 'Active'
    });

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
