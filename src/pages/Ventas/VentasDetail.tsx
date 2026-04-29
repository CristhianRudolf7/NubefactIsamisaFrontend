import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, Alert, Spin, App, Modal, Input } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EditOutlined, FilePdfOutlined, FileTextOutlined, FileZipOutlined, StopOutlined } from '@ant-design/icons';
import { useVenta, useEnviarVenta, useAnularVenta } from '../../hooks/useVentas';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { formatExcelDate, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

export default function VentasDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const { data, isLoading } = useVenta(id!);
  const enviarMutation = useEnviarVenta();
  const anularMutation = useAnularVenta();
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Documento no encontrado" type="error" />;
  }

  const { cabecera, detalles, respuesta_nubefact } = documento;

  const canEdit = ['rechazado', 'error', 'aceptado_observaciones'].includes(
    (cabecera.fe || '').toLowerCase()
  );
  const canSend = (!cabecera.fe || canEdit) && user?.rol !== 'trabajador';
  const canDownload = cabecera.fe && !['pendiente', 'error', 'rechazado'].includes((cabecera.fe || '').toLowerCase());
  // Mostrar anular solo si está rechazado o pendiente
  const canAnular = ['rechazado', 'pendiente'].includes((cabecera.fe || '').toLowerCase());

  const handleDownloadPdf = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${id}/pdf`, '_blank');
  };

  const handleDownloadXml = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${id}/xml`, '_blank');
  };

  const handleDownloadCdr = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${id}/cdr`, '_blank');
  };

  const handleEnviar = async () => {
    try {
      const result = await enviarMutation.mutateAsync({
        documentId: cabecera.Document,
        usuario,
      });
      if (result.success) {
        message.success('Documento enviado correctamente');
        navigate('/ventas');
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error al enviar documento');
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      message.error('Ingrese el motivo de anulación');
      return;
    }
    try {
      const result = await anularMutation.mutateAsync({
        documentId: cabecera.Document,
        motivo: motivoAnulacion,
        usuario,
      });
      if (result.success) {
        message.success('Anulación procesada correctamente');
        setShowAnularModal(false);
        setMotivoAnulacion('');
        navigate('/ventas');
      } else {
        message.error(result.message || 'Error al anular');
      }
    } catch {
      message.error('Error al anular documento');
    }
  };

  const detalleColumns = [
    { title: 'Línea', dataIndex: 'Line', key: 'Line', width: 60 },
    { title: 'Código', dataIndex: 'ItemCode', key: 'ItemCode', width: 100 },
    { title: 'Descripción', dataIndex: 'Description', key: 'Description' },
    { title: 'Cantidad', dataIndex: 'Quantity', key: 'Quantity', width: 80 },
    { title: 'Unidad', dataIndex: 'Unit', key: 'Unit', width: 60 },
    { title: 'Precio', dataIndex: 'Price', key: 'Price', width: 100, render: (v: number) => formatCurrency(v) },
    { title: 'Total', dataIndex: 'Total', key: 'Total', width: 100, render: (v: number) => formatCurrency(v) },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/ventas')}>
          Volver
        </Button>
        {canSend && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleEnviar} loading={enviarMutation.isPending}>
            Enviar a NubeFact
          </Button>
        )}
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/ventas/${id}/editar`)}>
            Editar
          </Button>
        )}
        {canAnular && (
          <Button danger icon={<StopOutlined />} onClick={() => setShowAnularModal(true)}>
            Anular
          </Button>
        )}
        {canDownload && (
          <>
            <Button icon={<FilePdfOutlined />} onClick={handleDownloadPdf}>
              PDF
            </Button>
            <Button icon={<FileTextOutlined />} onClick={handleDownloadXml}>
              XML
            </Button>
            <Button icon={<FileZipOutlined />} onClick={handleDownloadCdr}>
              CDR
            </Button>
          </>
        )}
      </Space>

      <Card title="Información del Documento">
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Tipo">{cabecera.DocumentType}</Descriptions.Item>
          <Descriptions.Item label="Serie-Número">{cabecera.DocumentSerie}-{cabecera.DocumentNo}</Descriptions.Item>
          <Descriptions.Item label="Fecha">{formatExcelDate(cabecera.DocumentDate)}</Descriptions.Item>
          <Descriptions.Item label="RUC">{cabecera.VendorRUC}</Descriptions.Item>
          <Descriptions.Item label="Cliente">{cabecera.VendorName}</Descriptions.Item>
          <Descriptions.Item label="Dirección">{cabecera.VendorAddress}</Descriptions.Item>
          <Descriptions.Item label="Moneda">{cabecera.DocumentCurrency === 'LO' ? 'Soles' : 'Dólares'}</Descriptions.Item>
          <Descriptions.Item label="Monto Neto">{formatCurrency(cabecera.AmountNetLo)}</Descriptions.Item>
          <Descriptions.Item label="IGV">{formatCurrency(cabecera.AmountTaxLo)}</Descriptions.Item>
          <Descriptions.Item label="Total">{formatCurrency(cabecera.AmountTotalLo)}</Descriptions.Item>
          <Descriptions.Item label="Estado"><StatusBadge estado={cabecera.fe} /></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Detalle de Items" style={{ marginTop: 16 }}>
        <Table
          dataSource={detalles}
          columns={detalleColumns}
          rowKey="Line"
          pagination={false}
          size="small"
        />
      </Card>

      {respuesta_nubefact && (
        <Card title="Respuesta de NubeFact" style={{ marginTop: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Aceptada por SUNAT">
              {respuesta_nubefact.aceptada_por_sunat === 'true' ? 'Sí' : 'No'}
            </Descriptions.Item>
            <Descriptions.Item label="Descripción">{respuesta_nubefact.sunat_description}</Descriptions.Item>
            {respuesta_nubefact.sunat_note && (
              <Descriptions.Item label="Nota">{respuesta_nubefact.sunat_note}</Descriptions.Item>
            )}
            {respuesta_nubefact.codigo_hash && (
              <Descriptions.Item label="Hash">{respuesta_nubefact.codigo_hash}</Descriptions.Item>
            )}
            {respuesta_nubefact.enlace && (
              <Descriptions.Item label="Enlace PDF">
                <a href={respuesta_nubefact.enlace} target="_blank" rel="noopener noreferrer">
                  Ver PDF
                </a>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Modal de anulación */}
      <Modal
        title="Anular Documento"
        open={showAnularModal}
        onCancel={() => {
          setShowAnularModal(false);
          setMotivoAnulacion('');
        }}
        onOk={handleAnular}
        confirmLoading={anularMutation.isPending}
        okText="Anular"
        okButtonProps={{ danger: true }}
      >
        <p>¿Está seguro que desea anular el documento <strong>{cabecera.DocumentSerie}-{cabecera.DocumentNo}</strong>?</p>
        <Input.TextArea
          placeholder="Motivo de anulación"
          value={motivoAnulacion}
          onChange={(e) => setMotivoAnulacion(e.target.value)}
          rows={3}
          required
        />
      </Modal>
    </div>
  );
}
