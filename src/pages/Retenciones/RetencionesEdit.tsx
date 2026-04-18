import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, App, DatePicker, Modal, Table, Divider, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRetencion, useActualizarRetencion, useEnviarRetencion } from '../../hooks/useRetenciones';
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

export default function RetencionesEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
            <Input />
          </Form.Item>
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
                render: (value: string, record: RetencionDetalle) => (
                  <Input 
                    value={value} 
                    onChange={(e) => handleItemChange(record.ID, 'DRserie', e.target.value)}
                  />
                ),
              },
              {
                title: 'Doc. Número',
                dataIndex: 'DRnumero',
                key: 'DRnumero',
                width: 100,
                render: (value: string, record: RetencionDetalle) => (
                  <Input 
                    value={value} 
                    onChange={(e) => handleItemChange(record.ID, 'DRnumero', e.target.value)}
                  />
                ),
              },
              {
                title: 'Doc. Fecha',
                dataIndex: 'DRfecha',
                key: 'DRfecha',
                width: 130,
                render: (value: number | undefined, record: RetencionDetalle) => (
                  <DatePicker 
                    value={excelToDayjs(value)} 
                    onChange={(date) => handleItemChange(record.ID, 'DRfecha', dayjsToExcel(date))}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: 'Moneda',
                dataIndex: 'DRmoneda',
                key: 'DRmoneda',
                width: 80,
                render: (value: string, record: RetencionDetalle) => (
                  <Select 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'DRmoneda', v)}
                    style={{ width: '100%' }}
                  >
                    <Select.Option value="PEN">PEN</Select.Option>
                    <Select.Option value="USD">USD</Select.Option>
                  </Select>
                ),
              },
              {
                title: 'Total Doc.',
                dataIndex: 'DRtotal',
                key: 'DRtotal',
                width: 100,
                render: (value: number, record: RetencionDetalle) => (
                  <InputNumber 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'DRtotal', v ?? 0)}
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: 'Fecha Pago',
                dataIndex: 'DRpagoFecha',
                key: 'DRpagoFecha',
                width: 130,
                render: (value: number | undefined, record: RetencionDetalle) => (
                  <DatePicker 
                    value={excelToDayjs(value)} 
                    onChange={(date) => handleItemChange(record.ID, 'DRpagoFecha', dayjsToExcel(date))}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                  />
                ),
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
                render: (value: number, record: RetencionDetalle) => (
                  <InputNumber 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'DRpagoTotal', v ?? 0)}
                    style={{ width: '100%' }}
                  />
                ),
              },
              {
                title: 'T.C.',
                dataIndex: 'TipoCambio',
                key: 'TipoCambio',
                width: 80,
                render: (value: number, record: RetencionDetalle) => (
                  <InputNumber 
                    value={value} 
                    onChange={(v) => handleItemChange(record.ID, 'TipoCambio', v ?? 0)}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.001}
                  />
                ),
              },
              {
                title: 'Fecha T.C.',
                dataIndex: 'TipoCambioFecha',
                key: 'TipoCambioFecha',
                width: 130,
                render: (value: number | undefined, record: RetencionDetalle) => (
                  <DatePicker 
                    value={excelToDayjs(value)} 
                    onChange={(date) => handleItemChange(record.ID, 'TipoCambioFecha', dayjsToExcel(date))}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                  />
                ),
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
                render: (value: number | undefined, record: RetencionDetalle) => (
                  <DatePicker 
                    value={excelToDayjs(value)} 
                    onChange={(date) => handleItemChange(record.ID, 'RetenidoFecha', dayjsToExcel(date))}
                    format="DD-MM-YYYY"
                    style={{ width: '100%' }}
                  />
                ),
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
