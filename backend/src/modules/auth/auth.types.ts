export interface LoginResponse {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: Date;
}

export interface DeviceInfo {
  ip?: string;
  userAgent?: string;
  deviceId?: string;
}

export interface RegisterDto {
  email: string;
  password?: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password?: string;
}
