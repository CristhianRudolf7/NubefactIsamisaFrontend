import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Space, Popconfirm, message, Badge, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import usersService, { type UserCreate, type UserUpdate } from '../../services/usersService';
import type { User, UserRole } from '../../types/auth';

export default function UsersList() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

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
      message.success('Usuario actualizado correctamente');
      handleCloseModal();
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
      rol: user.rol,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    form.resetFields();
  };

  const handleSubmit = async (values: { dni: string; nombre: string; password?: string; rol: UserRole }) => {
    if (editingUser) {
      // Editar: solo enviar password si se proporcionó
      const updateData: UserUpdate = {
        nombre: values.nombre,
        rol: values.rol,
      };
      if (values.password) {
        updateData.password = values.password;
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData });
    } else {
      // Crear: password es requerido
      createMutation.mutate(values as UserCreate);
    }
  };

  const handleToggleActive = (user: User) => {
    updateMutation.mutate({
      id: user.id,
      data: { is_active: !user.is_active },
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
      title: 'Acciones',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: User) => (
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
    </div>
  );
}
