import { Form, Input, Select, DatePicker, Button, Space, Row, Col, Collapse } from 'antd';
import type { Dayjs } from 'dayjs';
import { SearchOutlined, ClearOutlined, FilterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { FilterParams } from '../../types';
import { ESTADOS_DOCUMENTO, TIPOS_DOCUMENTO_VENTA } from '../../utils/constants';

interface FilterPanelProps {
  onFilter: (params: FilterParams) => void;
  onReset: () => void;
  showTipoDocumento?: boolean;
  estados?: { value: string; label: string }[];
}

export default function FilterPanel({
  onFilter,
  onReset,
  showTipoDocumento = true,
  estados = ESTADOS_DOCUMENTO,
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
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={[16, 8]}>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="Fecha Inicio" name="fecha_inicio">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Desde" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="Fecha Fin" name="fecha_fin">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Hasta" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="Serie" name="serie">
                <Input placeholder="Ej: FFF1" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="Número" name="numero">
                <Input placeholder="Ej: 123" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="Estado" name="estado">
                <Select allowClear placeholder="Seleccionar" options={estados} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label="RUC/DNI" name="ruc_cliente">
                <Input placeholder="Cliente" />
              </Form.Item>
            </Col>
            {showTipoDocumento && (
              <Col xs={24} sm={12} md={8} lg={6} xl={4}>
                <Form.Item label="Tipo Doc." name="tipo_documento">
                  <Select allowClear placeholder="Seleccionar" options={TIPOS_DOCUMENTO_VENTA} />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} sm={12} md={8} lg={6} xl={4}>
              <Form.Item label=" ">
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    Buscar
                  </Button>
                  <Button onClick={handleReset} icon={<ClearOutlined />}>
                    Limpiar
                  </Button>
                </Space>
              </Form.Item>
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
