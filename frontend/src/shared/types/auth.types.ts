export type RoleName = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'USER' | 'GUEST';
export type UserStatus = 'active' | 'inactive' | 'banned' | 'pending_verification';

export interface Permission {
  _id: string;
  name: string;
  module: string;
}

export interface Role {
  _id: string;
  name: RoleName;
  permissions: Permission[];
}

export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  countryCode?: string;
  countryIso?: string;
  countryFlag?: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  balance?: number;
  openCredit?: number;
  totalExpenses?: number;
  totalReferralWin?: number;
  invitationCode?: string;
  twoFactorEnabled?: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface DeviceInfo {
  userAgent: string;
  ip: string;
  device?: string;
  os?: string;
  browser?: string;
}

export interface Session {
  _id: string;
  id?: string;
  deviceInfo: DeviceInfo;
  createdAt: string;
  expiresAt?: string;
  isCurrent: boolean;
}
