import { Row, Col, Card, Statistic, Table, Typography, Space, Tag } from 'antd';
import {
  FileTextOutlined,
  RetweetOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useResumenPorEstado } from '../hooks/useDashboard';
import StatusBadge from '../components/common/StatusBadge';

const { Title } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: statsData } = useDashboardStats();
  const { data: ventasResumen } = useResumenPorEstado('ventas');

  const stats = statsData?.data;

  const resumenColumns = [
    { title: 'Estado', dataIndex: 'estado', key: 'estado', render: (estado: string) => <StatusBadge estado={estado} /> },
    { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad' },
  ];

  return (
    <div>
      <Title level={4} style={{ marginBottom: 24 }}>Dashboard</Title>

      {/* Cards de estadísticas */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/ventas')}
            style={{ borderLeft: '4px solid #1677ff' }}
          >
            <Statistic
              title={<Space><FileTextOutlined /> Ventas</Space>}
              value={stats?.ventas?.total || 0}
              suffix={
                <Space size={4}>
                  <Tag color="orange">{stats?.ventas?.pendientes || 0} pendientes</Tag>
                  <Tag color="red">{stats?.ventas?.error || 0} errores</Tag>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/retenciones')}
            style={{ borderLeft: '4px solid #52c41a' }}
          >
            <Statistic
              title={<Space><RetweetOutlined /> Retenciones</Space>}
              value={stats?.retenciones?.total || 0}
              suffix={
                <Tag color="orange">{stats?.retenciones?.pendientes || 0} pendientes</Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            hoverable
            onClick={() => navigate('/guias')}
            style={{ borderLeft: '4px solid #722ed1' }}
          >
            <Statistic
              title={<Space><CarOutlined /> Guías de Remisión</Space>}
              value={stats?.guias?.total || 0}
              suffix={
                <Tag color="orange">{stats?.guias?.pendientes || 0} pendientes</Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Resumen por estado */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Resumen de Ventas por Estado" size="small">
            <Table
              dataSource={ventasResumen?.data || []}
              columns={resumenColumns}
              rowKey="estado"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Acciones rápidas" size="small">
            <Space orientation="vertical" style={{ width: '100%' }}>
              <div onClick={() => navigate('/ventas?estado=pendiente')} style={{ cursor: 'pointer', padding: 8, background: '#fff7e6', borderRadius: 4 }}>
                <ClockCircleOutlined style={{ color: '#faad14' }} /> Documentos pendientes de envío
              </div>
              <div onClick={() => navigate('/ventas?estado=rechazado')} style={{ cursor: 'pointer', padding: 8, background: '#fff2f0', borderRadius: 4 }}>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} /> Documentos rechazados que requieren edición
              </div>
              <div onClick={() => navigate('/ventas?estado=aceptado')} style={{ cursor: 'pointer', padding: 8, background: '#f6ffed', borderRadius: 4 }}>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> Documentos aceptados por SUNAT
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
