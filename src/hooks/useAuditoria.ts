import { useQuery } from '@tanstack/react-query';
import auditoriaService from '../services/auditoriaService';
import type { AuditoriaFiltros } from '../types/index';

/**
 * Hook para obtener lista de registros de auditoría
 */
export function useAuditoriaList(filtros?: AuditoriaFiltros) {
  return useQuery({
    queryKey: ['auditoria', filtros],
    queryFn: () => auditoriaService.getAuditoria(filtros),
    staleTime: 30000, // 30 segundos
  });
}

/**
 * Hook para obtener detalle de un registro de auditoría
 */
export function useAuditoriaDetalle(id: number | null) {
  return useQuery({
    queryKey: ['auditoria', 'detalle', id],
    queryFn: () => auditoriaService.getAuditoriaDetalle(id!),
    enabled: id !== null,
    staleTime: 60000, // 1 minuto
  });
}

/**
 * Hook para obtener estadísticas de auditoría
 */
export function useAuditoriaEstadisticas(dias: number = 30) {
  return useQuery({
    queryKey: ['auditoria', 'estadisticas', dias],
    queryFn: () => auditoriaService.getEstadisticas(dias),
    staleTime: 300000, // 5 minutos
  });
}

/**
 * Hook para obtener lista de tablas
 */
export function useAuditoriaTablas() {
  return useQuery({
    queryKey: ['auditoria', 'tablas'],
    queryFn: auditoriaService.getTablas,
    staleTime: 600000, // 10 minutos
  });
}

/**
 * Hook para obtener lista de acciones
 */
export function useAuditoriaAcciones() {
  return useQuery({
    queryKey: ['auditoria', 'acciones'],
    queryFn: auditoriaService.getAcciones,
    staleTime: 600000, // 10 minutos
  });
}
