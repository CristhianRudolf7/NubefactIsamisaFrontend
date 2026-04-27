import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import type { ResponseBase } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

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
      const response = await axios.get(`${API_URL}/config/envios`, { withCredentials: true });
      return response.data;
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: async ({ tipo, datos }: { tipo: string; datos: Partial<ConfiguracionEnvio> }) => {
      const response = await axios.put(`${API_URL}/config/envios/${tipo}`, datos, { withCredentials: true });
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
