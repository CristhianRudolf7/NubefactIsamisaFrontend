import { Form, Input, Select, DatePicker, Button, Space, Row, Col, Collapse, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import { SearchOutlined, ClearOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState, type ReactNode } from 'react';
import type { FilterParams } from '../../types';
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO_VENTA } from '../../utils/constants';

const { Item } = Form;

interface FilterPanelProps {
  onFilter: (params: FilterParams) => void;
  onReset: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  showTipoDocumento?: boolean;
  estados?: { value: string; label: string }[];
  columnSelector?: ReactNode;
  initialValues?: Record<string, unknown>;
}

export default function FilterPanel({
  onRefresh,
  isLoading = false,
  onFilter,
  onReset,
  showTipoDocumento = true,
  estados = ESTADOS_DOCUMENTO,
  columnSelector,
  initialValues,
}: FilterPanelProps) {
  const [form] = Form.useForm();
  const [expanded, setExpanded] = useState(true); // Abierto por defecto

  const handleFinish = (values: Record<string, unknown>) => {
    const params: FilterParams = {
      fecha_inicio: (values.fecha_inicio as Dayjs)?.format('DD-MM-YYYY'),
      fecha_fin: (values.fecha_fin as Dayjs)?.format('DD-MM-YYYY'),
      serie: values.serie as string,
      numero: values.numero as string,
      estado: values.estado as FilterParams['estado'],
      ruc_cliente: values.ruc_cliente as string,
      tipo_documento: values.tipo_documento as string,
    };
    onFilter(params);
  };

  const handleReset = () => {
    form.resetFields();
    onReset();
  };

  const collapseItems = [
    {
      key: '1',
      label: (
        <Space>
          <FilterOutlined />
          <span>Filtros de búsqueda</span>
        </Space>
      ),
      children: (
        <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={initialValues}>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="Fecha Inicio" name="fecha_inicio">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Desde" />
              </Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="Fecha Fin" name="fecha_fin">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Hasta" />
              </Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="Serie" name="serie">
                <Input placeholder="Ej: FFF1" />
              </Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="Número" name="numero">
                <Input placeholder="Ej: 123" />
              </Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="Estado" name="estado">
                <Select allowClear placeholder="Seleccionar" options={estados} />
              </Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Item label="RUC/DNI" name="ruc_cliente">
                <Input placeholder="Cliente" />
              </Item>
            </Col>
            {showTipoDocumento && (
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Item label="Tipo Doc." name="tipo_documento">
                  <Select allowClear placeholder="Seleccionar" options={TIPOS_DOCUMENTO_VENTA} />
                </Item>
              </Col>
            )}
            {/* Botones como elementos individuales del grid */}
            <Col xs={24} sm={12} md={6} lg={4} xl={3}>
              <Item label=" ">
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={isLoading} block>
                  Buscar
                </Button>
              </Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4} xl={3}>
              <Item label=" ">
                <Button onClick={handleReset} icon={<ClearOutlined />} block>
                  Limpiar
                </Button>
              </Item>
            </Col>
            <Col xs={24} sm={12} md={6} lg={4} xl={3}>
              <Item label=" ">
                {columnSelector}
              </Item>
            </Col>
            {/* Espacio flexible para empujar Actualizar a la derecha */}
            <Col flex="auto" />
            <Col xs={24} sm={12} md={6} lg={4} xl={3}>
              <Item label=" ">
                {onRefresh && (
                  <Tooltip title="Recargar datos">
                    <Button onClick={onRefresh} icon={<ReloadOutlined />} loading={isLoading} block>
                      Actualizar
                    </Button>
                  </Tooltip>
                )}
              </Item>
            </Col>
          </Row>
        </Form>
      ),
    },
  ];

  return (
    <div className="filter-panel" style={{ marginBottom: 16, background: '#fff', padding: 16, borderRadius: 8, overflow: 'hidden' }}>
      <Collapse
        ghost
        activeKey={expanded ? ['1'] : []}
        onChange={() => setExpanded(!expanded)}
        items={collapseItems}
        style={{ overflow: 'visible' }}
      />
    </div>
  );
}
