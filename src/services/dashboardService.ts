import api from './api';
import type { ResponseBase, DashboardStats, EstadoInfo, TipoDocumento, MotivoTraslado } from '../types';

export const dashboardService = {
  async obtenerEstadisticas(): Promise<ResponseBase<DashboardStats>> {
    const response = await api.get('/dashboard/estadisticas');
    return response.data;
  },

  async obtenerEstados(): Promise<ResponseBase<EstadoInfo[]>> {
    const response = await api.get('/dashboard/estados');
    return response.data;
  },

  async obtenerTiposDocumento(): Promise<ResponseBase<TipoDocumento[]>> {
    const response = await api.get('/dashboard/tipos-documento');
    return response.data;
  },

  async obtenerMotivosTraslado(): Promise<ResponseBase<MotivoTraslado[]>> {
    const response = await api.get('/dashboard/motivos-traslado');
    return response.data;
  },

  async resumenPorEstado(tipo: 'ventas' | 'retenciones' | 'guias'): Promise<ResponseBase<{ estado: string; cantidad: number }[]>> {
    const response = await api.get('/dashboard/resumen-por-estado', {
      params: { tipo },
    });
    return response.data;
  },

  async actividadSemanal(): Promise<ResponseBase<{ fecha: string; cantidad: number }[]>> {
    const response = await api.get('/dashboard/actividad-semanal');
    return response.data;
  },
};
