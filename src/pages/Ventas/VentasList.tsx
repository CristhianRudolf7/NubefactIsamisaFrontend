import { useState, useMemo } from 'react';
import { Typography, Card, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import FilterPanel from '../../components/common/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import ColumnSelector from '../../components/common/ColumnSelector';
import { useVentas, useEnviarVenta } from '../../hooks/useVentas';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useAppContext } from '../../contexts/AppContext';
import { VENTAS_COLUMNS } from '../../utils/constants';
import { formatExcelDate, formatCurrency, formatSerieNumero } from '../../utils/formatters';
import type { FilterParams, DocumentoVenta, PaginationParams } from '../../types';

const { Title } = Typography;

export default function VentasList() {
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, page_size: 20 });

  const { data, isLoading, refetch } = useVentas({ ...filters, ...pagination });
  const enviarMutation = useEnviarVenta();

  const {
    columns,
    visibleColumns,
    hiddenCount,
    toggleColumn,
    resetToDefault,
  } = useColumnVisibility('ventas', VENTAS_COLUMNS);

  const ventas = data?.data?.items || [];
  const total = data?.data?.total || 0;

  const handleFilter = (params: FilterParams) => {
    setFilters(params);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEnviar = async (record: DocumentoVenta) => {
    try {
      const result = await enviarMutation.mutateAsync({
        documentId: record.Document,
        usuario,
      });
      if (result.success) {
        message.success('Documento enviado correctamente');
        refetch();
      } else {
        message.error(result.message || 'Error al enviar documento');
      }
    } catch {
      message.error('Error al enviar documento');
    }
  };

  const canEdit = (record: Record<string, unknown>) => {
    const estado = ((record.fe as string) || '').toLowerCase();
    return ['rechazado', 'error', 'aceptado_observaciones'].includes(estado);
  };

  const canSend = (record: Record<string, unknown>) => {
    const estado = ((record.fe as string) || '').toLowerCase();
    return ['pendiente', '', undefined].includes(estado) || canEdit(record);
  };

  const handleDownloadPdf = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${record.Document}/pdf`, '_blank');
  };

  const handleDownloadXml = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${record.Document}/xml`, '_blank');
  };

  const handleDownloadCdr = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/ventas/${record.Document}/cdr`, '_blank');
  };

  const tableData = useMemo(() => {
    return ventas.map((v) => ({
      ...v,
      key: v.Document,
      tipoDocumento: v.DocumentType?.replace('LIMADSAS', '') || '-',
      serieNumero: formatSerieNumero(v.DocumentSerie, v.DocumentNo),
      fechaEmision: formatExcelDate(v.DocumentDate),
      cliente: `${v.VendorRUC} - ${v.VendorName}`,
      monto: formatCurrency(v.AmountTotalLo, v.DocumentCurrency === 'LO' ? 'S/' : '$'),
      estado: <StatusBadge estado={v.fe} />,
    }));
  }, [ventas]);

  return (
    <div>
      <Title level={4}>Documentos de Venta</Title>

      <FilterPanel
        onFilter={handleFilter}
        onReset={handleResetFilters}
        onRefresh={() => refetch()}
        isLoading={isLoading}
        columnSelector={
          <ColumnSelector
            columns={columns}
            onToggle={toggleColumn}
            onReset={resetToDefault}
            hiddenCount={hiddenCount}
          />
        }
      />

      <Card>
        <DataTable
          data={tableData}
          loading={isLoading}
          visibleColumns={visibleColumns}
          rowKey="key"
          onView={(record) => navigate(`/ventas/${record.Document}`)}
          onEdit={(record) => navigate(`/ventas/${record.Document}/editar`)}
          onSend={handleEnviar}
          canEdit={canEdit}
          canSend={canSend}
          getEstado={(record) => record.fe as string}
          getError={(record) => record.error_mensaje}
          onDownloadPdf={handleDownloadPdf}
          onDownloadXml={handleDownloadXml}
          onDownloadCdr={handleDownloadCdr}
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
