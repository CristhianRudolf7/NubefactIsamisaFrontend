import api from './api';
import type { LoginResponse, User } from '../types/auth';

const authService = {
  /**
   * Iniciar sesión con DNI y contraseña
   * El backend establece las cookies HTTP-only automáticamente
   */
  async login(dni: string, password: string): Promise<LoginResponse> {
    console.log('Intentando login para DNI:', dni);
    const response = await api.post<LoginResponse & { access_token: string, refresh_token: string }>('/auth/login', { dni, password });
    
    // Guardar tokens en localStorage
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
    }
    
    return response.data;
  },

  /**
   * Cerrar sesión
   * El backend limpia las cookies y nosotros el localStorage
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  },

  /**
   * Obtener usuario actual desde el token
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Renovar el access token usando el refresh token
   */
  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return;
    
    const response = await api.post<{ access_token: string, refresh_token: string }>('/auth/refresh', { 
      refresh_token: refreshToken 
    });
    
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('refresh_token', response.data.refresh_token);
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
