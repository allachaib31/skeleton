import mongoose, { Document, Schema, Model } from 'mongoose';
import * as argon2 from 'argon2';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  avatar?: string;
  role: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'banned' | 'pending_verification';
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  isLocked(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
}

const userSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, select: false },
  name: { type: String },
  avatar: { type: String },
  role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'banned', 'pending_verification'],
    default: 'pending_verification' 
  },
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

// Pre-save hook to hash password
userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  
  try {
    this.password = await argon2.hash(this.password);
  } catch (error: any) {
    throw error;
  }
});

// Methods
userSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  if (this.lockUntil && this.lockUntil < new Date()) {
    // Lock expired, reset
    this.failedLoginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;
    // Lock after 5 failed attempts
    if (this.failedLoginAttempts >= 5 && !this.isLocked()) {
      const lockTime = new Date();
      lockTime.setMinutes(lockTime.getMinutes() + 15); // lock for 15 mins
      this.lockUntil = lockTime;
    }
  }
  await this.save();
};

userSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

export const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);
