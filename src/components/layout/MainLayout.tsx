import { Layout, Grid } from 'antd';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../hooks/useSidebar';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;
const { useBreakpoint } = Grid;

export default function MainLayout() {
  const { collapsed } = useSidebar();
  const screens = useBreakpoint();

  // En pantallas pequeñas (md = 768px), el sidebar es overlay, no empuja el contenido
  const isSmallScreen = !screens.md;
  const marginLeft = isSmallScreen ? 0 : (collapsed ? 80 : 240);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout
        style={{
          marginLeft,
          transition: 'margin-left 0.2s',
        }}
      >
        <Header />
        <Content
          style={{
            marginTop: 56,
            padding: 24,
            background: '#f5f5f5',
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
