import { useState } from 'react';
import { Layout, Breadcrumb, Avatar, Dropdown, Space, Tag, Grid, Button, Typography } from 'antd';
import { UserOutlined, LogoutOutlined, LockOutlined } from '@ant-design/icons';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSidebar } from '../../hooks/useSidebar';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import { Form, Modal, Input, message } from 'antd';
import authService from '../../services/authService';

const { Header: AntHeader } = Layout;
const { Title, Text } = Typography;

const breadcrumbNameMap: Record<string, string> = {
  '/': 'Dashboard',
  '/ventas': 'Ventas',
  '/retenciones': 'Retenciones',
  '/guias': 'Guías',
  '/usuarios': 'Usuarios',
};

export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const screens = Grid.useBreakpoint();

  // En pantallas pequeñas (md = 768px), el sidebar es overlay, no empuja el header
  const isSmallScreen = !screens.md;
  const left = isSmallScreen ? 0 : (collapsed ? 80 : 240);

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
    } else if (key === 'profile') {
      setProfileModalVisible(true);
    } else if (key === 'password') {
      setPasswordModalVisible(true);
    }
  };

  const handlePasswordChange = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('Las contraseñas nuevas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      await authService.changePassword(values.current_password, values.new_password);
      message.success('Contraseña actualizada correctamente');
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || 'Error al cambiar contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Perfil',
    },
    {
      key: 'password',
      icon: <LockOutlined />,
      label: 'Cambiar contraseña',
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
        left,
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

      {/* Modal de Perfil */}
      <Modal
        title="Información del Perfil"
        open={profileModalVisible}
        onCancel={() => setProfileModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setProfileModalVisible(false)}>
            Cerrar
          </Button>,
          <Button 
            key="password" 
            type="primary" 
            icon={<LockOutlined />}
            onClick={() => {
              setProfileModalVisible(false);
              setPasswordModalVisible(true);
            }}
          >
            Cambiar Contraseña
          </Button>
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#1677ff' }} />
            <Title level={4} style={{ marginTop: 12, marginBottom: 0 }}>{user?.nombre}</Title>
            <Tag color={user?.rol === 'admin' ? 'blue' : 'green'} style={{ marginTop: 8 }}>
              {user?.rol === 'admin' ? 'Administrador' : 'Trabajador'}
            </Tag>
          </div>
          
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
              <Text type="secondary">DNI:</Text>
              <Text strong>{user?.dni}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
              <Text type="secondary">Celular:</Text>
              <Text strong>{user?.celular || '-'}</Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: 8 }}>
              <Text type="secondary">Estado:</Text>
              <Tag color={user?.is_active ? 'success' : 'error'}>
                {user?.is_active ? 'Activo' : 'Inactivo'}
              </Tag>
            </div>
          </Space>
        </div>
      </Modal>

      {/* Modal de Cambiar Contraseña */}
      <Modal
        title="Cambiar contraseña"
        open={passwordModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setPasswordModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={submitting}
        okText="Actualizar"
        cancelText="Cancelar"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="current_password"
            label="Contraseña actual"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña actual' }]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="new_password"
            label="Nueva contraseña"
            rules={[
              { required: true, message: 'Por favor ingresa la nueva contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Input.Password />
          </Form.Item>
          
          <Form.Item
            name="confirm_password"
            label="Confirmar nueva contraseña"
            rules={[
              { required: true, message: 'Por favor confirma la nueva contraseña' },
              { min: 6, message: 'La contraseña debe tener al menos 6 caracteres' }
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </AntHeader>
  );
}
