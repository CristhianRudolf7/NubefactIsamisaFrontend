import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retencionesService } from '../services/retencionesService';
import { POLLING_INTERVAL } from '../utils/constants';
import type { FilterParams, PaginationParams } from '../types';

export function useRetenciones(params: FilterParams & PaginationParams) {
  return useQuery({
    queryKey: ['retenciones', params],
    queryFn: () => retencionesService.listar(params),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useRetencion(retencionId: number) {
  return useQuery({
    queryKey: ['retencion', retencionId],
    queryFn: () => retencionesService.obtener(retencionId),
    enabled: !!retencionId,
  });
}

export function useEnviarRetencion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ retencionId, usuario }: { retencionId: number; usuario: string }) =>
      retencionesService.enviar(retencionId, usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retenciones'] });
    },
  });
}

export function useActualizarRetencion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ retencionId, datos, usuario }: { retencionId: number; datos: Record<string, unknown>; usuario: string }) =>
      retencionesService.actualizar(retencionId, datos, usuario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['retenciones'] });
      queryClient.invalidateQueries({ queryKey: ['retencion', variables.retencionId] });
    },
  });
}
