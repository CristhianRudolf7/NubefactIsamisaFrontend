import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { POLLING_INTERVAL } from '../utils/constants';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.obtenerEstadisticas(),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useEstados() {
  return useQuery({
    queryKey: ['dashboard', 'estados'],
    queryFn: () => dashboardService.obtenerEstados(),
    staleTime: Infinity, // No cambia frecuentemente
  });
}

export function useTiposDocumento() {
  return useQuery({
    queryKey: ['dashboard', 'tipos-documento'],
    queryFn: () => dashboardService.obtenerTiposDocumento(),
    staleTime: Infinity,
  });
}

export function useMotivosTraslado() {
  return useQuery({
    queryKey: ['dashboard', 'motivos-traslado'],
    queryFn: () => dashboardService.obtenerMotivosTraslado(),
    staleTime: Infinity,
  });
}

export function useResumenPorEstado(tipo: 'ventas' | 'retenciones' | 'guias') {
  return useQuery({
    queryKey: ['dashboard', 'resumen', tipo],
    queryFn: () => dashboardService.resumenPorEstado(tipo),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useActividadSemanal() {
  return useQuery({
    queryKey: ['dashboard', 'actividad-semanal'],
    queryFn: () => dashboardService.actividadSemanal(),
    refetchInterval: POLLING_INTERVAL,
  });
}
