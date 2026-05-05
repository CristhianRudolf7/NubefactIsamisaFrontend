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

// Log para depuración en producción
console.log('API Base URL configurada:', API_BASE_URL);

// Interceptor de peticiones para ver a dónde van y añadir Token
api.interceptors.request.use((config) => {
  console.log(`🚀 Realizando petición a: ${config.baseURL}${config.url}`);
  
  // Obtener token de localStorage
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
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
    const url = error.config?.url || '';

    // No intentar refresh para endpoints de autenticación
    const authEndpoints = ['/auth/login', '/auth/logout', '/auth/refresh', '/auth/me'];
    const isAuthEndpoint = authEndpoints.some(endpoint => url.includes(endpoint));

    // Si es 401 y no es endpoint de auth y no estamos en login
    if (error.response?.status === 401 && !isAuthEndpoint && !window.location.pathname.includes('/login')) {
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
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token usando el refresh_token de localStorage
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
        
        // Guardar nuevos tokens
        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        // Token refrescado exitosamente, reintentar peticiones en cola
        processQueue(null);

        // Reintentar la petición original con el nuevo token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Error al refrescar, redirigir a login
        processQueue(refreshError as AxiosError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // No mostrar error 401 en console para /auth/me (es normal cuando no hay sesión)
    if (!(url.includes('/auth/me') && error.response?.status === 401)) {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
