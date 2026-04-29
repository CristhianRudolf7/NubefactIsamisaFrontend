import api from './api';
import type { ResponseBase, DocumentoVenta, DocumentoVentaComplete, FilterParams, PaginationParams } from '../types';

interface VentasListResponse {
  total: number;
  page: number;
  page_size: number;
  items: DocumentoVenta[];
}

export const ventasService = {
  async listar(params: FilterParams & PaginationParams): Promise<ResponseBase<VentasListResponse>> {
    const response = await api.get('/ventas/', { params });
    return response.data;
  },

  async obtener(documentId: string): Promise<ResponseBase<DocumentoVentaComplete>> {
    const response = await api.get(`/ventas/${documentId}`);
    return response.data;
  },

  async enviar(documentId: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/ventas/${documentId}/enviar`, null, {
      params: { usuario },
    });
    return response.data;
  },

  async actualizar(documentId: string, datos: Partial<DocumentoVenta>, usuario: string): Promise<ResponseBase> {
    const response = await api.put(`/ventas/${documentId}`, datos, {
      params: { usuario },
    });
    return response.data;
  },

  async anular(documentId: string, motivo: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/ventas/${documentId}/anular`, null, {
      params: { motivo, usuario },
    });
    return response.data;
  },

  async enviarMasivo(ids: string[], usuario: string): Promise<ResponseBase> {
    const response = await api.post('/ventas/bulk-enviar', { ids, usuario });
    return response.data;
  },

  async aprobar(documentId: string, usuario: string): Promise<ResponseBase> {
    const response = await api.post(`/ventas/${documentId}/aprobar`, null, {
      params: { usuario },
    });
    return response.data;
  },
  
  async rechazar(documentId: string): Promise<ResponseBase> {
    const response = await api.post(`/ventas/${documentId}/rechazar`);
    return response.data;
  },
};
