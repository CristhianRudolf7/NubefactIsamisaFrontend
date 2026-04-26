import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, App, Modal, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useGuia, useActualizarGuia, useEnviarGuia } from '../../hooks/useGuias';
import { useAppContext } from '../../contexts/AppContext';

export default function GuiasEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useGuia(id!);
  const actualizarMutation = useActualizarGuia();
  const enviarMutation = useEnviarGuia();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Error copiado al portapapeles');
  };

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
        // Refrescar datos para obtener el error actualizado de la BD
        const { data: newData } = await refetch();
        const newError = newData?.data?.cabecera?.error_mensaje || result.message || result.error || 'Error al enviar';
        message.error(newError);
        setErrorMessage(newError);
        setErrorModalVisible(true);
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
            ubigeo_des: cabecera.ubigeo_des,
            MotivoTraslado: cabecera.MotivoTraslado,
            PesoBruto: cabecera.PesoBruto,
            RucTransportista: cabecera.RucTransportista,
            Transportista: cabecera.Transportista,
            VehicleID: cabecera.VehicleID,
            DriverDNI: cabecera.DriverId,
            DriverNombre: cabecera.Driver ? (cabecera.Driver.split(' ').slice(2).join(' ') || '') : '',
            DriverApellido: cabecera.Driver ? (cabecera.Driver.split(' ').slice(0, 2).join(' ') || '') : '',
            LicenciaConducir: cabecera.LicenciaConducir,
            origenaddress: cabecera.origenaddress,
            SaleDocSerie: cabecera.SaleDocSerie,
            SaleDocNo: cabecera.SaleDocNo,
            Comments: cabecera.Comments,
          }}
          onFinish={handleSave}
        >
          <Divider>Remitente</Divider>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="Dirección Origen" name="origenaddress" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Ubigeo Origen" name="ubigeo_des" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Divider>Destinatario</Divider>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="RUC/DNI Destinatario" name="TargetPersonRUC" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Nombre Destinatario" name="TargetPersonName" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="Dirección Destino" name="TargetAddress" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Ubigeo Destino" name="ubigeo_des" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Divider>Transportista</Divider>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="RUC Transportista" name="RucTransportista" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Transportista" name="Transportista" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Placa" name="VehicleID" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="DNI Conductor" name="DriverDNI" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Nombre Conductor" name="DriverNombre" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Apellido Conductor" name="DriverApellido" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Licencia" name="LicenciaConducir" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Divider>Información del Traslado</Divider>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="Motivo de Traslado" name="MotivoTraslado" style={{ flex: 2 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Peso Bruto (kg)" name="PesoBruto" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Divider>Documento de Referencia</Divider>
          <Space size="middle" style={{ width: '100%' }}>
            <Form.Item label="Serie Factura" name="SaleDocSerie" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
            <Form.Item label="Número Factura" name="SaleDocNo" style={{ flex: 1 }}>
              <Input />
            </Form.Item>
          </Space>

          <Form.Item label="Comentarios" name="Comments">
            <Input.TextArea rows={2} disabled />
          </Form.Item>

          <Space wrap>
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
            {(cabecera.error_mensaje || cabecera.Status === 'error') && (
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
          <Button key="copy" icon={<CopyOutlined />} onClick={() => copyToClipboard(errorMessage)}>
            Copiar Error
          </Button>,
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
