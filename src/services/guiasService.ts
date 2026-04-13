import api from './api';
import type { ResponseBase, GuiaRemision, GuiaRemisionComplete, FilterParams, PaginationParams } from '../types';

interface GuiasListResponse {
  total: number;
  page: number;
  page_size: number;
  items: GuiaRemision[];
}

export const guiasService = {
  async listar(params: FilterParams & PaginationParams): Promise<ResponseBase<GuiasListResponse>> {
    const response = await api.get('/guias/', { params });
    return response.data;
  },

  async obtener(transactionId: string): Promise<ResponseBase<GuiaRemisionComplete>> {
    const response = await api.get(`/guias/${transactionId}`);
    return response.data;
  },

  async enviar(transactionId: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/guias/${transactionId}/enviar`, null, {
      params: { usuario },
    });
    return response.data;
  },

  async actualizar(transactionId: string, datos: Partial<GuiaRemision>, usuario: string): Promise<ResponseBase> {
    const response = await api.put(`/guias/${transactionId}`, datos, {
      params: { usuario },
    });
    return response.data;
  },
};
