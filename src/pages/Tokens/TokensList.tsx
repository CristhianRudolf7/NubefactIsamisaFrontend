import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Switch, Space, Popconfirm, message, Badge, Tag, DatePicker, Typography, Alert, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import tokensService, { type ApiTokenCreate, type ApiTokenUpdate, type ApiTokenCreated } from '../../services/tokensService';
import type { ApiToken } from '../../services/tokensService';
import dayjs from 'dayjs';

const { Text, Paragraph } = Typography;

export default function TokensList() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<ApiToken | null>(null);
  const [createdToken, setCreatedToken] = useState<ApiTokenCreated | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [form] = Form.useForm();

  // Obtener tokens
  const { data: tokens = [], isLoading } = useQuery({
    queryKey: ['tokens'],
    queryFn: tokensService.getTokens,
  });

  // Crear token
  const createMutation = useMutation({
    mutationFn: tokensService.createToken,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      setCreatedToken(data);
      setIsTokenModalOpen(true);
      handleCloseModal();
      message.success('Token creado correctamente');
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al crear token';
      message.error(errorMsg);
    },
  });

  // Actualizar token
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApiTokenUpdate }) => tokensService.updateToken(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      message.success('Token actualizado correctamente');
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al actualizar token';
      message.error(errorMsg);
    },
  });

  // Eliminar token
  const deleteMutation = useMutation({
    mutationFn: tokensService.deleteToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tokens'] });
      message.success('Token eliminado correctamente');
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al eliminar token';
      message.error(errorMsg);
    },
  });

  const handleOpenCreate = () => {
    setEditingToken(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (token: ApiToken) => {
    setEditingToken(token);
    form.setFieldsValue({
      name: token.name,
      is_active: token.is_active,
      expires_at: token.expires_at ? dayjs(token.expires_at) : null,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingToken(null);
    form.resetFields();
  };

  const handleSubmit = async (values: { name: string; is_active?: boolean; expires_at?: dayjs.Dayjs }) => {
    if (editingToken) {
      const updateData: ApiTokenUpdate = {
        name: values.name,
        is_active: values.is_active,
      };
      if (values.expires_at) {
        updateData.expires_at = values.expires_at.toISOString();
      }
      updateMutation.mutate({ id: editingToken.id, data: updateData });
    } else {
      const createData: ApiTokenCreate = {
        name: values.name,
      };
      if (values.expires_at) {
        createData.expires_at = values.expires_at.toISOString();
      }
      createMutation.mutate(createData);
    }
  };

  const handleToggleActive = (token: ApiToken) => {
    updateMutation.mutate({
      id: token.id,
      data: { is_active: !token.is_active },
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    message.success('Token copiado al portapapeles');
  };

  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false);
    setTokenCopied(false);
  };

  const columns = [
    {
      title: 'Prefijo',
      dataIndex: 'token_prefix',
      key: 'token_prefix',
      width: 120,
      render: (prefix: string) => <Tag color="blue">{prefix}...</Tag>,
    },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Estado',
      dataIndex: 'is_active',
      key: 'is_active',
      width: 100,
      render: (isActive: boolean) => (
        <Badge
          status={isActive ? 'success' : 'default'}
          text={isActive ? 'Activo' : 'Inactivo'}
        />
      ),
    },
    {
      title: 'Último uso',
      dataIndex: 'last_used_at',
      key: 'last_used_at',
      width: 180,
      render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Nunca',
    },
    {
      title: 'Expira',
      dataIndex: 'expires_at',
      key: 'expires_at',
      width: 150,
      render: (date: string | null) => date ? dayjs(date).format('DD/MM/YYYY') : 'Sin expiración',
    },
    {
      title: 'Creado',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 180,
      render: (_: unknown, record: ApiToken) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
          />
          <Button
            type="text"
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? 'Desactivar' : 'Activar'}
          </Button>
          <Popconfirm
            title="¿Eliminar token?"
            description="Esta acción no se puede deshacer. Los sistemas que usen este token perderán acceso."
            onConfirm={() => handleDelete(record.id)}
            okText="Eliminar"
            cancelText="Cancelar"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Tokens de API</h2>
        <Space>
          <Tooltip title="Recargar datos">
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['tokens'] })} loading={isLoading} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Nuevo Token
          </Button>
        </Space>
      </div>

      <Alert
        message="Los tokens permiten que sistemas externos (ERP) notifiquen nuevos documentos."
        description="Guarda los tokens de forma segura. Solo se muestran una vez al crearlos."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Table
        columns={columns}
        dataSource={tokens}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      {/* Modal para crear/editar token */}
      <Modal
        title={editingToken ? 'Editar Token' : 'Nuevo Token'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="Nombre descriptivo"
            rules={[{ required: true, message: 'Ingrese un nombre para el token' }]}
          >
            <Input placeholder="Ej: ERP Producción" />
          </Form.Item>

          <Form.Item
            name="expires_at"
            label="Fecha de expiración (opcional)"
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              placeholder="Sin expiración"
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          {editingToken && (
            <Form.Item
              name="is_active"
              label="Estado"
              valuePropName="checked"
            >
              <Switch checkedChildren="Activo" unCheckedChildren="Inactivo" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingToken ? 'Guardar cambios' : 'Crear token'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para mostrar token creado */}
      <Modal
        title={
          <span>
            <CopyOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Token Creado - ¡Cópialo ahora!
          </span>
        }
        open={isTokenModalOpen}
        onCancel={handleCloseTokenModal}
        footer={[
          <Button key="close" type="primary" onClick={handleCloseTokenModal}>
            {tokenCopied ? 'Listo, ya copié el token' : 'Cerrar'}
          </Button>,
        ]}
        width={650}
        maskClosable={false}
      >
        <Alert
          message="IMPORTANTE: Guarda este token de forma segura"
          description="Este token solo se mostrará una vez. No podrás recuperarlo después."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        {createdToken && (
          <div>
            <Text strong>Nombre:</Text>
            <Paragraph style={{ marginBottom: 16 }}>{createdToken.name}</Paragraph>
            
            <Text strong>Token:</Text>
            <div style={{ 
              background: '#f6ffed', 
              border: '2px solid #b7eb8f', 
              borderRadius: 8, 
              padding: 16, 
              marginBottom: 16,
              position: 'relative'
            }}>
              <code style={{ 
                display: 'block', 
                wordBreak: 'break-all', 
                fontSize: 14,
                fontFamily: 'monospace',
                marginBottom: 12
              }}>
                {createdToken.token}
              </code>
              <Button
                type={tokenCopied ? 'default' : 'primary'}
                size="large"
                icon={tokenCopied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => handleCopyToken(createdToken.token)}
                style={{ width: '100%' }}
                disabled={tokenCopied}
              >
                {tokenCopied ? 'Token copiado' : 'Copiar token al portapapeles'}
              </Button>
            </div>
            
            <Text strong>Prefijo para identificación:</Text>
            <Paragraph>
              <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>{createdToken.token_prefix}</Tag>
            </Paragraph>

            <Text strong>Para usar en API:</Text>
            <div style={{ 
              background: '#f5f5f5', 
              borderRadius: 4, 
              padding: 12, 
              marginTop: 8 
            }}>
              <code style={{ display: 'block', wordBreak: 'break-all' }}>
                Authorization: Bearer {createdToken.token}
              </code>
              <Button
                type="link"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(`Authorization: Bearer ${createdToken.token}`);
                  message.success('Header copiado');
                }}
                style={{ padding: '4px 0', marginTop: 4 }}
              >
                Copiar header completo
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
