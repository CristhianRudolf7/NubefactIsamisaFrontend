import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, Spin, Alert, InputNumber, App, Table, Divider, Modal, Select } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, PlusOutlined, DeleteOutlined, ExclamationCircleOutlined, CopyOutlined } from '@ant-design/icons';
import { useVenta, useActualizarVenta, useEnviarVenta } from '../../hooks/useVentas';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

interface ItemDetalle {
  Line: number;
  ItemCode: string;
  Description: string;
  Unit: string;
  Quantity: number;
  Price: number;
  PriceTax: number;
  SubTotal: number;
  TotalTaxLo: number;
  Total: number;
}

export default function VentasEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [items, setItems] = useState<ItemDetalle[]>([]);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Error copiado al portapapeles');
  };

  const { data, isLoading, refetch } = useVenta(id!);
  const actualizarMutation = useActualizarVenta();
  const enviarMutation = useEnviarVenta();

  const documento = data?.data;

  useEffect(() => {
    if (documento?.detalles) {
      setItems(documento.detalles.map((d: ItemDetalle) => ({
        Line: d.Line,
        ItemCode: d.ItemCode || '',
        Description: d.Description || '',
        Unit: d.Unit || 'NIU',
        Quantity: d.Quantity || 0,
        Price: d.Price || 0,
        PriceTax: d.PriceTax || 0,
        SubTotal: d.SubTotal || 0,
        TotalTaxLo: d.TotalTaxLo || 0,
        Total: d.Total || 0,
      })));
    }
  }, [documento]);

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Documento no encontrado" type="error" />;
  }

  const { cabecera } = documento;

  const calcularTotales = (items: ItemDetalle[]) => {
    const totalNeto = items.reduce((sum, item) => sum + (item.SubTotal || 0), 0);
    const totalIGV = items.reduce((sum, item) => sum + (item.TotalTaxLo || 0), 0);
    const total = items.reduce((sum, item) => sum + (item.Total || 0), 0);
    return { totalNeto, totalIGV, total };
  };

  const handleAddItem = () => {
    const newLine = items.length > 0 ? Math.max(...items.map(i => i.Line)) + 1 : 1;
    setItems([...items, {
      Line: newLine,
      ItemCode: '',
      Description: '',
      Unit: 'NIU',
      Quantity: 1,
      Price: 0,
      PriceTax: 0,
      SubTotal: 0,
      TotalTaxLo: 0,
      Total: 0,
    }]);
  };

  const handleRemoveItem = (line: number) => {
    setItems(items.filter(i => i.Line !== line));
  };

  const handleItemChange = (line: number, field: string, value: number | string) => {
    setItems(items.map(item => {
      if (item.Line === line) {
        const updated = { ...item, [field]: value };
        // Recalcular si cambia cantidad o precio
        if (field === 'Quantity' || field === 'Price') {
          const qty = field === 'Quantity' ? (value as number) : item.Quantity;
          const price = field === 'Price' ? (value as number) : item.Price;
          updated.SubTotal = qty * price;
          updated.TotalTaxLo = updated.SubTotal * 0.18;
          updated.Total = updated.SubTotal + updated.TotalTaxLo;
          updated.PriceTax = price * 1.18;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSave = async (values: Record<string, unknown>) => {
    try {
      const { totalNeto, totalIGV, total } = calcularTotales(items);
      const result = await actualizarMutation.mutateAsync({
        documentId: cabecera.Document,
        datos: {
          ...values,
          AmountNetLo: totalNeto,
          AmountTaxLo: totalIGV,
          AmountTotalLo: total,
          detalles: items,
        },
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
      const { totalNeto, totalIGV, total } = calcularTotales(items);
      await actualizarMutation.mutateAsync({
        documentId: cabecera.Document,
        datos: {
          ...values,
          AmountNetLo: totalNeto,
          AmountTaxLo: totalIGV,
          AmountTotalLo: total,
          detalles: items,
        },
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

  const columns = [
    {
      title: 'Línea',
      dataIndex: 'Line',
      key: 'Line',
      width: 60,
    },
    {
      title: 'Código',
      dataIndex: 'ItemCode',
      key: 'ItemCode',
      width: 100,
      render: (value: string) => value,
    },
    {
      title: 'Descripción',
      dataIndex: 'Description',
      key: 'Description',
      render: (value: string) => value,
    },
    {
      title: 'Unidad',
      dataIndex: 'Unit',
      key: 'Unit',
      width: 80,
      render: (value: string) => value,
    },
    {
      title: 'Cantidad',
      dataIndex: 'Quantity',
      key: 'Quantity',
      width: 100,
      render: (value: number) => value,
    },
    {
      title: 'Precio Unit.',
      dataIndex: 'Price',
      key: 'Price',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'SubTotal',
      dataIndex: 'SubTotal',
      key: 'SubTotal',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'IGV',
      dataIndex: 'TotalTaxLo',
      key: 'TotalTaxLo',
      width: 80,
      render: (value: number) => value.toFixed(2),
    },
    {
      title: 'Total',
      dataIndex: 'Total',
      key: 'Total',
      width: 100,
      render: (value: number) => value.toFixed(2),
    },
  ];

  const { totalNeto, totalIGV, total } = calcularTotales(items);

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ventas')}>
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
            CondicionPago: cabecera.CondicionPago || 'CONTADO',
          }}
          onFinish={handleSave}
        >
          <Form.Item label="RUC/DNI Cliente" name="VendorRUC">
            <Input />
          </Form.Item>
          <Form.Item label="Nombre Cliente" name="VendorName">
            <Input />
          </Form.Item>
          <Form.Item label="Dirección" name="VendorAddress">
            <Input />
          </Form.Item>
          <Form.Item label="Tipo de Pago" name="CondicionPago">
            <Select>
              <Select.Option value="CONTADO">CONTADO</Select.Option>
              <Select.Option value="CREDITO">CRÉDITO</Select.Option>
            </Select>
          </Form.Item>

          <Divider>Items del Documento</Divider>



          <Table
            dataSource={items}
            columns={columns}
            rowKey="Line"
            pagination={false}
            size="small"
            scroll={{ x: 1000 }}
          />

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space orientation="vertical" align="end">
              <div><strong>Total Neto:</strong> {totalNeto.toFixed(2)}</div>
              <div><strong>IGV (18%):</strong> {totalIGV.toFixed(2)}</div>
              <div style={{ fontSize: 18 }}><strong>Total:</strong> {total.toFixed(2)}</div>
            </Space>
          </div>

          <Divider />

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
                onClick={() => {
                  form.validateFields().then((values) => handleSaveAndSend(values));
                }}
                loading={enviarMutation.isPending}
              >
                Guardar y Enviar
              </Button>
            )}
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
