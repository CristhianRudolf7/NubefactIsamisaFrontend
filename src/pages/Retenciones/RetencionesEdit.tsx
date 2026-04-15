import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, App, DatePicker, Modal } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRetencion, useActualizarRetencion, useEnviarRetencion } from '../../hooks/useRetenciones';
import { useAppContext } from '../../contexts/AppContext';

export default function RetencionesEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data, isLoading } = useRetencion(Number(id));
  const actualizarMutation = useActualizarRetencion();
  const enviarMutation = useEnviarRetencion();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Retención no encontrada" type="error" />;
  }

  const { cabecera } = documento;

  // Convertir fecha de Excel a dayjs si existe
  const fechaEmision = cabecera.DocumentDate 
    ? dayjs('1899-12-30').add(cabecera.DocumentDate, 'day')
    : null;

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      // Convertir fecha a string dd-mm-YYYY
      const fechaFormateada = values.DocumentDate 
        ? dayjs(values.DocumentDate).format('DD-MM-YYYY')
        : null;
      
      const result = await actualizarMutation.mutateAsync({
        retencionId: cabecera.Id,
        datos: {
          ...values,
          DocumentDate: fechaFormateada,
        },
        usuario,
      });
      if (result.success) {
        message.success('Retención actualizada');
      } else {
        message.error(result.message || 'Error al actualizar');
      }
    } catch {
      message.error('Error al actualizar retención');
    }
  };

  const handleSaveAndSend = async (values: Record<string, unknown>) => {
    try {
      // Convertir fecha a string dd-mm-YYYY
      const fechaFormateada = values.DocumentDate 
        ? dayjs(values.DocumentDate).format('DD-MM-YYYY')
        : null;
      
      await actualizarMutation.mutateAsync({
        retencionId: cabecera.Id,
        datos: {
          ...values,
          DocumentDate: fechaFormateada,
        },
        usuario,
      });
      const result = await enviarMutation.mutateAsync({
        retencionId: cabecera.Id,
        usuario,
      });
      if (result.success) {
        message.success('Retención actualizada y enviada');
        navigate('/retenciones');
      } else {
        const errorMsg = result.message || result.error || 'Error al enviar';
        message.error(errorMsg);
        setErrorMessage(errorMsg);
        setErrorModalVisible(true);
      }
    } catch {
      message.error('Error en la operación');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/retenciones')}>
          Volver
        </Button>
      </Space>

      <Card title="Editar Retención">
        <Alert
          message="Solo puede editar retenciones que hayan sido rechazadas o tengan errores."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            DocumentDate: fechaEmision,
            VendorRuc: cabecera.VendorRuc,
            VendorName: cabecera.VendorName,
            VendorAddress: cabecera.VendorAddress,
            Tasa: cabecera.Tasa,
            TotalRetenido: cabecera.TotalRetenido,
            TotalPagado: cabecera.TotalPagado,
            Obs: cabecera.Obs,
          }}
          onFinish={handleSave}
        >
          <Form.Item label="Fecha de Emisión" name="DocumentDate">
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" placeholder="Seleccionar fecha" />
          </Form.Item>
          <Form.Item label="RUC Proveedor" name="VendorRuc">
            <Input />
          </Form.Item>
          <Form.Item label="Nombre Proveedor" name="VendorName">
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="VendorAddress">
            <Input />
          </Form.Item>
          <Form.Item label="Tasa (%)" name="Tasa">
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item label="Total Retenido" name="TotalRetenido">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Total Pagado" name="TotalPagado">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Observaciones" name="Obs">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Space>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={actualizarMutation.isPending}
            >
              Guardar
            </Button>
            <Button
              icon={<SendOutlined />}
              onClick={() => form.validateFields().then((values) => handleSaveAndSend(values))}
              loading={enviarMutation.isPending}
            >
              Guardar y Enviar
            </Button>
            {(cabecera.error_mensaje || cabecera.status === 'error') && (
              <Button
                icon={<ExclamationCircleOutlined />}
                danger
                onClick={() => {
                  setErrorMessage(cabecera.error_mensaje || 'Error desconocido');
                  setErrorModalVisible(true);
                }}
              >
                Ver Error
              </Button>
            )}
          </Space>
        </Form>
      </Card>

      <Modal
        title="Error del documento"
        open={errorModalVisible}
        onCancel={() => setErrorModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setErrorModalVisible(false)}>
            Cerrar
          </Button>
        ]}
      >
        <Alert
          message="Se produjo un error al procesar el documento"
          description={errorMessage}
          type="error"
          showIcon
        />
      </Modal>
    </div>
  );
}
