import api from './api';
import type { ResponseBase } from '../types';
import type { AuditoriaFiltros, AuditoriaListResponse, AuditoriaDetalle, AuditoriaEstadisticas } from '../types/index';

const auditoriaService = {
  /**
   * Obtener lista de registros de auditoría con filtros y paginación
   */
  async getAuditoria(filtros?: AuditoriaFiltros): Promise<AuditoriaListResponse> {
    const params = new URLSearchParams();
    
    if (filtros?.tabla) params.append('tabla', filtros.tabla);
    if (filtros?.accion) params.append('accion', filtros.accion);
    if (filtros?.usuario) params.append('usuario', filtros.usuario);
    if (filtros?.fecha_inicio) params.append('fecha_inicio', filtros.fecha_inicio);
    if (filtros?.fecha_fin) params.append('fecha_fin', filtros.fecha_fin);
    if (filtros?.page) params.append('page', filtros.page.toString());
    if (filtros?.page_size) params.append('page_size', filtros.page_size.toString());
    
    const response = await api.get<ResponseBase<AuditoriaListResponse>>(`/auditoria?${params.toString()}`);
    return response.data.data!;
  },

  /**
   * Obtener detalle de un registro de auditoría
   */
  async getAuditoriaDetalle(id: number): Promise<AuditoriaDetalle> {
    const response = await api.get<ResponseBase<AuditoriaDetalle>>(`/auditoria/${id}`);
    return response.data.data!;
  },

  /**
   * Obtener estadísticas de auditoría
   */
  async getEstadisticas(dias: number = 30): Promise<AuditoriaEstadisticas> {
    const response = await api.get<ResponseBase<AuditoriaEstadisticas>>(`/auditoria/estadisticas/resumen?dias=${dias}`);
    return response.data.data!;
  },

  /**
   * Obtener lista de tablas con registros de auditoría
   */
  async getTablas(): Promise<string[]> {
    const response = await api.get<ResponseBase<string[]>>('/auditoria/tablas');
    return response.data.data!;
  },

  /**
   * Obtener lista de acciones disponibles
   */
  async getAcciones(): Promise<string[]> {
    const response = await api.get<ResponseBase<string[]>>('/auditoria/acciones');
    return response.data.data!;
  },
};

export default auditoriaService;
