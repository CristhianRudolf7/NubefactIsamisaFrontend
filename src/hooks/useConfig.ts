import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { ResponseBase } from '../types';

export interface ConfiguracionEnvio {
  id: number;
  tipo_documento: string;
  modo: string;
  activo: boolean;
  intervalo_segundos: number;
}

export function useConfig() {
  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery<ResponseBase<ConfiguracionEnvio[]>>({
    queryKey: ['config_envios'],
    queryFn: async () => {
      const response = await api.get('/config/envios');
      return response.data;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ tipo, datos }: { tipo: string; datos: Partial<ConfiguracionEnvio> }) => {
      const response = await api.put(`/config/envios/${tipo}`, datos);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config_envios'] });
    },
  });

  return {
    configs: configs?.data || [],
    isLoading,
    updateConfig: updateConfigMutation.mutateAsync,
    isUpdating: updateConfigMutation.isPending,
  };
}
