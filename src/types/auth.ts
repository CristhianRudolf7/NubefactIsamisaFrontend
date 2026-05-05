// Tipos para autenticación

export type UserRole = 'admin' | 'trabajador';

export interface User {
  id: number;
  dni: string;
  nombre: string;
  celular: string;
  rol: UserRole;
  is_active: boolean;
  recibir_notificaciones: boolean;
  puede_acceder_ventas: boolean;
  puede_acceder_guias: boolean;
  puede_acceder_retenciones: boolean;
}

export interface LoginRequest {
  dni: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  access_token?: string;
  refresh_token?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (dni: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}
