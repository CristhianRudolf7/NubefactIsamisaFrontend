import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, App as AntApp } from 'antd';
import esES from 'antd/locale/es_ES';

import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { SidebarProvider } from './hooks/useSidebar';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import VentasRoute from './components/auth/VentasRoute';
import GuiasRoute from './components/auth/GuiasRoute';
import RetencionesRoute from './components/auth/RetencionesRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VentasList from './pages/Ventas/VentasList';
import VentasDetail from './pages/Ventas/VentasDetail';
import VentasEdit from './pages/Ventas/VentasEdit';
import RetencionesList from './pages/Retenciones/RetencionesList';
import RetencionesDetail from './pages/Retenciones/RetencionesDetail';
import RetencionesEdit from './pages/Retenciones/RetencionesEdit';
import GuiasList from './pages/Guias/GuiasList';
import GuiasDetail from './pages/Guias/GuiasDetail';
import GuiasEdit from './pages/Guias/GuiasEdit';
import UsersList from './pages/Users/UsersList';
import AuditoriaList from './pages/Auditoria/AuditoriaList';
import NotFound from './pages/NotFound';

import './styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={esES}
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 4,
          },
        }}
      >
        <AntApp>
          <BrowserRouter>
            <AuthProvider>
            <AppProvider>
              <SidebarProvider>
                <Routes>
                  {/* Ruta pública de login */}
                  <Route path="/login" element={<Login />} />
                  
                  {/* Rutas protegidas */}
                  <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route path="/" element={<Dashboard />} />
                    {/* Rutas de ventas - requieren permiso de ventas */}
                    <Route path="/ventas" element={<VentasRoute><VentasList /></VentasRoute>} />
                    <Route path="/ventas/:id" element={<VentasRoute><VentasDetail /></VentasRoute>} />
                    <Route path="/ventas/:id/editar" element={<VentasRoute><VentasEdit /></VentasRoute>} />
                    {/* Rutas de retenciones - requieren permiso de retenciones */}
                    <Route path="/retenciones" element={<RetencionesRoute><RetencionesList /></RetencionesRoute>} />
                    <Route path="/retenciones/:id" element={<RetencionesRoute><RetencionesDetail /></RetencionesRoute>} />
                    <Route path="/retenciones/:id/editar" element={<RetencionesRoute><RetencionesEdit /></RetencionesRoute>} />
                    {/* Rutas de guías - requieren permiso de guías */}
                    <Route path="/guias" element={<GuiasRoute><GuiasList /></GuiasRoute>} />
                    <Route path="/guias/:id" element={<GuiasRoute><GuiasDetail /></GuiasRoute>} />
                    <Route path="/guias/:id/editar" element={<GuiasRoute><GuiasEdit /></GuiasRoute>} />
                    {/* Rutas solo para admin */}
                    <Route path="/usuarios" element={<AdminRoute><UsersList /></AdminRoute>} />
                    <Route path="/auditoria" element={<AdminRoute><AuditoriaList /></AdminRoute>} />
                    {/* Ruta para páginas no encontradas */}
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </SidebarProvider>
            </AppProvider>
          </AuthProvider>
          </BrowserRouter>
        </AntApp>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
