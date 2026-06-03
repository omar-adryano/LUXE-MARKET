import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { wrapModelWithFallback } from './fallback';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return PW in queries by default
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: String,
    verificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash reset password token
userSchema.methods.getResetPasswordToken = function(this: any): string {
  // Generate token
  const resetToken = Math.floor(100000 + Math.random() * 900000).toString(); // Easy-use 6-digit numeric token

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = resetToken;

  // Set expire (10 minutes)
  this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Generate email verification token
userSchema.methods.getEmailVerificationToken = function(this: any): string {
  const vToken = Math.floor(100000 + Math.random() * 900000).toString(); // Easy-use 6-digit numeric verification pin
  this.verificationToken = vToken;
  this.verificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return vToken;
};

export const User = wrapModelWithFallback(model('User', userSchema), 'User');

