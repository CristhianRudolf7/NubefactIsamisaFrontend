import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../../hooks/useSidebar';
import Header from './Header';
import Sidebar from './Sidebar';

const { Content } = Layout;

export default function MainLayout() {
  const { collapsed } = useSidebar();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
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
