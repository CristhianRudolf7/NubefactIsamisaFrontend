import api from './api';
import type { ResponseBase, Retencion, RetencionComplete, FilterParams, PaginationParams } from '../types';

interface RetencionesListResponse {
  total: number;
  page: number;
  page_size: number;
  items: Retencion[];
}

export const retencionesService = {
  async listar(params: FilterParams & PaginationParams): Promise<ResponseBase<RetencionesListResponse>> {
    const response = await api.get('/retenciones/', { params });
    return response.data;
  },

  async obtener(retencionId: number): Promise<ResponseBase<RetencionComplete>> {
    const response = await api.get(`/retenciones/${retencionId}`);
    return response.data;
  },

  async enviar(retencionId: number, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/retenciones/${retencionId}/enviar`, null, {
      params: { usuario },
    });
    return response.data;
  },

  async actualizar(retencionId: number, datos: Partial<Retencion>, usuario: string): Promise<ResponseBase> {
    const response = await api.put(`/retenciones/${retencionId}`, datos, {
      params: { usuario },
    });
    return response.data;
  },
};
