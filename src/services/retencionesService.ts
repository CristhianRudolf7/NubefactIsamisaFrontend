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

  async anular(retencionId: number, motivo: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/retenciones/${retencionId}/anular`, null, {
      params: { motivo, usuario },
    });
    return response.data;
  },

  async enviarMasivo(params: { fecha_inicio?: string; fecha_fin?: string; serie?: string; usuario: string }): Promise<ResponseBase> {
    const response = await api.post('/retenciones/bulk-enviar', params);
    return response.data;
  },

  async aprobar(retencionId: number, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/retenciones/${retencionId}/aprobar`, null, {
      params: { usuario },
    });
    return response.data;
  },
  async descargarPdf(retencionId: number): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      const response = await api.get(`/retenciones/${retencionId}/pdf`, {
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

  async rechazar(retencionId: number): Promise<ResponseBase> {
    const response = await api.post(`/retenciones/${retencionId}/rechazar`);
    return response.data;
  },
};
