import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Table, Button, Space, Alert, Spin } from 'antd';
import { ArrowLeftOutlined, SendOutlined, EditOutlined } from '@ant-design/icons';
import { useGuia, useEnviarGuia } from '../../hooks/useGuias';
import { useAppContext } from '../../contexts/AppContext';
import { formatExcelDate } from '../../utils/formatters';
import StatusBadge from '../../components/common/StatusBadge';
import { message } from 'antd';

export default function GuiasDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { data, isLoading } = useGuia(id!);
  const enviarMutation = useEnviarGuia();

  const documento = data?.data;

  if (isLoading) {
    return <Spin fullscreen />;
  }

  if (!documento) {
    return <Alert message="Guía no encontrada" type="error" />;
  }

  const { cabecera, detalles } = documento;

  const canEdit = ['rechazado', 'error'].includes((cabecera.envio_nube || '').toLowerCase());
  const canSend = !cabecera.envio_nube || canEdit;

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
    </div>
  );
}
