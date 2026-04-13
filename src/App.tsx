import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';
import esES from 'antd/locale/es_ES';

import { AuthProvider } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { SidebarProvider } from './hooks/useSidebar';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
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
import TokensList from './pages/Tokens/TokensList';

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
                    <Route path="/ventas" element={<VentasList />} />
                    <Route path="/ventas/:id" element={<VentasDetail />} />
                    <Route path="/ventas/:id/editar" element={<VentasEdit />} />
                    <Route path="/retenciones" element={<RetencionesList />} />
                    <Route path="/retenciones/:id" element={<RetencionesDetail />} />
                    <Route path="/retenciones/:id/editar" element={<RetencionesEdit />} />
                    <Route path="/guias" element={<GuiasList />} />
                    <Route path="/guias/:id" element={<GuiasDetail />} />
                    <Route path="/guias/:id/editar" element={<GuiasEdit />} />
                    {/* Rutas solo para admin */}
                    <Route path="/usuarios" element={<AdminRoute><UsersList /></AdminRoute>} />
                    <Route path="/tokens" element={<AdminRoute><TokensList /></AdminRoute>} />
                  </Route>
                </Routes>
              </SidebarProvider>
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
