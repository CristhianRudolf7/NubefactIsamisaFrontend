import { Layout, Menu, Grid } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  RetweetOutlined,
  CarOutlined,
  TeamOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../hooks/useSidebar';
import { useAuth } from '../../contexts/AuthContext';

const { useBreakpoint } = Grid;

const { Sider } = Layout;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed, setCollapsed } = useSidebar();
  const { user } = useAuth();
  const screens = useBreakpoint();

  // En pantallas pequeñas (md = 768px), el sidebar colapsa completamente
  const isSmallScreen = !screens.md;
  const collapsedWidth = isSmallScreen ? 0 : 80;

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    // Ventas: visible si es admin o tiene permiso de ventas
    ...(user?.rol === 'admin' || user?.puede_acceder_ventas ? [{
      key: '/ventas',
      icon: <FileTextOutlined />,
      label: 'Ventas',
      title: 'Ventas',
    }] : []),
    // Retenciones: visible si es admin o tiene permiso de retenciones
    ...(user?.rol === 'admin' || user?.puede_acceder_retenciones ? [{
      key: '/retenciones',
      icon: <RetweetOutlined />,
      label: 'Retenciones',
      title: 'Retenciones',
    }] : []),
    // Guías: visible si es admin o tiene permiso de guías
    ...(user?.rol === 'admin' || user?.puede_acceder_guias ? [{
      key: '/guias',
      icon: <CarOutlined />,
      label: 'Guías',
      title: 'Guías',
    }] : []),
    // Solo admin puede ver el menú de usuarios
    ...(user?.rol === 'admin' ? [{
      key: '/usuarios',
      icon: <TeamOutlined />,
      label: 'Usuarios',
      title: 'Usuarios',
    }] : []),
    // Solo admin puede ver el menú de auditoría
    ...(user?.rol === 'admin' ? [{
      key: '/auditoria',
      icon: <AuditOutlined />,
      label: 'Auditoría',
      title: 'Auditoría',
    }] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <>
      {/* Backdrop oscuro para pantallas pequeñas cuando el menú está abierto */}
      {isSmallScreen && !collapsed && (
        <div
          onClick={() => setCollapsed(true)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            zIndex: 100,
          }}
        />
      )}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={240}
        collapsedWidth={collapsedWidth}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#001529',
          zIndex: isSmallScreen ? 102 : 101,
        }}
      >
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {collapsed ? 'IS' : 'ISAMISA'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
      </Sider>
    </>
  );
}
