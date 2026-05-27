import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, App, DatePicker, Modal, Table, Divider, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRetencion, useActualizarRetencion, useEnviarRetencion } from '../../hooks/useRetenciones';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

interface RetencionDetalle {
  ID: number;
  DRserie: string;
  DRnumero: string;
  DRfecha?: number;
  DRmoneda: string;
  DRtotal: number;
  DRpagoFecha?: number;
  DRpagoNro: string;
  DRpagoTotal: number;
  TipoCambio: number;
  TipoCambioFecha?: number;
  Retenido: number;
  RetenidoFecha?: number;
  Pagado: number;
}

const parseToDayjs = (value: number | string | undefined | null) => {
  if (!value) return null;
  if (typeof value === 'number') {
    return dayjs('1899-12-30').add(value, 'day');
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
};

export default function RetencionesEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const { data, isLoading, refetch } = useRetencion(Number(id));
  const actualizarMutation = useActualizarRetencion();
  const enviarMutation = useEnviarRetencion();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [items, setItems] = useState<RetencionDetalle[]>([]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Error copiado al portapapeles');
  };

  const documento = data?.data;

  // Cargar detalles cuando se obtiene el documento
  useEffect(() => {
    if (documento?.detalles) {
      setItems(documento.detalles.map(d => ({
        ID: d.ID,
        DRserie: d.DRserie || '',
        DRnumero: d.DRnumero || '',
        DRfecha: d.DRfecha,
        DRmoneda: d.DRmoneda || 'PEN',
        DRtotal: d.DRtotal || 0,
        DRpagoFecha: d.DRpagoFecha,
        DRpagoNro: d.DRpagoNro || '',
        DRpagoTotal: d.DRpagoTotal || 0,
        TipoCambio: d.TipoCambio || 0,
        TipoCambioFecha: d.TipoCambioFecha,
        Retenido: d.Retenido || 0,
        RetenidoFecha: d.RetenidoFecha,
        Pagado: d.Pagado || 0,
      })));
    }
  }, [documento]);

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Retención no encontrada" type="error" />;
  }

  const { cabecera } = documento;

  // Convertir fecha a dayjs si existe
  const fechaEmision = parseToDayjs(cabecera.DocumentDate);

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
          detalles: items,
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
          detalles: items,
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

  // Función para convertir fecha de Excel a formato de fecha para DatePicker
  const excelToDayjs = (excelDate: number | undefined) => {
    if (!excelDate) return null;
    return dayjs('1899-12-30').add(excelDate, 'day');
  };

  // Función para convertir fecha de DatePicker a número de Excel
  const dayjsToExcel = (date: dayjs.Dayjs | null) => {
    if (!date) return null;
    return date.diff(dayjs('1899-12-30'), 'day');
  };

  // Actualizar item del detalle
  const handleItemChange = (id: number, field: string, value: number | string | null) => {
    setItems(items.map(item => {
      if (item.ID === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
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
            Serie: cabecera.Serie,
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
          <Form.Item label="Serie" name="Serie">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Fecha de Emisión" name="DocumentDate">
            <DatePicker style={{ width: '100%' }} format="DD-MM-YYYY" disabled />
          </Form.Item>
          <Form.Item label="RUC/DNI Proveedor" name="VendorRuc">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Nombre Proveedor" name="VendorName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Dirección" name="VendorAddress">
            <Input disabled />
          </Form.Item>
          <Form.Item label="Tasa (%)" name="Tasa">
            <InputNumber style={{ width: '100%' }} disabled />
          </Form.Item>
          <Form.Item label="Total Retenido" name="TotalRetenido">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Total Pagado" name="TotalPagado">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Observaciones" name="Obs">
            <Input.TextArea rows={3} disabled />
          </Form.Item>

          <Divider>Detalles de Retención</Divider>
          
          <Table
            dataSource={items}
            rowKey="ID"
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Doc. Serie',
                dataIndex: 'DRserie',
                key: 'DRserie',
                width: 100,
                render: (value: string) => value,
              },
              {
                title: 'Doc. Número',
                dataIndex: 'DRnumero',
                key: 'DRnumero',
                width: 100,
                render: (value: string) => value,
              },
              {
                title: 'Doc. Fecha',
                dataIndex: 'DRfecha',
                key: 'DRfecha',
                width: 130,
                render: (value: number | string | undefined) => parseToDayjs(value)?.format('DD-MM-YYYY') || '',
              },
              {
                title: 'Moneda',
                dataIndex: 'DRmoneda',
                key: 'DRmoneda',
                width: 80,
                render: (value: string) => value,
              },
              {
                title: 'Total Doc.',
                dataIndex: 'DRtotal',
                key: 'DRtotal',
                width: 100,
                render: (value: number) => value.toFixed(2),
              },
              {
                title: 'Fecha Pago',
                dataIndex: 'DRpagoFecha',
                key: 'DRpagoFecha',
                width: 130,
                render: (value: number | string | undefined) => parseToDayjs(value)?.format('DD-MM-YYYY') || '',
              },
              {
                title: 'Nro. Pago',
                dataIndex: 'DRpagoNro',
                key: 'DRpagoNro',
                width: 80,
                render: (value: string, record: RetencionDetalle) => (
                  <Input 
                    value={value} 
                    onChange={(e) => handleItemChange(record.ID, 'DRpagoNro', e.target.value)}
                  />
                ),
              },
              {
                title: 'Pago Sin Ret.',
                dataIndex: 'DRpagoTotal',
                key: 'DRpagoTotal',
                width: 100,
                render: (value: number) => value.toFixed(2),
              },
              {
                title: 'T.C.',
                dataIndex: 'TipoCambio',
                key: 'TipoCambio',
                width: 80,
                render: (value: number) => value.toFixed(3),
              },
              {
                title: 'Fecha T.C.',
                dataIndex: 'TipoCambioFecha',
                key: 'TipoCambioFecha',
                width: 130,
                render: (value: number | string | undefined) => parseToDayjs(value)?.format('DD-MM-YYYY') || '',
              },
              {
                title: 'Retenido',
                dataIndex: 'Retenido',
                key: 'Retenido',
                width: 100,
                render: (value: number, record: RetencionDetalle) => (
                  <InputNumber 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'Retenido', v ?? 0)}
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: 'Fecha Ret.',
                dataIndex: 'RetenidoFecha',
                key: 'RetenidoFecha',
                width: 130,
                render: (value: number | string | undefined) => parseToDayjs(value)?.format('DD-MM-YYYY') || '',
              },
              {
                title: 'Pagado',
                dataIndex: 'Pagado',
                key: 'Pagado',
                width: 100,
                render: (value: number, record: RetencionDetalle) => (
                  <InputNumber 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'Pagado', v ?? 0)}
                    style={{ width: '100%' }}
                  />
                ),
              },
            ]}
            scroll={{ x: 1500 }}
          />

          <Space wrap>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={actualizarMutation.isPending}
            >
              Guardar
            </Button>
            {user?.rol !== 'trabajador' && (
              <Button
                icon={<SendOutlined />}
                onClick={() => form.validateFields().then((values) => handleSaveAndSend(values))}
                loading={enviarMutation.isPending}
              >
                Guardar y Enviar
              </Button>
            )}
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
