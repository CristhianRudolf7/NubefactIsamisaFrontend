import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { 
  Typography, 
  Card, 
  Tabs, 
  Switch, 
  Form, 
  InputNumber, 
  Button, 
  Space, 
  DatePicker, 
  Table, 
  Tag, 
  App,
  Divider,
  Row,
  Col,
  Empty
} from 'antd';
import { 
  SettingOutlined, 
  RocketOutlined, 
  HistoryOutlined, 
  SearchOutlined,
  SendOutlined 
} from '@ant-design/icons';
import { useConfig } from '../../hooks/useConfig';
import { useVentas } from '../../hooks/useVentas';
import { useGuias } from '../../hooks/useGuias';
import { useRetenciones } from '../../hooks/useRetenciones';
import { ventasService } from '../../services/ventasService';
import { guiasService } from '../../services/guiasService';
import { retencionesService } from '../../services/retencionesService';
import { formatSerieNumero, formatExcelDate } from '../../utils/formatters';
import { useAppContext } from '../../contexts/AppContext';

const { Title, Text, Paragraph } = Typography;

const DocumentConfigPanel = ({ 
  tipo, 
  config, 
  onUpdate 
}: { 
  tipo: string; 
  config: any; 
  onUpdate: (datos: any) => Promise<void> 
}) => {
  const { message } = App.useApp();
  const { usuario } = useAppContext();
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch pending docs based on type
  const { data: ventas } = useVentas({ estado: 'pendiente', page: 1, page_size: 100 });
  const { data: guias } = useGuias({ estado: 'pendiente', page: 1, page_size: 100 });
  const { data: retenciones } = useRetenciones({ estado: 'pendiente', page: 1, page_size: 100 });

  const getPendingDocs = () => {
    if (tipo === 'ventas') return ventas?.data?.items || [];
    if (tipo === 'guias') return guias?.data?.items || [];
    if (tipo === 'retenciones') return retenciones?.data?.items || [];
    return [];
  };

  const filteredDocs = useMemo(() => {
    const docs = getPendingDocs();
    if (!startDate || !endDate) return docs;
    
    // Base para coincidir con el desfase de la BD (1899-12-31)
    const baseDate = dayjs('1899-12-31');
    
    const startExcel = startDate.diff(baseDate, 'day', true);
    const endExcel = endDate.diff(baseDate, 'day', true);

    return docs.filter((d: any) => {
        const excelVal = tipo === 'guias' ? d.FechaTraslado : d.DocumentDate;
        if (!excelVal) return false;
        return excelVal >= startExcel && excelVal <= endExcel;
    });
  }, [ventas, guias, retenciones, startDate, endDate, tipo]);

  const handleBulkSend = async () => {
    if (filteredDocs.length === 0) {
      message.warning('No hay documentos para enviar');
      return;
    }

    setLoading(true);
    try {
      const ids = filteredDocs.map((d: any) => {
        const id = tipo === 'ventas' ? d.Document : (tipo === 'guias' ? d.Transaction : d.Id);
        return String(id);
      });
      let service: any;
      if (tipo === 'ventas') service = ventasService;
      else if (tipo === 'guias') service = guiasService;
      else service = retencionesService;

      const result = await service.enviarMasivo(ids, usuario);
      if (result.success) {
        message.success(result.message);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      message.error('Error al iniciar el envío masivo');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      title: 'Documento', 
      key: 'doc', 
      render: (record: any) => tipo === 'ventas' ? formatSerieNumero(record.DocumentSerie, record.DocumentNo) : (tipo === 'guias' ? formatSerieNumero(record.DocumentSerie, record.DocumentNo) : formatSerieNumero(record.Serie, record.Numero))
    },
    { 
      title: 'Cliente/Proveedor', 
      key: 'entity', 
      render: (record: any) => record.VendorName || record.TargetPersonName || '-' 
    },
    { 
      title: 'Fecha', 
      key: 'date', 
      render: (record: any) => formatExcelDate(tipo === 'guias' ? record.FechaTraslado : record.DocumentDate) 
    },
    { 
      title: 'Estado', 
      dataIndex: 'fe', 
      key: 'status',
      render: (fe: string) => <Tag color="orange">{fe || 'PENDIENTE'}</Tag>
    }
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={10}>
          <Card title={<Space><SettingOutlined /> Configuración de Envío</Space>} className="shadow-sm">
            <Form layout="vertical">
              <Form.Item label="Modo de Envío" extra="Define si los documentos se envían automáticamente al detectarse o si prefieres enviarlos por lotes manualmente.">
                <Tabs 
                  activeKey={config?.modo || 'manual'}
                  onChange={(val) => onUpdate({ modo: val })}
                  items={[
                    { key: 'manual', label: 'Manual (Lotes)', icon: <HistoryOutlined /> },
                    { key: 'automatico', label: 'Automático', icon: <RocketOutlined /> }
                  ]}
                />
              </Form.Item>

              {config?.modo === 'automatico' && (
                <Form.Item>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>Activar procesador automático</Text>
                      <Switch 
                        checked={config?.activo} 
                        onChange={(val) => onUpdate({ activo: val })} 
                      />
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>Intervalo de revisión (minutos)</Text>
                      <InputNumber 
                        min={1} 
                        max={60} 
                        value={Math.floor((config?.intervalo_segundos || 600) / 60)} 
                        onChange={(val) => onUpdate({ intervalo_segundos: (val || 1) * 60 })}
                      />
                    </div>
                  </Space>
                </Form.Item>
              )}
            </Form>
          </Card>
        </Col>

        <Col xs={24} md={14}>
          <Card 
            title={<Space><SearchOutlined /> Envío Manual / Masivo</Space>}
            className="shadow-sm"
            extra={
              <Button 
                type="primary" 
                icon={<SendOutlined />} 
                loading={loading}
                disabled={loading || config?.modo === 'automatico' || filteredDocs.length === 0}
                onClick={handleBulkSend}
              >
                {loading ? 'Iniciando envío...' : `Enviar ${filteredDocs.length} seleccionados`}
              </Button>
            }
          >
            {config?.modo === 'automatico' ? (
              <Empty 
                description="El modo automático está activo. El sistema procesará los documentos sin intervención manual." 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <div>
                  <Text strong>Filtrar por rango de fechas:</Text>
                    <div style={{ marginTop: 8 }}>
                      <Row gutter={8}>
                        <Col span={12}>
                          <DatePicker 
                            showTime={{ format: 'HH:mm' }}
                            format="DD/MM/YYYY HH:mm"
                            placeholder="Desde (Fecha y Hora)"
                            style={{ width: '100%' }} 
                            onChange={(val) => setStartDate(val)}
                          />
                        </Col>
                        <Col span={12}>
                          <DatePicker 
                            showTime={{ format: 'HH:mm' }}
                            format="DD/MM/YYYY HH:mm"
                            placeholder="Hasta (Fecha y Hora)"
                            style={{ width: '100%' }} 
                            onChange={(val) => setEndDate(val)}
                          />
                        </Col>
                      </Row>
                    </div>
                </div>
                
                <Table 
                  size="small"
                  dataSource={filteredDocs} 
                  columns={columns} 
                  rowKey={(record: any) => record.Document || record.Transaction || record.Id}
                  pagination={{ pageSize: 5 }}
                />
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default function Configuracion() {
  const { configs, updateConfig } = useConfig();

  const handleUpdate = async (tipo: string, datos: any) => {
    try {
      await updateConfig({ tipo, datos });
    } catch (error) {
      console.error('Error al actualizar config', error);
    }
  };

  const items = [
    { 
      key: 'ventas', 
      label: 'Ventas (Facturas/Boletas)', 
      children: <DocumentConfigPanel tipo="ventas" config={configs.find(c => c.tipo_documento === 'ventas')} onUpdate={(datos) => handleUpdate('ventas', datos)} /> 
    },
    { 
      key: 'guias', 
      label: 'Guías de Remisión', 
      children: <DocumentConfigPanel tipo="guias" config={configs.find(c => c.tipo_documento === 'guias')} onUpdate={(datos) => handleUpdate('guias', datos)} /> 
    },
    { 
      key: 'retenciones', 
      label: 'Retenciones', 
      children: <DocumentConfigPanel tipo="retenciones" config={configs.find(c => c.tipo_documento === 'retenciones')} onUpdate={(datos) => handleUpdate('retenciones', datos)} /> 
    },
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Configuración de Procesos de Envío</Title>
        <Paragraph type="secondary">
          Gestiona cómo se envían los documentos electrónicos a SUNAT/NubeFact. Puedes automatizar el proceso para cada tipo de documento o gestionarlo manualmente por lotes.
        </Paragraph>
      </div>

      <Card className="shadow-sm">
        <Tabs 
          defaultActiveKey="ventas" 
          items={items} 
          tabPosition="top"
          size="large"
        />
      </Card>
    </div>
  );
}
