const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, select: false },
  
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  
  // Data Access Restrictions
  plantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plant' },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  businessUnitId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessUnit' },
  
  // Status Control
  status: { 
    type: String, 
    enum: ['Active', 'Inactive', 'Suspended', 'Locked'],
    default: 'Active'
  },
  


  // Approval Delegation
  delegatedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Login Tracking & Security
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  passwordChangedAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Password hashing middleware
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Password verification method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password token
const crypto = require('crypto');
userSchema.methods.getResetPasswordToken = function() {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set expire (10 mins)
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
