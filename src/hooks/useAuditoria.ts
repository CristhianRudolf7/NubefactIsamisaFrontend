import { useQuery } from '@tanstack/react-query';
import auditoriaService from '../services/auditoriaService';
import type { AuditoriaFiltros } from '../types';

export function useAuditoriaList(filtros: AuditoriaFiltros) {
  return useQuery({
    queryKey: ['auditoria', 'list', filtros],
    queryFn: () => auditoriaService.getAuditoria(filtros),
  });
}

export function useAuditoriaDetalle(id: number | null) {
  return useQuery({
    queryKey: ['auditoria', 'detalle', id],
    queryFn: () => auditoriaService.getAuditoriaDetalle(id!),
    enabled: !!id,
  });
}

export function useAuditoriaEstadisticas(dias: number = 30) {
  return useQuery({
    queryKey: ['auditoria', 'estadisticas', dias],
    queryFn: () => auditoriaService.getEstadisticas(dias),
  });
}

export function useAuditoriaTablas() {
  return useQuery({
    queryKey: ['auditoria', 'tablas'],
    queryFn: () => auditoriaService.getTablas(),
  });
}

export function useAuditoriaAcciones() {
  return useQuery({
    queryKey: ['auditoria', 'acciones'],
    queryFn: () => auditoriaService.getAcciones(),
  });
}

export function useRecordHistory(tabla: string, registroId: string) {
  return useQuery({
    queryKey: ['auditoria', 'history', tabla, registroId],
    queryFn: () => auditoriaService.getAuditoria({ tabla, registro_id: registroId, page: 1, page_size: 10 }),
    enabled: !!tabla && !!registroId,
  });
}
