import api from './api';

export interface ApiToken {
  id: number;
  name: string;
  token_prefix: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  created_by: number;
}

export interface ApiTokenCreate {
  name: string;
  expires_at?: string;
}

export interface ApiTokenUpdate {
  name?: string;
  is_active?: boolean;
  expires_at?: string;
}

export interface ApiTokenCreated extends ApiToken {
  token: string;
  message: string;
}

const tokensService = {
  /**
   * Obtener lista de tokens
   */
  async getTokens(): Promise<ApiToken[]> {
    const response = await api.get<ApiToken[]>('/tokens/');
    return response.data;
  },

  /**
   * Crear nuevo token
   */
  async createToken(data: ApiTokenCreate): Promise<ApiTokenCreated> {
    const response = await api.post<ApiTokenCreated>('/tokens/', data);
    return response.data;
  },

  /**
   * Actualizar token
   */
  async updateToken(id: number, data: ApiTokenUpdate): Promise<ApiToken> {
    const response = await api.put<ApiToken>(`/tokens/${id}`, data);
    return response.data;
  },

  /**
   * Eliminar token
   */
  async deleteToken(id: number): Promise<void> {
    await api.delete(`/tokens/${id}`);
  },
};

export default tokensService;
