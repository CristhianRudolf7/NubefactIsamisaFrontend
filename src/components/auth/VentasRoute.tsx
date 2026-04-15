import { Navigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

interface VentasRouteProps {
  children: React.ReactNode;
}

export default function VentasRoute({ children }: VentasRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin tiene acceso total, o trabajador con permiso de ventas
  const hasAccess = user?.rol === 'admin' || user?.puede_acceder_ventas;

  if (!hasAccess) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#f5f5f5',
        }}
      >
        <Result
          status="403"
          title="Acceso Denegado"
          subTitle="No tienes permisos para acceder al módulo de ventas."
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
