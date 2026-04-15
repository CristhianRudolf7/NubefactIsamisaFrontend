import { useState, useMemo } from 'react';
import { Typography, Card, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import FilterPanel from '../../components/common/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import ColumnSelector from '../../components/common/ColumnSelector';
import { useGuias, useEnviarGuia } from '../../hooks/useGuias';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { useAppContext } from '../../contexts/AppContext';
import { GUIAS_COLUMNS, ESTADOS_DOCUMENTO } from '../../utils/constants';
import { formatExcelDate, formatSerieNumero } from '../../utils/formatters';
import type { FilterParams, GuiaRemision, PaginationParams } from '../../types';

const { Title } = Typography;

export default function GuiasList() {
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<FilterParams>({});
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, page_size: 20 });

  const { data, isLoading, refetch } = useGuias({ ...filters, ...pagination });
  const enviarMutation = useEnviarGuia();

  const {
    columns,
    visibleColumns,
    hiddenCount,
    toggleColumn,
    resetToDefault,
  } = useColumnVisibility('guias', GUIAS_COLUMNS);

  const guias = data?.data?.items || [];
  const total = data?.data?.total || 0;

  const handleFilter = (params: FilterParams) => {
    setFilters(params);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters({});
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleEnviar = async (record: GuiaRemision) => {
    try {
      const result = await enviarMutation.mutateAsync({
        transactionId: record.Transaction,
        usuario,
      });
      if (result.success) {
        message.success('Guía enviada correctamente');
        refetch();
      } else {
        message.error(result.message || 'Error al enviar');
      }
    } catch {
      message.error('Error al enviar guía');
    }
  };

  const canEdit = (record: Record<string, unknown>) => {
    const estado = ((record.envio_nube as string) || '').toLowerCase();
    return ['rechazado', 'error', 'aceptado_observaciones'].includes(estado);
  };

  const canSend = (record: Record<string, unknown>) => {
    const estado = ((record.envio_nube as string) || '').toLowerCase();
    return !estado || ['pendiente', 'error'].includes(estado) || canEdit(record);
  };

  const handleDownloadPdf = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/guias/${record.Transaction}/pdf`, '_blank');
  };

  const handleDownloadXml = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/guias/${record.Transaction}/xml`, '_blank');
  };

  const handleDownloadCdr = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseUrl}/guias/${record.Transaction}/cdr`, '_blank');
  };

  const tableData = useMemo(() => {
    return guias.map((g) => ({
      ...g,
      key: g.Transaction,
      serieNumero: formatSerieNumero(g.DocumentSerie, g.DocumentNo),
      fechaTraslado: formatExcelDate(g.TransactionDate),
      destinatario: `${g.TargetPersonRUC} - ${g.TargetPersonName}`,
      pesoBruto: `${g.PesoBruto} kg`,
      estado: <StatusBadge estado={g.envio_nube} />,
      transportista: g.Transportista,
    }));
  }, [guias]);

  return (
    <div>
      <Title level={4}>Guías de Remisión</Title>

      <FilterPanel
        onFilter={handleFilter}
        onReset={handleResetFilters}
        onRefresh={() => refetch()}
        isLoading={isLoading}
        showTipoDocumento={false}
        estados={ESTADOS_DOCUMENTO}
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
          onView={(record) => navigate(`/guias/${record.Transaction}`)}
          onEdit={(record) => navigate(`/guias/${record.Transaction}/editar`)}
          onSend={handleEnviar}
          canEdit={canEdit}
          canSend={canSend}
          getEstado={(record) => record.envio_nube as string}
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
