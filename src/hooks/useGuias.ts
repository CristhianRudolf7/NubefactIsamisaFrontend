import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guiasService } from '../services/guiasService';
import { POLLING_INTERVAL } from '../utils/constants';
import type { FilterParams, PaginationParams } from '../types';

export function useGuias(params: FilterParams & PaginationParams, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['guias', params],
    queryFn: () => guiasService.listar(params),
    refetchInterval: POLLING_INTERVAL,
    ...options,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', variables.transactionId] });
    },
  });
}

export function useConsultarGuia() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (transactionId: string) =>
      guiasService.consultar(transactionId),
    onSuccess: (_, transactionId) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', transactionId] });
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

export function useAnularGuia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, motivo, usuario }: { transactionId: string; motivo: string; usuario: string }) =>
      guiasService.anular(transactionId, motivo, usuario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', variables.transactionId] });
    },
  });
}

export function useAprobarGuia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, usuario }: { transactionId: string; usuario: string }) =>
      guiasService.aprobar(transactionId, usuario),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useRechazarGuia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId }: { transactionId: string }) =>
      guiasService.rechazar(transactionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guias'] });
      queryClient.invalidateQueries({ queryKey: ['guia', variables.transactionId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
