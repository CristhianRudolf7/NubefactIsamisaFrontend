import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useVenta, useActualizarVenta, useEnviarVenta } from '../../hooks/useVentas';
import { useAppContext } from '../../contexts/AppContext';

export default function VentasEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const [form] = Form.useForm();

  const { data, isLoading } = useVenta(id!);
  const actualizarMutation = useActualizarVenta();
  const enviarMutation = useEnviarVenta();

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Documento no encontrado" type="error" />;
  }

  const { cabecera } = documento;

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      const result = await actualizarMutation.mutateAsync({
        documentId: cabecera.Document,
        datos: values,
        usuario,
      });
      if (result.success) {
        message.success('Documento actualizado');
      } else {
        message.error(result.message || 'Error al actualizar');
      }
    } catch {
      message.error('Error al actualizar documento');
    }
  };

  const handleSaveAndSend = async (values: Record<string, unknown>) => {
    try {
      await actualizarMutation.mutateAsync({
        documentId: cabecera.Document,
        datos: values,
        usuario,
      });
      const result = await enviarMutation.mutateAsync({
        documentId: cabecera.Document,
        usuario,
      });
      if (result.success) {
        message.success('Documento actualizado y enviado');
        navigate('/ventas');
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error en la operación');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/ventas/${id}`)}>
          Volver
        </Button>
      </Space>

      <Card title="Editar Documento (Solo si está rechazado/observado)">
        <Alert
          message="Solo puede editar documentos que hayan sido rechazados o tengan observaciones de SUNAT."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            VendorRUC: cabecera.VendorRUC,
            VendorName: cabecera.VendorName,
            VendorAddress: cabecera.VendorAddress,
            VendorEmail: cabecera.VendorEmail,
            AmountNetLo: cabecera.AmountNetLo,
            AmountTaxLo: cabecera.AmountTaxLo,
            AmountTotalLo: cabecera.AmountTotalLo,
          }}
          onFinish={handleSave}
        >
          <Form.Item label="RUC Cliente" name="VendorRUC">
            <Input />
          </Form.Item>
          <Form.Item label="Nombre Cliente" name="VendorName">
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="VendorAddress">
            <Input />
          </Form.Item>
          <Form.Item label="Email" name="VendorEmail">
            <Input type="email" />
          </Form.Item>
          <Form.Item label="Monto Neto" name="AmountNetLo">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="IGV" name="AmountTaxLo">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Total" name="AmountTotalLo">
            <InputNumber style={{ width: '100%' }} />
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
              onClick={() => {
                form.validateFields().then((values) => handleSaveAndSend(values));
              }}
              loading={enviarMutation.isPending}
            >
              Guardar y Enviar
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
