import { User } from '@/shared/types/auth.types';
import { 
  LoginFormValues, 
  RegisterFormValues, 
  ForgotPasswordFormValues, 
  ResetPasswordFormValues, 
  ChangePasswordFormValues 
} from '../schemas/auth.schema';

export type LoginRequest = LoginFormValues;
export type RegisterRequest = Omit<RegisterFormValues, 'confirmPassword'>;
export type ForgotPasswordRequest = ForgotPasswordFormValues;
export type ResetPasswordRequest = Omit<ResetPasswordFormValues, 'confirmPassword'>;
export type ChangePasswordRequest = Omit<ChangePasswordFormValues, 'confirmPassword'>;

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TwoFactorRequiredResponse {
  requiresTwoFactor: true;
  twoFactorToken: string;
}

export type LoginResponse = AuthResponse | TwoFactorRequiredResponse;

export interface TwoFactorSetupResponse {
  secret: string;
  otpAuthUrl: string;
  qrCodeDataUrl: string;
}

export interface RefreshResponse {
  accessToken: string;
}
