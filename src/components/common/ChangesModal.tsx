import { Modal, Table, Typography, Empty, Spin, Button, Space, Popconfirm } from 'antd';
import { HistoryOutlined, CheckCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRecordHistory, useAuditoriaDetalle } from '../../hooks/useAuditoria';
import { useState, useEffect } from 'react';

const { Text, Title } = Typography;

interface ChangesModalProps {
  open: boolean;
  onClose: () => void;
  tabla: string;
  registroId: string;
  onApprove?: () => void;
  onReject?: () => void;
  showApprove?: boolean;
}

export default function ChangesModal({ open, onClose, tabla, registroId, onApprove, onReject, showApprove }: ChangesModalProps) {
  const { data, isLoading } = useRecordHistory(tabla, registroId);
  const [selectedAuditId, setSelectedAuditId] = useState<number | null>(null);
  const { data: detail, isLoading: isLoadingDetail } = useAuditoriaDetalle(selectedAuditId || 0);

  const history = data?.registros || [];
  const updateHistory = history.filter(h => h.accion === 'UPDATE');

  // Auto-seleccionar la última versión (la primera del historial ordenado por fecha desc)
  useEffect(() => {
    if (updateHistory.length > 0 && !selectedAuditId) {
      setSelectedAuditId(updateHistory[0].id);
    }
  }, [updateHistory, selectedAuditId]);

  // Función para comparar objetos y extraer diferencias de forma recursiva
  const getDiff = (oldData: any, newData: any) => {
    if (!oldData || !newData) return [];
    
    const diff: any[] = [];
    const compare = (oldObj: any, newObj: any, prefix = '') => {
      if (!oldObj && !newObj) return;
      const allKeys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));
      
      for (const key of allKeys) {
        const valOld = oldObj?.[key];
        const valNew = newObj?.[key];
        const path = prefix ? `${prefix} > ${key}` : key;
        
        if (['necesita_aprobacion', 'aprobacion_usuario', 'fecha_aprobacion', 'XLastUser', 'XLastDate', 'XlastUser', 'XlastDate', 'key'].includes(key)) continue;

        if (Array.isArray(valOld) || Array.isArray(valNew)) {
          if (JSON.stringify(valOld) !== JSON.stringify(valNew)) {
            diff.push({
              campo: path,
              anterior: Array.isArray(valOld) ? `${valOld.length} items` : String(valOld || '-'),
              nuevo: Array.isArray(valNew) ? `${valNew.length} items` : String(valNew || '-'),
            });
          }
        } else if (typeof valOld === 'object' && valOld !== null && typeof valNew === 'object' && valNew !== null) {
          compare(valOld, valNew, path);
        } else if (String(valOld) !== String(valNew)) {
          diff.push({ campo: path, anterior: valOld, nuevo: valNew });
        }
      }
    };
    compare(oldData, newData);
    return diff;
  };

  const diffData = detail ? getDiff(detail.datos_anteriores, detail.datos_nuevos) : [];

  return (
    <Modal
      title={
        <Space>
          <HistoryOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 600 }}>Cambios Realizados - {registroId}</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={window.innerWidth > 1000 ? 1000 : '98%'}
      style={{ top: 20, maxWidth: '100vw' }}
      footer={[
        <Button key="close" onClick={onClose} size="large">Cerrar</Button>,
        showApprove && (
          <Popconfirm
            key="reject-confirm"
            title="¿Eliminar cambios?"
            description="Se restaurará la versión anterior del documento."
            onConfirm={onReject}
            okText="Sí, eliminar"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger
              icon={<DeleteOutlined />}
              size="large"
            >
              Eliminar cambios
            </Button>
          </Popconfirm>
        ),
        showApprove && (
          <Button 
            key="approve" 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={onApprove}
            size="large"
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Aprobar cambios
          </Button>
        )
      ]}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {updateHistory.length > 0 && (
          <div style={{ backgroundColor: '#f0f5ff', padding: '12px 16px', borderRadius: 8, border: '1px solid #adc6ff' }}>
            <Text strong>Última edición realizada por: </Text>
            <Text type="secondary">{updateHistory[0].usuario} el {new Date(updateHistory[0].fecha).toLocaleString()}</Text>
          </div>
        )}

        <div style={{ paddingTop: 10 }}>
          <Title level={5} style={{ marginBottom: 16 }}>Diferencias detectadas en la edición</Title>
          {isLoading || isLoadingDetail ? (
            <div style={{ textAlign: 'center', padding: 40 }}><Spin tip="Cargando cambios..." /></div>
          ) : diffData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <Table
                dataSource={diffData}
                pagination={false}
                size="small"
                rowKey="campo"
                bordered
                columns={[
                  { 
                    title: 'Campo Modificado', 
                    dataIndex: 'campo', 
                    key: 'campo', 
                    width: '25%',
                    render: (text) => <Text strong style={{ color: '#001529', fontSize: 12 }}>{text}</Text>
                  },
                  { 
                    title: 'Valor Anterior', 
                    dataIndex: 'anterior', 
                    key: 'anterior',
                    width: '37.5%',
                    render: (val) => (
                      <div style={{ padding: '6px 10px', backgroundColor: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 4 }}>
                        <Text delete type="secondary" style={{ fontSize: 13, wordBreak: 'break-all' }}>{String(val ?? '-')}</Text>
                      </div>
                    )
                  },
                  { 
                    title: 'Valor Nuevo', 
                    dataIndex: 'nuevo', 
                    key: 'nuevo',
                    width: '37.5%',
                    render: (val) => (
                      <div style={{ padding: '6px 10px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                        <Text strong type="success" style={{ fontSize: 13, wordBreak: 'break-all' }}>{String(val ?? '-')}</Text>
                      </div>
                    )
                  }
                ]}
              />
            </div>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', backgroundColor: '#fafafa', borderRadius: 8 }}>
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="No se encontraron cambios pendientes de revisión." 
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
