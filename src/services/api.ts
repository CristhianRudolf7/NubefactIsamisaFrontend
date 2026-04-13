import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Importante para enviar cookies HTTP-only
});

// Variable para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

// Interceptor para manejar errores y refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si es 401 y no es una petición de login o refresh
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Si ya estamos intentando refrescar, encolar la petición
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      // Si ya intentamos refrescar y falló, ir a login
      if (originalRequest._retry) {
        // Limpiar cola y redirigir
        processQueue(error);
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        await api.post('/auth/refresh');
        
        // Token refrescado exitosamente, reintentar peticiones en cola
        processQueue(null);
        
        // Reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        // Error al refrescar, redirigir a login
        processQueue(refreshError as AxiosError);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
