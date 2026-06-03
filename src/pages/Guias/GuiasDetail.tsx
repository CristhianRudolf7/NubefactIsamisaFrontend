import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, Alert, Spin, App, Modal, Input } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EditOutlined, FilePdfOutlined, FileTextOutlined, FileZipOutlined, StopOutlined } from '@ant-design/icons';
import { useGuia, useEnviarGuia, useAnularGuia } from '../../hooks/useGuias';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';
import { formatExcelDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { guiasService } from '../../services/guiasService';

export default function GuiasDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const { data, isLoading } = useGuia(id!);
  const enviarMutation = useEnviarGuia();
  const anularMutation = useAnularGuia();
  const [showAnularModal, setShowAnularModal] = useState(false);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Guía no encontrada" type="error" />;
  }

  const { cabecera, detalles } = documento;

  const canEdit = ['rechazado', 'error'].includes((cabecera.envio_nube || '').toLowerCase());
  const canSend = (!cabecera.envio_nube || canEdit) && user?.rol !== 'trabajador';
  const canDownload = cabecera.envio_nube && !['pendiente', 'error', 'rechazado'].includes((cabecera.envio_nube || '').toLowerCase());
  // Mostrar anular solo si está rechazado o pendiente
  const canAnular = ['rechazado', 'pendiente'].includes((cabecera.envio_nube || '').toLowerCase());

  const handleDownloadPdf = async () => {
    const result = await guiasService.descargarPdf(id!);
    
    if (result.success && result.blob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${cabecera.DocumentSerie}-${cabecera.DocumentNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      message.warning(result.error || 'PDF no disponible');
    }
  };

  const handleDownloadXml = () => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    window.open(`${baseUrl}/guias/${id}/xml`, '_blank');
  };

  const handleDownloadCdr = () => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    window.open(`${baseUrl}/guias/${id}/cdr`, '_blank');
  };

  const handleEnviar = async () => {
    try {
      const result = await enviarMutation.mutateAsync({
        transactionId: cabecera.Transaction,
        usuario,
      });
      if (result.success) {
        message.success('Guía enviada correctamente');
        navigate('/guias');
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error al enviar guía');
    }
  };

  const handleAnular = async () => {
    if (!motivoAnulacion.trim()) {
      message.error('Ingrese el motivo de anulación');
      return;
    }
    try {
      const result = await anularMutation.mutateAsync({
        transactionId: cabecera.Transaction,
        motivo: motivoAnulacion,
        usuario,
      });
      if (result.success) {
        message.success('Anulación procesada correctamente');
        setShowAnularModal(false);
        setMotivoAnulacion('');
        navigate('/guias');
      } else {
        message.error(result.message || 'Error al anular');
      }
    } catch {
      message.error('Error al anular guía');
    }
  };

  const detalleColumns = [
    { title: 'Línea', dataIndex: 'Line', key: 'Line', width: 60 },
    { title: 'Código', dataIndex: 'ItemCode', key: 'ItemCode', width: 100 },
    { title: 'Descripción', dataIndex: 'ItemDescription', key: 'ItemDescription' },
    { title: 'Cantidad', dataIndex: 'Quantity', key: 'Quantity', width: 80 },
    { title: 'Unidad', dataIndex: 'Unit', key: 'Unit', width: 60 },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/guias')}>
          Volver
        </Button>
        {canSend && (
          <Button type="primary" icon={<SendOutlined />} onClick={handleEnviar} loading={enviarMutation.isPending}>
            Enviar a NubeFact
          </Button>
        )}
        {canEdit && (
          <Button icon={<EditOutlined />} onClick={() => navigate(`/guias/${id}/editar`)}>
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

      <Card title="Información de Guía de Remisión">
        <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Serie-Número">{cabecera.DocumentSerie}-{cabecera.DocumentNo}</Descriptions.Item>
          <Descriptions.Item label="Fecha Traslado">{formatExcelDate(cabecera.TransactionDate)}</Descriptions.Item>
          <Descriptions.Item label="Motivo">{cabecera.MotivoTraslado}</Descriptions.Item>
          <Descriptions.Item label="RUC Destinatario">{cabecera.TargetPersonRUC}</Descriptions.Item>
          <Descriptions.Item label="Destinatario">{cabecera.TargetPersonName}</Descriptions.Item>
          <Descriptions.Item label="Dirección Destino">{cabecera.TargetAddress}</Descriptions.Item>
          <Descriptions.Item label="Peso Bruto">{cabecera.PesoBruto} kg</Descriptions.Item>
          <Descriptions.Item label="RUC Transportista">{cabecera.RucTransportista}</Descriptions.Item>
          <Descriptions.Item label="Transportista">{cabecera.Transportista}</Descriptions.Item>
          <Descriptions.Item label="Vehículo">{cabecera.VehicleID}</Descriptions.Item>
          <Descriptions.Item label="Conductor">{cabecera.Driver}</Descriptions.Item>
          <Descriptions.Item label="Licencia">{cabecera.LicenciaConducir}</Descriptions.Item>
          <Descriptions.Item label="Origen">{cabecera.origenaddress}</Descriptions.Item>
          <Descriptions.Item label="Ubigeo Destino">{cabecera.ubigeo_des}</Descriptions.Item>
          <Descriptions.Item label="Estado"><StatusBadge estado={cabecera.envio_nube} /></Descriptions.Item>
          {cabecera.Comments && <Descriptions.Item label="Comentarios">{cabecera.Comments}</Descriptions.Item>}
        </Descriptions>
      </Card>

      <Card title="Items de la Guía" style={{ marginTop: 16 }}>
        <Table
          dataSource={detalles}
          columns={detalleColumns}
          rowKey="Line"
          pagination={false}
          size="small"
        />
      </Card>

      {/* Modal de anulación */}
      <Modal
        title="Anular Guía"
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
        <p>¿Está seguro que desea anular la guía <strong>{cabecera.DocumentSerie}-{cabecera.DocumentNo}</strong>?</p>
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
