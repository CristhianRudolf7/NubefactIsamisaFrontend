import { Layout, Breadcrumb, Badge, Avatar, Dropdown, Space, Tag } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';
import { useAppContext } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Header: AntHeader } = Layout;

const breadcrumbNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/ventas': 'Ventas',
  '/retenciones': 'Retenciones',
  '/guias': 'Guías',
  '/usuarios': 'Usuarios',
  '/tokens': 'Tokens API',
};

export default function Header() {
  const location = useLocation();
  const { notificaciones } = useAppContext();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();

  const pathSnippets = location.pathname.split('/').filter((i) => i);
  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    return {
      key: url,
      title: <Link to={url}>{breadcrumbNameMap[url] || _}</Link>,
    };
  });

  const breadcrumbItems = [
    {
      key: '/home',
      title: <Link to="/">Inicio</Link>,
    },
    ...extraBreadcrumbItems,
  ];

  const handleMenuClick = async (key: string) => {
    if (key === 'logout') {
      await logout();
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Configuración',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar sesión',
      danger: true,
    },
  ];

  const rolColor = user?.rol === 'admin' ? 'blue' : 'green';

  return (
    <AntHeader
      style={{
        position: 'fixed',
        top: 0,
        left: collapsed ? 80 : 240,
        right: 0,
        zIndex: 100,
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        transition: 'left 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          onClick={toggle}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
          }}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <Space size={16}>
        <Badge count={notificaciones} size="small">
          <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
        </Badge>
        <Dropdown 
          menu={{ items: userMenuItems, onClick: ({ key }) => handleMenuClick(key) }} 
          placement="bottomRight"
        >
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span style={{ fontSize: 14 }}>{user?.nombre}</span>
            <Tag color={rolColor} style={{ marginLeft: 4 }}>
              {user?.rol === 'admin' ? 'Admin' : 'Trabajador'}
            </Tag>
          </Space>
        </Dropdown>
      </Space>
    </AntHeader>
  );
}
