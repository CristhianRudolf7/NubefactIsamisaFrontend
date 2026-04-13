import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  RetweetOutlined,
  CarOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../hooks/useSidebar';
import { useDashboardStats } from '../../hooks/useDashboard';

const { Sider } = Layout;

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const { data: statsData } = useDashboardStats();

  const stats = statsData?.data;

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/ventas',
      icon: <FileTextOutlined />,
      label: collapsed ? '' : `Ventas (${stats?.ventas?.pendientes || 0})`,
      title: 'Ventas',
    },
    {
      key: '/retenciones',
      icon: <RetweetOutlined />,
      label: collapsed ? '' : `Retenciones (${stats?.retenciones?.pendientes || 0})`,
      title: 'Retenciones',
    },
    {
      key: '/guias',
      icon: <CarOutlined />,
      label: collapsed ? '' : `Guías (${stats?.guias?.pendientes || 0})`,
      title: 'Guías',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      collapsedWidth={80}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        background: '#001529',
        zIndex: 101,
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
  );
}
