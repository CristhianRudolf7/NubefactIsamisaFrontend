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
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [serie, setSerie] = useState<string>('');
  
  // Estados de envío masivo persistentes por tipo de documento usando localStorage
  const [isProcessing, setIsProcessing] = useState<boolean>(() => {
    return localStorage.getItem(`bulk_is_processing_${tipo}`) === 'true';
  });
  const [processingIds, setProcessingIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`bulk_processing_ids_${tipo}`);
    return saved ? JSON.parse(saved) : [];
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

  // Polling para actualizar documentos mientras se procesan
  useEffect(() => {
    if (!isProcessing) return;
    
    console.log(`[Bulk Send Polling] Iniciando polling para ${tipo}. IDs a procesar:`, processingIds);
    
    const interval = setInterval(async () => {
      // 1. Refrescar la página actual de la tabla en pantalla
      console.log(`[Bulk Send Polling] Refrescando tabla (Página actual: ${page})`);
      if (tipo === 'ventas') refetchVentas();
      else if (tipo === 'guias') refetchGuias();
      else refetchRetenciones();

      // 2. Consulta global independiente (siempre página 1, lote grande) para vigilar el progreso
      try {
        let service: any;
        if (tipo === 'ventas') service = ventasService;
        else if (tipo === 'guias') service = guiasService;
        else service = retencionesService;

        const checkParams = {
          estado: 'pendiente' as any,
          page: 1,
          page_size: 1000, // Lote grande para cubrir la gran mayoría de envíos masivos
          fecha_inicio: startDate ? startDate.format('DD-MM-YYYY') : undefined,
          fecha_fin: endDate ? endDate.format('DD-MM-YYYY') : undefined,
          serie: serie || undefined
        };

        console.log(`[Bulk Send Polling] Consultando progreso global de pendientes...`, checkParams);
        const res = await service.listar(checkParams);
        if (res.success && res.data?.items) {
          const latestPendingItems = res.data.items;
          const latestPendingIds = latestPendingItems.map((d: any) => 
            String(tipo === 'ventas' ? d.Document : (tipo === 'guias' ? d.Transaction : d.Id))
          );

          // *** DEBUG: Comparar IDs para detectar desajustes de formato ***
          console.log(`[Bulk Send Debug] Total pendientes API: ${res.data.total}, Items devueltos: ${latestPendingIds.length}`);
          console.log(`[Bulk Send Debug] Primeros 3 IDs del API (pendientes):`, latestPendingIds.slice(0, 3));

          setProcessingIds(prevIds => {
            console.log(`[Bulk Send Debug] Primeros 3 IDs en seguimiento (processingIds):`, prevIds.slice(0, 3));
            console.log(`[Bulk Send Debug] Tipos - API ID tipo: ${typeof latestPendingIds[0]}, Tracking ID tipo: ${typeof prevIds[0]}`);
            // Cuántos de los IDs trackeados están en la lista de pendientes del API
            const matchCount = prevIds.filter(id => latestPendingIds.includes(id)).length;
            console.log(`[Bulk Send Debug] Coincidencias directas: ${matchCount} de ${prevIds.length}`);

            // Si el número de pendientes devueltos coincide con el total reportado (o es menor al tamaño de página), tenemos la lista completa.
            const isListComplete = latestPendingIds.length === (res.data.total || 0) || latestPendingIds.length < 1000;
            
            const stillProcessing = prevIds.filter(id => {
              if (latestPendingIds.includes(id)) return true;
              // Si la lista está incompleta, no descartamos los que no vemos (podrían estar en la posición 1001+)
              if (!isListComplete) return true;
              return false;
            });
            
            console.log(`[Bulk Send Polling] Progreso: Quedan ${stillProcessing.length} de ${initialCount} IDs pendientes.`);
            
            if (stillProcessing.length !== prevIds.length) {
              localStorage.setItem(`bulk_processing_ids_${tipo}`, JSON.stringify(stillProcessing));
              
              if (stillProcessing.length === 0) {
                setIsProcessing(false);
                setInitialCount(0);
                localStorage.setItem(`bulk_is_processing_${tipo}`, 'false');
                localStorage.setItem(`bulk_initial_count_${tipo}`, '0');
                message.success('Proceso de envío masivo completado');
              }
            }
            return stillProcessing;
          });
        }
      } catch (err) {
        console.error('[Bulk Send Polling] Error al verificar progreso:', err);
      }
    }, 3000);
    
    return () => {
      console.log(`[Bulk Send Polling] Deteniendo polling para ${tipo}`);
      clearInterval(interval);
    };
  }, [isProcessing, tipo, page, refetchVentas, refetchGuias, refetchRetenciones, startDate, endDate, serie, message]);

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

  // Timeout de seguridad de 2 minutos para liberar la interfaz
  useEffect(() => {
    if (!isProcessing || processingIds.length === 0) return;

    const timeout = setTimeout(() => {
      setIsProcessing(false);
      setProcessingIds([]);
      setInitialCount(0);
      localStorage.setItem(`bulk_is_processing_${tipo}`, 'false');
      localStorage.setItem(`bulk_processing_ids_${tipo}`, '[]');
      localStorage.setItem(`bulk_initial_count_${tipo}`, '0');
      message.warning('El envío masivo está tardando más de lo esperado. El proceso continúa en segundo plano; actualice la página para verificar el estado final.');
    }, 120000);

    return () => clearTimeout(timeout);
  }, [isProcessing, processingIds, tipo, message]);

  const handleCancelBulkSend = () => {
    setIsProcessing(false);
    setProcessingIds([]);
    setInitialCount(0);
    localStorage.setItem(`bulk_is_processing_${tipo}`, 'false');
    localStorage.setItem(`bulk_processing_ids_${tipo}`, '[]');
    localStorage.setItem(`bulk_initial_count_${tipo}`, '0');
    message.info('Seguimiento de envío masivo detenido. Los documentos se seguirán procesando en segundo plano en el servidor.');
  };

  const filteredDocs = useMemo(() => {
    const docs = getPendingDocs();
    return docs.filter((d: any) => {
        // Ignorar documentos que necesitan aprobación (no deben enviarse masivamente)
        return !d.necesita_aprobacion;
    });
  }, [getPendingDocs]);

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

      // Obtener todos los IDs coincidentes (hasta 10000) en segundo plano para realizar el envío
      const fetchParams = {
        estado: 'pendiente' as any,
        page: 1,
        page_size: 10000,
        fecha_inicio: startDate ? startDate.format('DD-MM-YYYY') : undefined,
        fecha_fin: endDate ? endDate.format('DD-MM-YYYY') : undefined,
        serie: serie || undefined
      };

      const response = await service.listar(fetchParams);
      if (!response.success || !response.data?.items) {
        message.error('Error al obtener la lista de documentos para enviar');
        setLoading(false);
        return;
      }

      const docsToSend = response.data.items.filter((d: any) => !d.necesita_aprobacion);
      if (docsToSend.length === 0) {
        message.warning('No hay documentos pendientes para enviar que no requieran aprobación');
        setLoading(false);
        return;
      }

      const ids = docsToSend.map((d: any) => {
        const id = tipo === 'ventas' ? d.Document : (tipo === 'guias' ? d.Transaction : d.Id);
        return String(id);
      });

      // *** DEBUG: Ver muestra de IDs que se van a enviar ***
      console.log(`[Bulk Send Debug] Tipo de documento: ${tipo}`);
      console.log(`[Bulk Send Debug] Total IDs a enviar: ${ids.length}`);
      console.log(`[Bulk Send Debug] Primeros 3 IDs (muestra):`, ids.slice(0, 3));
      console.log(`[Bulk Send Debug] Tipo de dato de ID[0]:`, typeof ids[0], '| Valor:', ids[0]);

      const result = await service.enviarMasivo(ids, usuario);
      if (result.success) {
        setProcessingIds(ids);
        setInitialCount(ids.length);
        setIsProcessing(true);
        localStorage.setItem(`bulk_processing_ids_${tipo}`, JSON.stringify(ids));
        localStorage.setItem(`bulk_initial_count_${tipo}`, String(ids.length));
        localStorage.setItem(`bulk_is_processing_${tipo}`, 'true');
        console.log(`[Bulk Send Debug] IDs guardados en localStorage y processingIds`);
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
                  {isProcessing ? `Procesando ${processingIds.length} documentos...` : (loading ? 'Iniciando envío...' : `Enviar todos en rango (${total})`)}
                </Button>
              )
            }
          >
            {isProcessing && (
              <Alert 
                type="info" 
                showIcon
                icon={<Spin size="small" />}
                message="Envío en proceso"
                description={
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      {`Enviando documentos a NubeFact. Quedan ${processingIds.length} de ${initialCount} por enviar.`}
                    </div>
                    <Button 
                      danger 
                      size="small" 
                      onClick={handleCancelBulkSend}
                    >
                      Detener Envío Masivo
                    </Button>
                  </Space>
                }
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
                              onChange={(val) => setStartDate(val)}
                            />
                          </Col>
                          <Col span={12}>
                            <DatePicker 
                              format="DD/MM/YYYY"
                              placeholder="Hasta"
                              style={{ width: '100%' }} 
                              value={endDate}
                              onChange={(val) => setEndDate(val)}
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
                          onChange={(e) => setSerie(e.target.value.toUpperCase().trim())}
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
