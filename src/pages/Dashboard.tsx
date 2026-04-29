import { Row, Col, Card, Statistic, Table, Typography, Space, Tag, Divider, Empty, Alert, Badge } from 'antd';
import {
  FileTextOutlined,
  RetweetOutlined,
  CarOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useResumenPorEstado, useActividadSemanal } from '../hooks/useDashboard';
import StatusBadge from '../components/common/StatusBadge';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';

const { Title, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData } = useDashboardStats();
  const { data: ventasResumen } = useResumenPorEstado('ventas');
  const { data: retencionesResumen } = useResumenPorEstado('retenciones');
  const { data: guiasResumen } = useResumenPorEstado('guias');
  const { data: actividadData } = useActividadSemanal();

  const stats = statsData?.data;

  // Preparar datos para el gráfico de barras (Volumen por Categoría)
  const volData = [
    { name: 'Ventas', total: stats?.ventas?.total || 0, color: '#1677ff' },
    { name: 'Retenciones', total: stats?.retenciones?.total || 0, color: '#52c41a' },
    { name: 'Guías', total: stats?.guias?.total || 0, color: '#722ed1' },
  ];

  // Preparar datos para el gráfico de torta (Distribución por Estado - Global)
  const getGlobalStatusData = () => {
    const statusMap: Record<string, number> = {};

    [ventasResumen, retencionesResumen, guiasResumen].forEach(resumen => {
      resumen?.data?.forEach(item => {
        const estado = item.estado || 'pendiente';
        statusMap[estado] = (statusMap[estado] || 0) + item.cantidad;
      });
    });

    const COLORS: Record<string, string> = {
      'aceptada': '#52c41a',
      'aceptado': '#52c41a',
      'pendiente': '#faad14',
      'enviado': '#1677ff',
      'error': '#ff4d4f',
      'rechazado': '#f5222d',
      'anulado': '#8c8c8c',
    };

    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: COLORS[name.toLowerCase()] || '#d9d9d9'
    }));
  };

  const statusData = getGlobalStatusData();

  const resumenColumns = [
    { title: 'Estado', dataIndex: 'estado', key: 'estado', render: (estado: string) => <StatusBadge estado={estado} /> },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad', align: 'right' as const },
  ];

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Panel de Control Integral</Title>
        <Text type="secondary">Resumen ejecutivo de operaciones electrónicas</Text>
      </div>
      
      {stats?.por_aprobar_total > 0 && (
        <Alert
          message="Solicitudes de aprobación pendientes"
          description={`Hay ${stats.por_aprobar_total} documentos que han sido editados por trabajadores y requieren su revisión y aprobación para ser procesados.`}
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24, borderRadius: 12 }}
          action={
            <Space direction="vertical">
              <Text strong style={{ color: '#0958d9' }}>Revisar en las listas correspondientes</Text>
            </Space>
          }
        />
      )}

      {/* Cards de estadísticas con diseño premium */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/ventas')}
            className="premium-card"
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Statistic
                title={<Space className="text-blue-600 font-semibold"><FileTextOutlined /> Ventas</Space>}
                value={stats?.ventas?.total || 0}
                styles={{ content: { fontSize: 28, fontWeight: 'bold' } }}
              />
              <div style={{ background: '#e6f4ff', padding: 12, borderRadius: 10 }}>
                <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Space separator={<span style={{ borderLeft: '1px solid #f0f0f0', height: 14, margin: '0 8px' }} />}>
                <Text type="warning">{stats?.ventas?.pendientes || 0} pnd.</Text>
                <Text type="danger">{stats?.ventas?.error || 0} err.</Text>
                <Text type="success">{stats?.ventas?.enviadas || 0} env.</Text>
                {stats?.ventas?.por_aprobar > 0 && <Badge count={stats.ventas.por_aprobar} title="Pendientes de aprobación" style={{ backgroundColor: '#1677ff' }} />}
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/retenciones')}
            className="premium-card"
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Statistic
                title={<Space className="text-green-600 font-semibold"><RetweetOutlined /> Retenciones</Space>}
                value={stats?.retenciones?.total || 0}
                styles={{ content: { fontSize: 28, fontWeight: 'bold' } }}
              />
              <div style={{ background: '#f6ffed', padding: 12, borderRadius: 10 }}>
                <RetweetOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Space separator={<span style={{ borderLeft: '1px solid #f0f0f0', height: 14, margin: '0 8px' }} />}>
                <Text type="warning">{stats?.retenciones?.pendientes || 0} pnd.</Text>
                <Text type="success">{stats?.retenciones?.enviadas || 0} env.</Text>
                {stats?.retenciones?.por_aprobar > 0 && <Badge count={stats.retenciones.por_aprobar} title="Pendientes de aprobación" style={{ backgroundColor: '#52c41a' }} />}
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/guias')}
            className="premium-card"
            style={{ borderRadius: 12, overflow: 'hidden' }}
            styles={{ body: { padding: 20 } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Statistic
                title={<Space className="text-purple-600 font-semibold"><CarOutlined /> Guías Remisión</Space>}
                value={stats?.guias?.total || 0}
                styles={{ content: { fontSize: 28, fontWeight: 'bold' } }}
              />
              <div style={{ background: '#f9f0ff', padding: 12, borderRadius: 10 }}>
                <CarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <Space separator={<span style={{ borderLeft: '1px solid #f0f0f0', height: 14, margin: '0 8px' }} />}>
                <Text type="warning">{stats?.guias?.pendientes || 0} pnd.</Text>
                <Text type="success">{stats?.guias?.aceptadas || 0} acept.</Text>
                {stats?.guias?.por_aprobar > 0 && <Badge count={stats.guias.por_aprobar} title="Pendientes de aprobación" style={{ backgroundColor: '#722ed1' }} />}
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Gráficos y Visualizaciones */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={<Space><BarChartOutlined /> Volumen de Documentos por Tipo</Space>}
            style={{ borderRadius: 12, minHeight: 380 }}
          >
            <div style={{ height: 300, width: '100%', minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                <BarChart data={volData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} barSize={60}>
                    {volData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={<Space><PieChartOutlined /> Distribución de Estados</Space>}
            style={{ borderRadius: 12, minHeight: 380 }}
          >
            <div style={{ height: 300, width: '100%', minWidth: 0 }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty description="No hay datos de estados" style={{ marginTop: 60 }} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tablas de resumen y Gráfico de Tiempo */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title="Detalle de Ventas por Estado"
            size="small"
            style={{ borderRadius: 12, minHeight: 320 }}
            extra={<Text type="secondary">{ventasResumen?.data?.length || 0} estados</Text>}
          >
            <Table
              dataSource={ventasResumen?.data || []}
              columns={resumenColumns}
              rowKey="estado"
              pagination={false}
              size="small"
              bordered={false}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={<Space><LineChartOutlined /> Tendencia de Actividad Semanal</Space>} 
            size="small" 
            style={{ borderRadius: 12, height: '100%', minHeight: 320 }}
          >
            <div style={{ height: 240, width: '100%', paddingTop: 10, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height="100%" minHeight={240}>
                <AreaChart data={actividadData?.data || []}>
                  <defs>
                    <linearGradient id="colorQty" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="fecha" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8c8c8c' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#8c8c8c' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 12 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cantidad" 
                    stroke="#1677ff" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#colorQty)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      <style>{`
        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
        }
      `}</style>
    </div>
  );
}
