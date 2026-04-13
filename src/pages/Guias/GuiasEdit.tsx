import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined } from '@ant-design/icons';
import { useGuia, useActualizarGuia, useEnviarGuia } from '../../hooks/useGuias';
import { useAppContext } from '../../contexts/AppContext';

export default function GuiasEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const [form] = Form.useForm();

  const { data, isLoading } = useGuia(id!);
  const actualizarMutation = useActualizarGuia();
  const enviarMutation = useEnviarGuia();

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Guía no encontrada" type="error" />;
  }

  const { cabecera } = documento;

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      const result = await actualizarMutation.mutateAsync({
        transactionId: cabecera.Transaction,
        datos: values,
        usuario,
      });
      if (result.success) {
        message.success('Guía actualizada');
      } else {
        message.error(result.message || 'Error al actualizar');
      }
    } catch {
      message.error('Error al actualizar guía');
    }
  };

  const handleSaveAndSend = async (values: Record<string, unknown>) => {
    try {
      await actualizarMutation.mutateAsync({
        transactionId: cabecera.Transaction,
        datos: values,
        usuario,
      });
      const result = await enviarMutation.mutateAsync({
        transactionId: cabecera.Transaction,
        usuario,
      });
      if (result.success) {
        message.success('Guía actualizada y enviada');
        navigate('/guias');
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
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/guias/${id}`)}>
          Volver
        </Button>
      </Space>

      <Card title="Editar Guía de Remisión">
        <Alert
          message="Solo puede editar guías que hayan sido rechazadas o tengan errores."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            TargetPersonRUC: cabecera.TargetPersonRUC,
            TargetPersonName: cabecera.TargetPersonName,
            TargetAddress: cabecera.TargetAddress,
            MotivoTraslado: cabecera.MotivoTraslado,
            PesoBruto: cabecera.PesoBruto,
            RucTransportista: cabecera.RucTransportista,
            Transportista: cabecera.Transportista,
            VehicleID: cabecera.VehicleID,
            Driver: cabecera.Driver,
            LicenciaConducir: cabecera.LicenciaConducir,
            origenaddress: cabecera.origenaddress,
            ubigeo_des: cabecera.ubigeo_des,
            Comments: cabecera.Comments,
          }}
          onFinish={handleSave}
        >
          <Form.Item label="RUC Destinatario" name="TargetPersonRUC">
            <Input />
          </Form.Item>
          <Form.Item label="Nombre Destinatario" name="TargetPersonName">
            <Input />
          </Form.Item>
          <Form.Item label="Dirección Destino" name="TargetAddress">
            <Input />
          </Form.Item>
          <Form.Item label="Motivo de Traslado" name="MotivoTraslado">
            <Input />
          </Form.Item>
          <Form.Item label="Peso Bruto (kg)" name="PesoBruto">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="RUC Transportista" name="RucTransportista">
            <Input />
          </Form.Item>
          <Form.Item label="Transportista" name="Transportista">
            <Input />
          </Form.Item>
          <Form.Item label="ID Vehículo" name="VehicleID">
            <Input />
          </Form.Item>
          <Form.Item label="Conductor" name="Driver">
            <Input />
          </Form.Item>
          <Form.Item label="Licencia de Conducir" name="LicenciaConducir">
            <Input />
          </Form.Item>
          <Form.Item label="Dirección Origen" name="origenaddress">
            <Input />
          </Form.Item>
          <Form.Item label="Ubigeo Destino" name="ubigeo_des">
            <Input />
          </Form.Item>
          <Form.Item label="Comentarios" name="Comments">
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
          </Space>
        </Form>
      </Card>
    </div>
  );
}
