import { useState, useMemo } from 'react';
import { Typography, Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import FilterPanel from '../../components/common/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import { useRetenciones, useEnviarRetencion } from '../../hooks/useRetenciones';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useAppContext } from '../../contexts/AppContext';
import { RETENCIONES_COLUMNS, ESTADOS_DOCUMENTO } from '../../utils/constants';
import { formatExcelDate, formatCurrency, formatSerieNumero } from '../../utils/formatters';
import type { FilterParams, Retencion, PaginationParams } from '../../types';

const { Title } = Typography;

export default function RetencionesList() {
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, page_size: 20 });

  const { data, isLoading, refetch } = useRetenciones({ ...filters, ...pagination });
  const enviarMutation = useEnviarRetencion();

  const {
    columns,
    visibleColumns,
    hiddenCount,
    toggleColumn,
    resetToDefault,
  } = useColumnVisibility('retenciones', RETENCIONES_COLUMNS);

  const retenciones = data?.data?.items || [];
  const total = data?.data?.total || 0;

  const handleFilter = (params: FilterParams) => {
    setFilters(params);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEnviar = async (record: Retencion) => {
    try {
      const result = await enviarMutation.mutateAsync({
        retencionId: record.Id,
        usuario,
      });
      if (result.success) {
        message.success('Retención enviada correctamente');
        refetch();
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error al enviar retención');
    }
  };

  const canEdit = (record: Retencion) => {
    const estado = (record.status || '').toLowerCase();
    return ['rechazado', 'error', 'aceptado_observaciones'].includes(estado);
  };

  const canSend = (record: Retencion) => {
    const estado = (record.status || '').toLowerCase();
    return !estado || ['pendiente', 'error'].includes(estado) || canEdit(record);
  };

  const tableData = useMemo(() => {
    return retenciones.map((r) => ({
      ...r,
      key: r.Id,
      serieNumero: formatSerieNumero(r.Serie, r.Numero),
      fechaEmision: formatExcelDate(r.DocumentDate),
      proveedor: `${r.VendorRuc} - ${r.VendorName}`,
      tasa: `${r.Tasa}%`,
      totalRetenido: formatCurrency(r.TotalRetenido),
      totalPagado: formatCurrency(r.TotalPagado),
      estado: <StatusBadge estado={r.status} />,
    }));
  }, [retenciones]);

  return (
    <div>
      <Title level={4}>Retenciones</Title>

      <FilterPanel
        onFilter={handleFilter}
        onReset={handleResetFilters}
        showTipoDocumento={false}
        estados={ESTADOS_DOCUMENTO}
      />

      <Card>
        <DataTable
          data={tableData}
          loading={isLoading}
          columns={columns}
          visibleColumns={visibleColumns}
          onToggleColumn={toggleColumn}
          onResetColumns={resetToDefault}
          hiddenCount={hiddenCount}
          rowKey="key"
          onView={(record) => navigate(`/retenciones/${record.Id}`)}
          onEdit={(record) => navigate(`/retenciones/${record.Id}/editar`)}
          onSend={handleEnviar}
          canEdit={canEdit}
          canSend={canSend}
          getEstado={(record) => record.status as string}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total,
            onChange: (page, pageSize) => setPagination({ page, page_size: pageSize }),
          }}
        />
      </Card>
    </div>
  );
}
