import mongoose, { Document, Schema, Model } from 'mongoose';
import * as argon2 from 'argon2';

export interface IUser extends Document {
  email: string;
  password?: string;
  name?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  countryCode?: string;
  countryIso?: string;
  countryFlag?: string;
  avatar?: string;
  role: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'banned' | 'pending_verification';
  invitationCode?: string;
  referralClientId?: mongoose.Types.ObjectId;
  balance: number;
  openCredit: number;
  totalExpenses: number;
  totalReferralWin: number;
  isDeleted: boolean;
  deletedAt?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorPendingSecret?: string;
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
  username: { type: String, trim: true, unique: true, sparse: true },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  countryCode: { type: String, trim: true },
  countryIso: { type: String, trim: true, uppercase: true },
  countryFlag: { type: String, trim: true },
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
  invitationCode: { type: String, unique: true, sparse: true },
  referralClientId: { type: Schema.Types.ObjectId, ref: 'User' },
  balance: { type: Number, default: 0 },
  openCredit: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0, min: 0 },
  totalReferralWin: { type: Number, default: 0, min: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, select: false },
  twoFactorPendingSecret: { type: String, select: false },
}, {
  timestamps: true,
});

userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ referralClientId: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ twoFactorEnabled: 1 });

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
