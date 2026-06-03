import { useState, useMemo, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import {
  Typography,
  Card,
  Tabs,
  Switch,
  Form,
  InputNumber,
  Input,
  Button,
  Space,
  DatePicker,
  Table,
  Tag,
  App,
  Divider,
  Row,
  Col,
  Empty,
  Alert,
  Spin
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
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

const { Title, Text, Paragraph } = Typography;

const DocumentConfigPanel = ({
  tipo,
  config,
  onUpdate,
  active
}: {
  tipo: string;
  config: any;
  onUpdate: (datos: any) => Promise<void>;
  active: boolean;
}) => {
  const { message } = App.useApp();
  const { user } = useAuth();
  const { usuario } = useAppContext();
  // Guardar y precargar filtros en localStorage por tipo de documento
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(() => {
    const saved = localStorage.getItem(`bulk_filter_start_date_${tipo}`);
    return saved ? dayjs(saved) : null;
  });
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(() => {
    const saved = localStorage.getItem(`bulk_filter_end_date_${tipo}`);
    return saved ? dayjs(saved) : null;
  });
  const [serie, setSerie] = useState<string>(() => {
    return localStorage.getItem(`bulk_filter_serie_${tipo}`) || '';
  });

  const handleStartDateChange = (val: dayjs.Dayjs | null) => {
    setStartDate(val);
    if (val) {
      localStorage.setItem(`bulk_filter_start_date_${tipo}`, val.toISOString());
    } else {
      localStorage.removeItem(`bulk_filter_start_date_${tipo}`);
    }
  };

  const handleEndDateChange = (val: dayjs.Dayjs | null) => {
    setEndDate(val);
    if (val) {
      localStorage.setItem(`bulk_filter_end_date_${tipo}`, val.toISOString());
    } else {
      localStorage.removeItem(`bulk_filter_end_date_${tipo}`);
    }
  };

  const handleSerieChange = (val: string) => {
    setSerie(val);
    localStorage.setItem(`bulk_filter_serie_${tipo}`, val);
  };

  // Estados de envío masivo persistentes por tipo de documento usando localStorage
  const [isProcessing, setIsProcessing] = useState<boolean>(() => {
    return localStorage.getItem(`bulk_is_processing_${tipo}`) === 'true';
  });
  // pendingCount: cuántos documentos quedan pendientes según el backend (se actualiza en cada poll)
  const [pendingCount, setPendingCount] = useState<number>(() => {
    const saved = localStorage.getItem(`bulk_pending_count_${tipo}`);
    return saved ? Number(saved) : 0;
  });
  const [initialCount, setInitialCount] = useState<number>(() => {
    const saved = localStorage.getItem(`bulk_initial_count_${tipo}`);
    return saved ? Number(saved) : 0;
  });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Reset page when dates or series change
  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, serie]);

  // Fetch pending docs based on type
  const queryParams = useMemo(() => ({
    estado: 'pendiente' as any,
    page,
    page_size: pageSize,
    fecha_inicio: startDate ? startDate.format('DD-MM-YYYY') : undefined,
    fecha_fin: endDate ? endDate.format('DD-MM-YYYY') : undefined,
    serie: serie || undefined
  }), [startDate, endDate, serie, page, pageSize]);

  const { data: ventas, refetch: refetchVentas } = useVentas(queryParams as any, { enabled: active && tipo === 'ventas' });
  const { data: guias, refetch: refetchGuias } = useGuias(queryParams as any, { enabled: active && tipo === 'guias' });
  const { data: retenciones, refetch: refetchRetenciones } = useRetenciones(queryParams as any, { enabled: active && tipo === 'retenciones' });

  const getPendingDocs = useCallback(() => {
    if (tipo === 'ventas') return ventas?.data?.items || [];
    if (tipo === 'guias') return guias?.data?.items || [];
    if (tipo === 'retenciones') return retenciones?.data?.items || [];
    return [];
  }, [tipo, ventas, guias, retenciones]);

  const total = useMemo(() => {
    if (tipo === 'ventas') return ventas?.data?.total || 0;
    if (tipo === 'guias') return guias?.data?.total || 0;
    if (tipo === 'retenciones') return retenciones?.data?.total || 0;
    return 0;
  }, [tipo, ventas, guias, retenciones]);

  // Polling para refrescar la tabla/consulta principal periódicamente mientras se procesa
  useEffect(() => {
    if (!isProcessing) return;

    console.log(`[Bulk Send Polling] Iniciando polling para ${tipo}`);

    const interval = setInterval(() => {
      if (tipo === 'ventas') refetchVentas();
      else if (tipo === 'guias') refetchGuias();
      else refetchRetenciones();
    }, 5000);

    return () => {
      console.log(`[Bulk Send Polling] Deteniendo polling para ${tipo}`);
      clearInterval(interval);
    };
  }, [isProcessing, tipo, refetchVentas, refetchGuias, refetchRetenciones]);

  // Actualizar pendingCount en base al total de la consulta principal
  useEffect(() => {
    if (!isProcessing) return;

    const savedOriginalTotal = Number(localStorage.getItem(`bulk_original_total_${tipo}`) || '0');
    
    // pendingEnviables = total - (totalOriginalConTickets - initialCount)
    const pendingEnviables = Math.max(0, total - (savedOriginalTotal - initialCount));
    
    console.log(`[Bulk Progress Polling] Total actual pendiente en DB: ${total}. Original: ${savedOriginalTotal}. Restantes a enviar: ${pendingEnviables}`);

    setPendingCount(pendingEnviables);
    localStorage.setItem(`bulk_pending_count_${tipo}`, String(pendingEnviables));

    if (pendingEnviables <= 0 && initialCount > 0) {
      setIsProcessing(false);
      setInitialCount(0);
      setPendingCount(0);
      localStorage.setItem(`bulk_is_processing_${tipo}`, 'false');
      localStorage.setItem(`bulk_initial_count_${tipo}`, '0');
      localStorage.setItem(`bulk_pending_count_${tipo}`, '0');
      message.success('Proceso de envío masivo completado');
    }
  }, [total, isProcessing, initialCount, tipo, message]);

  // Timeout de seguridad de 10 minutos para liberar la interfaz
  useEffect(() => {
    if (!isProcessing) return;

    const timeout = setTimeout(() => {
      setIsProcessing(false);
      setPendingCount(0);
      setInitialCount(0);
      localStorage.setItem(`bulk_is_processing_${tipo}`, 'false');
      localStorage.setItem(`bulk_pending_count_${tipo}`, '0');
      localStorage.setItem(`bulk_initial_count_${tipo}`, '0');
      message.warning('El envío masivo está tardando más de lo esperado. El proceso continúa en segundo plano; actualice la página para verificar el estado final.');
    }, 600000); // 10 minutos

    return () => clearTimeout(timeout);
  }, [isProcessing, tipo, message]);

  const filteredDocs = useMemo(() => {
    const docs = getPendingDocs();
    return docs.filter((d: any) => {
      // Ignorar documentos que necesitan aprobación (no deben enviarse masivamente)
      if (d.necesita_aprobacion) return false;
      // Para ventas: no mostrar tickets (series que empiezan con T)
      if (tipo === 'ventas') {
        const serie = d.DocumentSerie || '';
        if (String(serie).toUpperCase().startsWith('T')) return false;
      }
      return true;
    });
  }, [getPendingDocs, tipo]);

  const handleBulkSend = async () => {
    if (total === 0) {
      message.warning('No hay documentos para enviar en este rango');
      return;
    }

    setLoading(true);
    try {
      let service: any;
      if (tipo === 'ventas') service = ventasService;
      else if (tipo === 'guias') service = guiasService;
      else service = retencionesService;

      const fi = startDate ? startDate.format('DD-MM-YYYY') : undefined;
      const ff = endDate ? endDate.format('DD-MM-YYYY') : undefined;
      const sr = serie || undefined;

      const bulkParams = {
        fecha_inicio: fi,
        fecha_fin: ff,
        serie: sr,
        usuario: usuario
      };

      console.log(`[Bulk Send] Iniciando envío masivo para ${tipo}`, bulkParams);
      const result = await service.enviarMasivo(bulkParams);

      if (result.success) {
        const count = result.data?.count ?? 0;
        if (count === 0) {
          message.warning(result.message || 'No hay documentos pendientes para enviar (todos son tickets u otros excluidos)');
          setLoading(false);
          return;
        }

        
        
        // Guardar total original (incluyendo tickets) para calcular correctamente el progreso
        const totalOriginalConTickets = total;
        setPendingCount(count);
        setInitialCount(count);
        setIsProcessing(true);
        localStorage.setItem(`bulk_is_processing_${tipo}`, 'true');
        localStorage.setItem(`bulk_initial_count_${tipo}`, String(count));
        localStorage.setItem(`bulk_pending_count_${tipo}`, String(count));
        localStorage.setItem(`bulk_original_total_${tipo}`, String(totalOriginalConTickets));
        localStorage.setItem(`bulk_fecha_inicio_${tipo}`, fi || '');
        localStorage.setItem(`bulk_fecha_fin_${tipo}`, ff || '');
        localStorage.setItem(`bulk_serie_${tipo}`, sr || '');
        console.log(`[Bulk Send] Envío iniciado. ${count} docs enviables de ${totalOriginalConTickets} totales. Filtros: fecha_inicio=${fi}, fecha_fin=${ff}, serie=${sr}`);
        message.info(result.message + ' - Procesando en segundo plano...');
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
      render: (record: any) => formatExcelDate(tipo === 'guias' ? record.TransactionDate : record.DocumentDate)
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
                  <Space orientation="vertical" style={{ width: '100%' }}>
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
              user?.rol !== 'trabajador' && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  loading={loading || isProcessing}
                  disabled={loading || isProcessing || config?.modo === 'automatico' || total === 0}
                  onClick={handleBulkSend}
                >
                  {isProcessing ? `Procesando... quedan ${pendingCount} de ${initialCount}` : (loading ? 'Iniciando envío...' : `Enviar todos en rango (${total})`)}
                </Button>
              )
            }
          >
            {isProcessing && (
              <Alert
                type="info"
                showIcon
                icon={<Spin size="small" />}
                title="Envío en proceso"
                description={`Enviando documentos a NubeFact. Quedan ${pendingCount} de ${initialCount} por enviar.`}
                style={{ marginBottom: 16 }}
              />
            )}
            {config?.modo === 'automatico' ? (
              <Empty
                description="El modo automático está activo. El sistema procesará los documentos sin intervención manual."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Space orientation="vertical" style={{ width: '100%' }} size="middle">
                <div style={{ marginBottom: 8 }}>
                  <Row gutter={16} align="bottom">
                    <Col xs={24} sm={16}>
                      <Text strong>Filtrar por rango de fechas:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Row gutter={8}>
                          <Col span={12}>
                            <DatePicker
                              format="DD/MM/YYYY"
                              placeholder="Desde"
                              style={{ width: '100%' }}
                              value={startDate}
                              onChange={handleStartDateChange}
                            />
                          </Col>
                          <Col span={12}>
                            <DatePicker
                              format="DD/MM/YYYY"
                              placeholder="Hasta"
                              style={{ width: '100%' }}
                              value={endDate}
                              onChange={handleEndDateChange}
                            />
                          </Col>
                        </Row>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <Text strong>Serie:</Text>
                      <div style={{ marginTop: 8 }}>
                        <Input
                          placeholder="Ej: F001, B037"
                          value={serie}
                          onChange={(e) => handleSerieChange(e.target.value.toUpperCase().trim())}
                          allowClear
                        />
                      </div>
                    </Col>
                  </Row>
                </div>

                <Table
                  size="small"
                  dataSource={filteredDocs}
                  columns={columns}
                  rowKey={(record: any) => record.Document || record.Transaction || record.Id}
                  pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showTotal: (t, range) => `${range[0]}-${range[1]} de ${t} registros`,
                    onChange: (p, ps) => {
                      setPage(p);
                      setPageSize(ps);
                    }
                  }}
                  scroll={{ x: 'max-content' }}
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
  const [activeTab, setActiveTab] = useState('ventas');

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
      children: <DocumentConfigPanel
        tipo="ventas"
        config={configs.find(c => c.tipo_documento === 'ventas')}
        onUpdate={(datos) => handleUpdate('ventas', datos)}
        active={activeTab === 'ventas'}
      />
    },
    {
      key: 'guias',
      label: 'Guías de Remisión',
      children: <DocumentConfigPanel
        tipo="guias"
        config={configs.find(c => c.tipo_documento === 'guias')}
        onUpdate={(datos) => handleUpdate('guias', datos)}
        active={activeTab === 'guias'}
      />
    },
    {
      key: 'retenciones',
      label: 'Retenciones',
      children: <DocumentConfigPanel
        tipo="retenciones"
        config={configs.find(c => c.tipo_documento === 'retenciones')}
        onUpdate={(datos) => handleUpdate('retenciones', datos)}
        active={activeTab === 'retenciones'}
      />
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
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          tabPosition="top"
          size="large"
        />
      </Card>
    </div>
  );
}
