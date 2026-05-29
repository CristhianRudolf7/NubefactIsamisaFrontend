import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, Alert, Spin, App, Modal, Input } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EditOutlined, FilePdfOutlined, FileTextOutlined, FileZipOutlined, StopOutlined } from '@ant-design/icons';
import { useRetencion, useEnviarRetencion, useAnularRetencion } from '../../hooks/useRetenciones';
import { retencionesService } from '../../services/retencionesService';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { formatExcelDate, formatCurrency } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';

export default function RetencionesDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const { data, isLoading } = useRetencion(Number(id));
  const enviarMutation = useEnviarRetencion();
  const anularMutation = useAnularRetencion();
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Retención no encontrada" type="error" />;
  }

  const { cabecera, detalles, estado_sunat } = documento;

  const canEdit = ['rechazado', 'error'].includes((cabecera.status || '').toLowerCase());
  const canSend = (!cabecera.status || canEdit) && user?.rol !== 'trabajador';
  const canDownload = cabecera.status && !['pendiente', 'error', 'rechazado'].includes((cabecera.status || '').toLowerCase());
  // Mostrar anular solo si está rechazado o pendiente
  const canAnular = ['rechazado', 'pendiente'].includes((cabecera.status || '').toLowerCase());

  const handleDownloadPdf = async () => {
    const result = await retencionesService.descargarPdf(Number(id));
    if (result.success && result.blob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cabecera.Serie || 'retencion'}-${cabecera.Numero || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      message.warning(result.error || 'PDF no disponible');
    }
  };

  const handleDownloadXml = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/retenciones/${id}/xml`, '_blank');
  };

  const handleDownloadCdr = () => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/retenciones/${id}/cdr`, '_blank');
  };

  const handleEnviar = async () => {
    try {
      const result = await enviarMutation.mutateAsync({
        retencionId: cabecera.Id,
        usuario,
      });
      if (result.success) {
        message.success('Retención enviada correctamente');
        navigate('/retenciones');
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error al enviar retención');
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      message.error('Ingrese el motivo de anulación');
      return;
    }
    try {
      const result = await anularMutation.mutateAsync({
        retencionId: cabecera.Id,
        motivo: motivoAnulacion,
        usuario,
      });
      if (result.success) {
        message.success('Anulación procesada correctamente');
        setShowAnularModal(false);
        setMotivoAnulacion('');
        navigate('/retenciones');
      } else {
        message.error(result.message || 'Error al anular');
      }
    } catch {
      message.error('Error al anular retención');
    }
  };

  const detalleColumns = [
    { title: 'Serie Doc.', dataIndex: 'DRserie', key: 'DRserie' },
    { title: 'Nº Doc.', dataIndex: 'DRnumero', key: 'DRnumero' },
    { title: 'Fecha', dataIndex: 'DRfecha', key: 'DRfecha', render: (v: number) => formatExcelDate(v) },
    { title: 'Total', dataIndex: 'DRtotal', key: 'DRtotal', render: (v: number) => formatCurrency(v) },
    { title: 'Retenido', dataIndex: 'Retenido', key: 'Retenido', render: (v: number) => formatCurrency(v) },
    { title: 'Pagado', dataIndex: 'Pagado', key: 'Pagado', render: (v: number) => formatCurrency(v) },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/retenciones')}>
          Volver
        </Button>
        {canSend && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleEnviar} loading={enviarMutation.isPending}>
            Enviar a NubeFact
          </Button>
        )}
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/retenciones/${id}/editar`)}>
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

      <Card title="Información de Retención">
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Serie-Número">{cabecera.Serie}-{cabecera.Numero}</Descriptions.Item>
          <Descriptions.Item label="Fecha">{formatExcelDate(cabecera.DocumentDate)}</Descriptions.Item>
          <Descriptions.Item label="Tasa">{cabecera.Tasa}%</Descriptions.Item>
          <Descriptions.Item label="RUC Proveedor">{cabecera.VendorRuc}</Descriptions.Item>
          <Descriptions.Item label="Proveedor">{cabecera.VendorName}</Descriptions.Item>
          <Descriptions.Item label="Dirección">{cabecera.VendorAddress}</Descriptions.Item>
          <Descriptions.Item label="Total Retenido">{formatCurrency(cabecera.TotalRetenido)}</Descriptions.Item>
          <Descriptions.Item label="Total Pagado">{formatCurrency(cabecera.TotalPagado)}</Descriptions.Item>
          <Descriptions.Item label="Estado"><StatusBadge estado={cabecera.status} /></Descriptions.Item>
          {cabecera.Obs && <Descriptions.Item label="Observaciones">{cabecera.Obs}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="Documentos Relacionados" style={{ marginTop: 16 }}>
        <Table
          dataSource={detalles}
          columns={detalleColumns}
          rowKey="ID"
          pagination={false}
          size="small"
        />
      </Card>

      {estado_sunat && (
        <Card title="Estado SUNAT" style={{ marginTop: 16 }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Estado">{estado_sunat.Status}</Descriptions.Item>
            {estado_sunat.Descripcion && (
              <Descriptions.Item label="Descripción">{estado_sunat.Descripcion}</Descriptions.Item>
            )}
            {estado_sunat.Pdf && (
              <Descriptions.Item label="PDF">
                <a href={estado_sunat.Pdf} target="_blank" rel="noopener noreferrer">Descargar</a>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>
      )}

      {/* Modal de anulación */}
      <Modal
        title="Anular Retención"
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
        <p>¿Está seguro que desea anular la retención <strong>{cabecera.Serie}-{cabecera.Numero}</strong>?</p>
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
