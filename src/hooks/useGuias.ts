import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guiasService } from '../services/guiasService';
import type { FilterParams, PaginationParams } from '../types';

export function useGuias(params: FilterParams & PaginationParams) {
  return useQuery({
    queryKey: ['guias', params],
    queryFn: () => guiasService.listar(params),
  });
}

export function useGuia(transactionId: string) {
  return useQuery({
    queryKey: ['guia', transactionId],
    queryFn: () => guiasService.obtener(transactionId),
    enabled: !!transactionId,
  });
}

export function useEnviarGuia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ transactionId, usuario }: { transactionId: string; usuario: string }) =>
      guiasService.enviar(transactionId, usuario),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
    },
  });
}

export function useActualizarGuia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ transactionId, datos, usuario }: { transactionId: string; datos: Record<string, unknown>; usuario: string }) =>
      guiasService.actualizar(transactionId, datos, usuario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', variables.transactionId] });
    },
  });
}
