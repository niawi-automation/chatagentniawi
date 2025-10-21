// Tipos para autenticación y gestión de cuenta

export interface LoginRequest {
  email: string;
  password: string;
  twoFactorCode?: string;
  twoFactorRecoveryCode?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface UserInfo {
  userName: string;
  email: string;
  isEmailConfirmed: boolean;
  isTwoFactorEnabled?: boolean;
}

export interface UpdateUserInfoRequest {
  newEmail?: string;
  newPassword?: string;
  oldPassword?: string;
}

export interface UpdateUserInfoResponse {
  email: string;
  isEmailConfirmed: boolean;
}

export interface ResendConfirmationEmailRequest {
  email: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  newPassword: string;
  resetCode: string;
}

export interface TwoFactorConfigRequest {
  enable: boolean;
  twoFactorCode?: string;
  resetSharedKey?: boolean;
  resetRecoveryCodes?: boolean;
  forgetMachine?: boolean;
}

export interface TwoFactorConfigResponse {
  isTwoFactorEnabled: boolean;
  isMachineRemembered: boolean;
  recoveryCodesLeft: number;
  sharedKey?: string;
  recoveryCodes?: string[];
}

// Tipos de errores del backend
export interface AuthError {
  type?: string;
  title?: string;
  status: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
}

// Estados de autenticación
export interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  expiresAt: number | null;
  lastError: string | null;
}

// Configuración de autenticación
export interface AuthConfig {
  baseUrl: string;
  clientId: string;
  appName: string;
}

// Context de autenticación
export interface AuthContextType {
  // Estado
  user: UserInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  lastError: string | null;

  // Acciones
  login: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  clearError: () => void;

  // Gestión de cuenta
  updateUserInfo: (data: UpdateUserInfoRequest) => Promise<void>;
  resendConfirmationEmail: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string, resetCode: string) => Promise<void>;
  confirmEmail: (userId: string, code: string, changedEmail?: string) => Promise<void>;

  // 2FA
  configure2FA: (config: TwoFactorConfigRequest) => Promise<TwoFactorConfigResponse>;
}




