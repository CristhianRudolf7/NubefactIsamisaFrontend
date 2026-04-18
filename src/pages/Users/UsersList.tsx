import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, App, Badge, Tooltip, Checkbox } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ReloadOutlined, SafetyOutlined, PhoneOutlined, BellOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersService, { type UserCreate, type UserUpdate } from '../../services/usersService';
import type { User, UserRole } from '../../types/auth';

export default function UsersList() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPermisosUser, setEditingPermisosUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [permisosForm] = Form.useForm();

  // Obtener usuarios
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getUsers,
  });

  // Crear usuario
  const createMutation = useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Usuario creado correctamente');
      handleCloseModal();
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al crear usuario';
      message.error(errorMsg);
    },
  });

  // Actualizar usuario
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdate }) => usersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al actualizar usuario';
      message.error(errorMsg);
    },
  });

  // Eliminar usuario
  const deleteMutation = useMutation({
    mutationFn: usersService.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      message.success('Usuario eliminado correctamente');
    },
    onError: (error: unknown) => {
      const errorMsg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Error al eliminar usuario';
      message.error(errorMsg);
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      dni: user.dni,
      nombre: user.nombre,
      celular: user.celular,
      rol: user.rol,
      recibir_notificaciones: user.recibir_notificaciones,
      puede_acceder_ventas: user.puede_acceder_ventas,
      puede_acceder_guias: user.puede_acceder_guias,
      puede_acceder_retenciones: user.puede_acceder_retenciones,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleOpenPermisos = (user: User) => {
    setEditingPermisosUser(user);
    permisosForm.setFieldsValue({
      puede_acceder_ventas: user.puede_acceder_ventas,
      puede_acceder_guias: user.puede_acceder_guias,
      puede_acceder_retenciones: user.puede_acceder_retenciones,
    });
    setIsPermisosModalOpen(true);
  };

  const handleClosePermisosModal = () => {
    setIsPermisosModalOpen(false);
    setEditingPermisosUser(null);
    permisosForm.resetFields();
  };

  const handlePermisosSubmit = async (values: { puede_acceder_ventas: boolean; puede_acceder_guias: boolean; puede_acceder_retenciones: boolean }) => {
    if (!editingPermisosUser) return;
    updateMutation.mutate({
      id: editingPermisosUser.id,
      data: values,
    }, {
      onSuccess: () => {
        message.success('Permisos actualizados correctamente');
        setIsPermisosModalOpen(false);
        setEditingPermisosUser(null);
        permisosForm.resetFields();
      }
    });
  };

  const handleSubmit = async (values: { dni: string; nombre: string; celular: string; password?: string; rol: UserRole; recibir_notificaciones?: boolean; puede_acceder_ventas?: boolean; puede_acceder_guias?: boolean; puede_acceder_retenciones?: boolean }) => {
    if (editingUser) {
      // Editar: solo enviar password si se proporcionó
      const updateData: UserUpdate = {
        nombre: values.nombre,
        celular: values.celular,
        rol: values.rol,
        recibir_notificaciones: values.recibir_notificaciones,
        puede_acceder_ventas: values.puede_acceder_ventas,
        puede_acceder_guias: values.puede_acceder_guias,
        puede_acceder_retenciones: values.puede_acceder_retenciones,
      };
      if (values.password) {
        updateData.password = values.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData }, {
        onSuccess: () => {
          message.success('Usuario actualizado correctamente');
          handleCloseModal();
        }
      });
    } else {
      // Crear: password es requerido
      createMutation.mutate(values as UserCreate);
    }
  };

  const handleToggleActive = (user: User) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
    }, {
      onSuccess: () => {
        message.success(`Usuario ${!user.is_active ? 'activado' : 'desactivado'} correctamente`);
      }
    });
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      title: 'DNI',
      dataIndex: 'dni',
      key: 'dni',
      width: 120,
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
    },
    {
      title: 'Celular',
      dataIndex: 'celular',
      key: 'celular',
      width: 120,
    },
    {
      title: 'Notificaciones',
      dataIndex: 'recibir_notificaciones',
      key: 'recibir_notificaciones',
      width: 120,
      render: (recibir: boolean) => (
        <Tag color={recibir ? 'green' : 'default'}>
          {recibir ? 'Sí' : 'No'}
        </Tag>
      ),
    },
    {
      title: 'Rol',
      dataIndex: 'rol',
      key: 'rol',
      width: 120,
      render: (rol: UserRole) => (
        <Tag color={rol === 'admin' ? 'blue' : 'green'}>
          {rol === 'admin' ? 'Admin' : 'Trabajador'}
        </Tag>
      ),
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
      title: 'Permisos',
      key: 'permisos',
      width: 200,
      render: (_: unknown, record: User) => {
        if (record.rol === 'admin') {
          return <Tag color="blue">Acceso total</Tag>;
        }
        return (
          <Space size="small" wrap>
            {record.puede_acceder_ventas && <Tag color="green">Ventas</Tag>}
            {record.puede_acceder_guias && <Tag color="orange">Guías</Tag>}
            {record.puede_acceder_retenciones && <Tag color="purple">Retenciones</Tag>}
            {!record.puede_acceder_ventas && !record.puede_acceder_guias && !record.puede_acceder_retenciones && (
              <Tag>Sin permisos</Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 250,
      render: (_: unknown, record: User) => (
        <Space>
          <Tooltip title="Editar usuario">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          {record.rol === 'trabajador' && (
            <Button
              type="primary"
              size="small"
              icon={<SafetyOutlined />}
              onClick={() => handleOpenPermisos(record)}
            >
              Permisos
            </Button>
          )}
          <Button
            type="text"
            onClick={() => handleToggleActive(record)}
          >
            {record.is_active ? 'Desactivar' : 'Activar'}
          </Button>
          <Popconfirm
            title="¿Eliminar usuario?"
            description="Esta acción no se puede deshacer"
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
        <h2 style={{ margin: 0 }}>Gestión de Usuarios</h2>
        <Space>
          <Tooltip title="Recargar datos">
            <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })} loading={isLoading} />
          </Tooltip>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            Nuevo Usuario
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="dni"
            label="DNI"
            rules={[
              { required: true, message: 'Ingrese el DNI' },
              { len: 8, message: 'El DNI debe tener 8 dígitos' },
              { pattern: /^\d+$/, message: 'Solo se permiten números' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="DNI"
              maxLength={8}
              disabled={!!editingUser}
            />
          </Form.Item>

          <Form.Item
            name="nombre"
            label="Nombre completo"
            rules={[{ required: true, message: 'Ingrese el nombre' }]}
          >
            <Input placeholder="Nombre completo" />
          </Form.Item>

          <Form.Item
            name="celular"
            label="Celular"
            rules={[
              { required: true, message: 'Ingrese el número de celular' },
              { len: 9, message: 'El celular debe tener 9 dígitos' },
              { pattern: /^\d+$/, message: 'Solo se permiten números' },
            ]}
          >
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Celular"
              maxLength={9}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={editingUser ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            rules={editingUser ? [] : [{ required: true, message: 'Ingrese la contraseña' }]}
          >
            <Input.Password placeholder="Contraseña" />
          </Form.Item>

          <Form.Item
            name="rol"
            label="Rol"
            rules={[{ required: true, message: 'Seleccione el rol' }]}
          >
            <Select placeholder="Seleccione rol">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="trabajador">Trabajador</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="recibir_notificaciones"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>
              <BellOutlined style={{ marginRight: 8 }} />
              Recibir notificaciones
            </Checkbox>
          </Form.Item>

          {/* Permisos solo para trabajadores */}
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.rol !== currentValues.rol}>
            {({ getFieldValue }) => {
              const rol = getFieldValue('rol');
              if (rol === 'trabajador') {
                return (
                  <Form.Item label="Permisos de acceso">
                    <Space orientation="vertical">
                      <Form.Item name="puede_acceder_ventas" valuePropName="checked" noStyle>
                        <Checkbox>Acceso a Ventas</Checkbox>
                      </Form.Item>
                      <Form.Item name="puede_acceder_guias" valuePropName="checked" noStyle>
                        <Checkbox>Acceso a Guías</Checkbox>
                      </Form.Item>
                      <Form.Item name="puede_acceder_retenciones" valuePropName="checked" noStyle>
                        <Checkbox>Acceso a Retenciones</Checkbox>
                      </Form.Item>
                    </Space>
                  </Form.Item>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingUser ? 'Guardar cambios' : 'Crear usuario'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal para editar permisos */}
      <Modal
        title={`Editar Permisos - ${editingPermisosUser?.nombre || ''}`}
        open={isPermisosModalOpen}
        onCancel={handleClosePermisosModal}
        footer={null}
        width={400}
      >
        <div style={{ marginBottom: 16, color: '#666' }}>
          DNI: <strong>{editingPermisosUser?.dni}</strong>
        </div>
        <Form
          form={permisosForm}
          layout="vertical"
          onFinish={handlePermisosSubmit}
        >
          <Form.Item label="Permisos de acceso">
            <Space orientation="vertical" style={{ width: '100' }}>
              <Form.Item name="puede_acceder_ventas" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 14 }}>
                  <span>
                    <Tag color="green" style={{ marginLeft: 8 }}>Ventas</Tag>
                    Acceso al módulo de ventas
                  </span>
                </Checkbox>
              </Form.Item>
              <Form.Item name="puede_acceder_guias" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 14 }}>
                  <span>
                    <Tag color="orange" style={{ marginLeft: 8 }}>Guías</Tag>
                    Acceso al módulo de guías
                  </span>
                </Checkbox>
              </Form.Item>
              <Form.Item name="puede_acceder_retenciones" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 14 }}>
                  <span>
                    <Tag color="purple" style={{ marginLeft: 8 }}>Retenciones</Tag>
                    Acceso al módulo de retenciones
                  </span>
                </Checkbox>
              </Form.Item>
            </Space>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button onClick={handleClosePermisosModal}>Cancelar</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={updateMutation.isPending}
              >
                Guardar permisos
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
