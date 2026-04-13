import api from './api';
import type { LoginResponse, User, UserRole } from '../types/auth';

const authService = {
  /**
   * Iniciar sesión con DNI y contraseña
   * El backend establece las cookies HTTP-only automáticamente
   */
  async login(dni: string, password: string): Promise<LoginResponse> {
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
    const response = await api.get<{ id: number; dni: string; nombre: string; rol: string; is_active: boolean }>('/auth/me');
    return {
      ...response.data,
      rol: response.data.rol as UserRole,
    };
  },

  /**
   * Renovar el access token usando el refresh token
   */
  async refreshToken(): Promise<void> {
    await api.post('/auth/refresh');
  },
};

export default authService;
