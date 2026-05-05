import api from './api';
import type { LoginResponse, User } from '../types/auth';

const authService = {
  /**
   * Iniciar sesión con DNI y contraseña
   * El backend establece las cookies HTTP-only automáticamente
   */
  async login(dni: string, password: string): Promise<LoginResponse> {
    console.log('Intentando login para DNI:', dni);
    const response = await api.post<LoginResponse>('/auth/login', { dni, password });
    return response.data;
  },

  /**
   * Cerrar sesión
   * El backend limpia las cookies
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  /**
   * Obtener usuario actual desde el token en la cookie
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Renovar el access token usando el refresh token
   */
  async refreshToken(): Promise<void> {
    await api.post('/auth/refresh');
  },

  /**
   * Cambiar contraseña
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },
};

export default authService;
