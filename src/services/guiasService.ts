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

  async consultar(transactionId: string): Promise<ResponseBase> {
    const response = await api.post(`/guias/${transactionId}/consultar`);
    return response.data;
  },

  async descargarPdf(transactionId: string): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const response = await api.get(`/guias/${transactionId}/pdf`, {
        responseType: 'blob',
      });
      
      // Verificar si es un PDF
      if (response.data.type === 'application/pdf') {
        return { success: true, blob: response.data };
      }
      
      // Si no es PDF, intentar parsear como JSON (error)
      const text = await response.data.text();
      try {
        const json = JSON.parse(text);
        return { success: false, error: json.detail || 'PDF no disponible' };
      } catch {
        return { success: false, error: 'PDF no disponible' };
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { detail?: string } } };
      return { success: false, error: axiosError.response?.data?.detail || 'Error al descargar PDF' };
    }
  },

  async anular(transactionId: string, motivo: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/guias/${transactionId}/anular`, null, {
      params: { motivo, usuario },
    });
    return response.data;
  },

  async enviarMasivo(ids: string[], usuario: string): Promise<ResponseBase> {
    const response = await api.post('/guias/bulk-enviar', { ids, usuario });
    return response.data;
  },
};
