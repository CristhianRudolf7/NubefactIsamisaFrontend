import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.obtenerEstadisticas(),
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
  });
}
