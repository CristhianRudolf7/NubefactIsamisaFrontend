import api from './api';
import type { User, UserRole } from '../types/auth';

export interface UserCreate {
  dni: string;
  nombre: string;
  celular: string;
  password: string;
  rol: UserRole;
  recibir_notificaciones?: boolean;
  puede_acceder_ventas?: boolean;
  puede_acceder_guias?: boolean;
  puede_acceder_retenciones?: boolean;
}

export interface UserUpdate {
  nombre?: string;
  celular?: string;
  password?: string;
  rol?: UserRole;
  is_active?: boolean;
  recibir_notificaciones?: boolean;
  puede_acceder_ventas?: boolean;
  puede_acceder_guias?: boolean;
  puede_acceder_retenciones?: boolean;
}

const usersService = {
  /**
   * Obtener lista de usuarios
   */
  async getUsers(): Promise<User[]> {
    const response = await api.get<{ 
      id: number; 
      dni: string; 
      nombre: string; 
      celular: string;
      rol: string; 
      is_active: boolean;
      recibir_notificaciones: boolean;
      puede_acceder_ventas: boolean;
      puede_acceder_guias: boolean;
      puede_acceder_retenciones: boolean;
    }[]>('/users/');
    return response.data.map(user => ({
      ...user,
      rol: user.rol as UserRole,
    }));
  },

  /**
   * Crear nuevo usuario
   */
  async createUser(data: UserCreate): Promise<User> {
    const response = await api.post<User>('/users/', data);
    return { ...response.data, rol: response.data.rol as UserRole };
  },

  /**
   * Actualizar usuario
   */
  async updateUser(id: number, data: UserUpdate): Promise<User> {
    const response = await api.put<User>(`/users/${id}`, data);
    return { ...response.data, rol: response.data.rol as UserRole };
  },

  /**
   * Eliminar usuario
   */
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};

export default usersService;
