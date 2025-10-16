// Servicio de gestión de cuenta

import apiClient from './apiClient';
import {
  UserInfo,
  UpdateUserInfoRequest,
  UpdateUserInfoResponse,
  ResendConfirmationEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  TwoFactorConfigRequest,
  TwoFactorConfigResponse,
} from '@/types/auth';

/**
 * Obtener información del usuario autenticado
 */
export const getUserInfo = async (): Promise<UserInfo> => {
  try {
    const response = await apiClient.get<UserInfo>('/manage/info');
    return response;
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al obtener información del usuario',
      status: error.status,
    };
  }
};

/**
 * Actualizar información del usuario (email y/o contraseña)
 */
export const updateUserInfo = async (
  data: UpdateUserInfoRequest
): Promise<UpdateUserInfoResponse> => {
  try {
    const response = await apiClient.post<UpdateUserInfoResponse>('/manage/info', data);
    return response;
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al actualizar información del usuario',
      status: error.status,
    };
  }
};

/**
 * Reenviar email de confirmación
 */
export const resendConfirmationEmail = async (email: string): Promise<void> => {
  const data: ResendConfirmationEmailRequest = {
    email: email.trim(),
  };

  try {
    await apiClient.post('/manage/resendConfirmationEmail', data);
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al reenviar email de confirmación',
      status: error.status,
    };
  }
};

/**
 * Confirmar email con código
 */
export const confirmEmail = async (
  userId: string,
  code: string,
  changedEmail?: string
): Promise<void> => {
  try {
    const params = new URLSearchParams({
      userId,
      code,
    });

    if (changedEmail) {
      params.append('changedEmail', changedEmail);
    }

    await apiClient.get(`/manage/confirmEmail?${params.toString()}`);
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al confirmar email',
      status: error.status,
    };
  }
};

/**
 * Solicitar reset de contraseña
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const data: ForgotPasswordRequest = {
    email: email.trim(),
  };

  try {
    await apiClient.post('/manage/forgotPassword', data);
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al solicitar reset de contraseña',
      status: error.status,
    };
  }
};

/**
 * Resetear contraseña con código
 */
export const resetPassword = async (
  email: string,
  newPassword: string,
  resetCode: string
): Promise<void> => {
  const data: ResetPasswordRequest = {
    email: email.trim(),
    newPassword,
    resetCode,
  };

  try {
    await apiClient.post('/manage/resetPassword', data);
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al resetear contraseña',
      status: error.status,
    };
  }
};

/**
 * Configurar 2FA
 */
export const configure2FA = async (
  config: TwoFactorConfigRequest
): Promise<TwoFactorConfigResponse> => {
  try {
    const response = await apiClient.post<TwoFactorConfigResponse>('/manage/2fa', config);
    return response;
  } catch (error: any) {
    throw {
      ...error,
      message: error.message || 'Error al configurar 2FA',
      status: error.status,
    };
  }
};

/**
 * Activar 2FA
 */
export const enable2FA = async (twoFactorCode: string): Promise<TwoFactorConfigResponse> => {
  const config: TwoFactorConfigRequest = {
    enable: true,
    twoFactorCode,
  };

  return configure2FA(config);
};

/**
 * Desactivar 2FA
 */
export const disable2FA = async (twoFactorCode?: string): Promise<TwoFactorConfigResponse> => {
  const config: TwoFactorConfigRequest = {
    enable: false,
  };

  if (twoFactorCode) {
    config.twoFactorCode = twoFactorCode;
  }

  return configure2FA(config);
};

/**
 * Resetear shared key de 2FA
 */
export const reset2FASharedKey = async (): Promise<TwoFactorConfigResponse> => {
  const config: TwoFactorConfigRequest = {
    enable: true,
    resetSharedKey: true,
  };

  return configure2FA(config);
};

/**
 * Resetear recovery codes de 2FA
 */
export const reset2FARecoveryCodes = async (): Promise<TwoFactorConfigResponse> => {
  const config: TwoFactorConfigRequest = {
    enable: true,
    resetRecoveryCodes: true,
  };

  return configure2FA(config);
};

/**
 * Obtener configuración actual de 2FA
 */
export const get2FAStatus = async (): Promise<TwoFactorConfigResponse> => {
  const config: TwoFactorConfigRequest = {
    enable: true,
  };

  return configure2FA(config);
};
