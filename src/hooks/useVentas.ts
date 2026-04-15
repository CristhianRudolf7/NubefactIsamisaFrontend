import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ventasService } from '../services/ventasService';
import { POLLING_INTERVAL } from '../utils/constants';
import type { FilterParams, PaginationParams } from '../types';

export function useVentas(params: FilterParams & PaginationParams) {
  return useQuery({
    queryKey: ['ventas', params],
    queryFn: () => ventasService.listar(params),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useVenta(documentId: string) {
  return useQuery({
    queryKey: ['venta', documentId],
    queryFn: () => ventasService.obtener(documentId),
    enabled: !!documentId,
  });
}

export function useEnviarVenta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ documentId, usuario }: { documentId: string; usuario: string }) =>
      ventasService.enviar(documentId, usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
    },
  });
}

export function useActualizarVenta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ documentId, datos, usuario }: { documentId: string; datos: Record<string, unknown>; usuario: string }) =>
      ventasService.actualizar(documentId, datos, usuario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      queryClient.invalidateQueries({ queryKey: ['venta', variables.documentId] });
    },
  });
}
