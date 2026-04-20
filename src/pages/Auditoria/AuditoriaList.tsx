import { useState } from 'react';
import {
  Table, Card, Row, Col, Statistic, Tag, Space, Button, Modal, DatePicker,
  Select, Input, Typography, Descriptions, Spin, Empty, Tooltip, Badge, Alert
} from 'antd';
import {
  AuditOutlined, EyeOutlined, ReloadOutlined, UserOutlined,
  CalendarOutlined, FilterOutlined, BarChartOutlined, HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useAuditoriaList,
  useAuditoriaDetalle,
  useAuditoriaEstadisticas,
  useAuditoriaTablas,
  useAuditoriaAcciones
} from '../../hooks/useAuditoria';
import type { AuditoriaRegistro, AuditoriaFiltros } from '../../types/index';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Colores para tipos de acción
const ACCION_COLORS: Record<string, string> = {
  INSERT: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  SEND: 'purple',
  CANCEL: 'orange',
};

// Traducción de acciones
const ACCION_LABELS: Record<string, string> = {
  INSERT: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
  SEND: 'Envío SUNAT',
  CANCEL: 'Anulación',
};

export default function AuditoriaList() {
  const [filtros, setFiltros] = useState<AuditoriaFiltros>({ page: 1, page_size: 20 });
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Queries
  const { data: auditoriaData, isLoading, refetch } = useAuditoriaList(filtros);
  const { data: detalle, isLoading: loadingDetalle } = useAuditoriaDetalle(detalleId);
  const { data: estadisticas } = useAuditoriaEstadisticas(30);
  const { data: tablas } = useAuditoriaTablas();
  const { data: acciones } = useAuditoriaAcciones();

  // Columnas de la tabla
  const columns: ColumnsType<AuditoriaRegistro> = [
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      width: 180,
      render: (fecha: string) => (
        <Space>
          <CalendarOutlined />
          {dayjs(fecha).format('DD/MM/YYYY HH:mm:ss')}
        </Space>
      ),
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      width: 150,
      render: (usuario: string) => usuario ? (
        <Space>
          <UserOutlined />
          {usuario}
        </Space>
      ) : <Text type="secondary">Sistema</Text>,
    },
    {
      title: 'Acción',
      dataIndex: 'accion',
      key: 'accion',
      width: 130,
      render: (accion: string) => (
        <Tag color={ACCION_COLORS[accion] || 'default'}>
          {ACCION_LABELS[accion] || accion}
        </Tag>
      ),
    },
    {
      title: 'Tabla',
      dataIndex: 'tabla',
      key: 'tabla',
      width: 120,
      render: (tabla: string) => <Badge status="processing" text={tabla} />,
    },
    {
      title: 'Registro ID',
      dataIndex: 'registro_id',
      key: 'registro_id',
      width: 100,
      align: 'center',
    },
    {
      title: 'IP',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip: string) => ip || '-',
    },
    {
      title: 'Acciones',
      key: 'acciones',
      width: 80,
      align: 'center',
      render: (_: unknown, record: AuditoriaRegistro) => (
        <Tooltip title="Ver detalle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => setDetalleId(record.id)}
          />
        </Tooltip>
      ),
    },
  ];

  // Manejar cambio de página
  const handleTableChange = (page: number, pageSize: number) => {
    setFiltros({ ...filtros, page, page_size: pageSize });
  };

  // Manejar filtros de fecha
  const handleDateChange = (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setFiltros({
        ...filtros,
        fecha_inicio: dates[0].format('YYYY-MM-DD'),
        fecha_fin: dates[1].format('YYYY-MM-DD'),
        page: 1,
      });
    } else {
      const { fecha_inicio, fecha_fin, ...rest } = filtros;
      setFiltros({ ...rest, page: 1 });
    }
  };

  // Limpiar filtros
  const clearFilters = () => {
    setFiltros({ page: 1, page_size: 20 });
  };

  // Componente para mostrar datos en tabla
  const DatosComparacion = ({ titulo, datos }: { titulo: string; datos: Record<string, unknown> | null }) => {
    if (!datos) {
      return <Empty description={`Sin datos ${titulo.toLowerCase()}`} />;
    }

    // Función para formatear fechas Excel (número de días desde 1899-12-30)
    const formatExcelDate = (value: unknown): string | null => {
      if (typeof value !== 'number') return null;
      // Si es un número grande como timestamp de Excel
      if (value > 10000) {
        const excelEpoch = new Date(1899, 11, 30);
        const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
        return dayjs(date).format('DD/MM/YYYY');
      }
      return null;
    };

    // Función para renderizar valor
    const renderValue = (value: unknown): React.ReactNode => {
      if (value === null || value === undefined) {
        return <Text type="secondary">-</Text>;
      }
      if (typeof value === 'boolean') {
        return <Tag color={value ? 'green' : 'red'}>{value ? 'Sí' : 'No'}</Tag>;
      }
      if (typeof value === 'number') {
        const dateStr = formatExcelDate(value);
        if (dateStr) return <Text>{dateStr}</Text>;
        return <Text>{value.toLocaleString('es-PE')}</Text>;
      }
      if (typeof value === 'string') {
        if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
          return <Text>{dayjs(value).format('DD/MM/YYYY HH:mm:ss')}</Text>;
        }
        return <Text>{value}</Text>;
      }
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return <Text type="secondary">Sin items</Text>;
        }
        // Si es array de objetos, mostrar tabla
        if (typeof value[0] === 'object' && value[0] !== null) {
          const columns = Object.keys(value[0] as Record<string, unknown>).map(key => ({
            title: key,
            dataIndex: key,
            key: key,
            width: 120,
            render: (v: unknown) => renderValue(v),
          }));
          return (
            <Table
              dataSource={value}
              columns={columns}
              rowKey={(_, index) => `row-${index}`}
              size="small"
              pagination={false}
              scroll={{ x: true }}
              bordered
            />
          );
        }
        return <Text>{value.join(', ')}</Text>;
      }
      if (typeof value === 'object') {
        return <DatosComparacion titulo={titulo} datos={value as Record<string, unknown>} />;
      }
      return <Text>{String(value)}</Text>;
    };

    // Extraer datos - manejar estructura anidada y plana
    let cabecera: Record<string, unknown> | undefined;
    let detalles: unknown[] | undefined;
    let motivo: string | undefined;

    if (datos.documento && typeof datos.documento === 'object') {
      // Caso 1: Estructura anidada (ej: envíos SUNAT)
      const doc = datos.documento as Record<string, unknown>;
      cabecera = doc.cabecera as Record<string, unknown> | undefined;
      detalles = doc.detalles as unknown[] | undefined;
      motivo = (datos.motivo || doc.motivo) as string | undefined;
    } else {
      // Caso 2: Estructura plana o mixta (ej: actualizaciones, anulaciones)
      const { cabecera: c, detalles: d, items, motivo: m, ...rest } = datos;
      detalles = (d || items) as unknown[] | undefined;
      motivo = m as string | undefined;
      
      if (c && typeof c === 'object') {
        cabecera = { ...(c as Record<string, unknown>), ...rest };
      } else {
        cabecera = rest as Record<string, unknown>;
      }
    }

    return (
      <div style={{ maxHeight: 500, overflow: 'auto' }}>
        {/* Cabecera */}
        {cabecera && Object.keys(cabecera).length > 0 && (
          <Card size="small" title={<Text strong>Datos del Documento</Text>} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small" bordered>
              {Object.entries(cabecera).map(([key, value]) => (
                <Descriptions.Item key={key} label={<Text strong style={{ fontSize: 12 }}>{key}</Text>}>
                  {renderValue(value)}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Card>
        )}

        {/* Motivo de anulación si existe */}
        {motivo && (
          <Alert
            message="Motivo de Anulación"
            description={motivo}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Detalles en tabla */}
        {detalles && Array.isArray(detalles) && detalles.length > 0 && (
          <Card size="small" title={<Text strong>Items del Documento ({detalles.length})</Text>}>
            {renderValue(detalles)}
          </Card>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          <AuditOutlined style={{ marginRight: 8 }} />
          Auditoría del Sistema
        </Title>
        <Space>
          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filtros
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => refetch()}
            loading={isLoading}
          >
            Actualizar
          </Button>
        </Space>
      </div>

      {/* Estadísticas rápidas */}
      {estadisticas && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Total Registros"
                value={estadisticas.total_registros}
                prefix={<HistoryOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Envíos SUNAT"
                value={estadisticas.acciones_por_tipo?.SEND || 0}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Actualizaciones"
                value={estadisticas.acciones_por_tipo?.UPDATE || 0}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card size="small">
              <Statistic
                title="Anulaciones"
                value={estadisticas.acciones_por_tipo?.CANCEL || 0}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filtros */}
      {showFilters && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filtrar por tabla"
                allowClear
                style={{ width: '100%' }}
                value={filtros.tabla}
                onChange={(value) => setFiltros({ ...filtros, tabla: value, page: 1 })}
                options={tablas?.map(t => ({ value: t, label: t }))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filtrar por acción"
                allowClear
                style={{ width: '100%' }}
                value={filtros.accion}
                onChange={(value) => setFiltros({ ...filtros, accion: value, page: 1 })}
                options={acciones?.map(a => ({ value: a, label: ACCION_LABELS[a] || a }))}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Buscar por usuario"
                prefix={<UserOutlined />}
                value={filtros.usuario}
                onChange={(e) => setFiltros({ ...filtros, usuario: e.target.value || undefined, page: 1 })}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker
                style={{ width: '100%' }}
                onChange={handleDateChange as unknown as (dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null) => void}
              />
            </Col>
            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button onClick={clearFilters}>Limpiar filtros</Button>
            </Col>
          </Row>
        </Card>
      )}

      {/* Tabla principal */}
      <Card>
        <Table
          columns={columns}
          dataSource={auditoriaData?.registros}
          rowKey="id"
          loading={isLoading}
          pagination={{
            current: filtros.page,
            pageSize: filtros.page_size,
            total: auditoriaData?.total,
            showSizeChanger: true,
            showTotal: (total) => `Total: ${total} registros`,
            onChange: handleTableChange,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      {/* Modal de detalle */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            Detalle de Auditoría
          </Space>
        }
        open={detalleId !== null}
        onCancel={() => setDetalleId(null)}
        footer={null}
        width={900}
      >
        {loadingDetalle ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : detalle ? (
          <div>
            {/* Info general */}
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Fecha">
                {dayjs(detalle.fecha).format('DD/MM/YYYY HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="Usuario">
                {detalle.usuario || 'Sistema'}
              </Descriptions.Item>
              <Descriptions.Item label="Acción">
                <Tag color={ACCION_COLORS[detalle.accion] || 'default'}>
                  {ACCION_LABELS[detalle.accion] || detalle.accion}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tabla">
                {detalle.tabla}
              </Descriptions.Item>
              <Descriptions.Item label="Registro ID">
                {detalle.registro_id}
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                {detalle.ip || '-'}
              </Descriptions.Item>
            </Descriptions>

            {/* Comparación de datos */}
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card
                  title={<Text strong style={{ color: '#ff4d4f' }}>Datos Anteriores</Text>}
                  size="small"
                  style={{ height: '100%' }}
                >
                  <DatosComparacion titulo="anteriores" datos={detalle.datos_anteriores} />
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card
                  title={<Text strong style={{ color: '#52c41a' }}>Datos Nuevos</Text>}
                  size="small"
                  style={{ height: '100%' }}
                >
                  <DatosComparacion titulo="nuevos" datos={detalle.datos_nuevos} />
                </Card>
              </Col>
            </Row>
          </div>
        ) : (
          <Empty description="No se encontró el registro" />
        )}
      </Modal>

      {/* Estadísticas detalladas */}
      {estadisticas && estadisticas.usuarios_mas_activos.length > 0 && (
        <Card
          title={
            <Space>
              <BarChartOutlined />
              Usuarios más activos (últimos 30 días)
            </Space>
          }
          style={{ marginTop: 24 }}
        >
          <Table
            dataSource={estadisticas.usuarios_mas_activos}
            rowKey="usuario"
            pagination={false}
            size="small"
            columns={[
              {
                title: 'Usuario',
                dataIndex: 'usuario',
                key: 'usuario',
                render: (usuario: string) => (
                  <Space>
                    <UserOutlined />
                    {usuario}
                  </Space>
                ),
              },
              {
                title: 'Acciones',
                dataIndex: 'cantidad',
                key: 'cantidad',
                render: (cantidad: number) => (
                  <Tag color="blue">{cantidad}</Tag>
                ),
              },
            ]}
          />
        </Card>
      )}
    </div>
  );
}
