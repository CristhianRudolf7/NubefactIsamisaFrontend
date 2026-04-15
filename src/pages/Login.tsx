import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Login() {
  const { login, isLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { dni: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.dni, values.password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3} style={{ marginBottom: 8 }}>
              Sistema de Gestión
            </Title>
            <Text type="secondary">Documentos Electrónicos - SUNAT</Text>
          </div>

          <Form
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="dni"
              rules={[
                { required: true, message: 'Ingrese su DNI' },
                { len: 8, message: 'El DNI debe tener 8 dígitos' },
                { pattern: /^\d+$/, message: 'Solo se permiten números' },
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="DNI"
                size="large"
                maxLength={8}
                disabled={loading || isLoading}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Ingrese su contraseña' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Contraseña"
                size="large"
                disabled={loading || isLoading}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading || isLoading}
              >
                Iniciar Sesión
              </Button>
            </Form.Item>
          </Form>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              v1.0.0 - Isamisa
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
}
