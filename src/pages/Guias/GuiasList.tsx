import { useState, useMemo } from 'react';
import { Typography, Card, App, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import FilterPanel from '../../components/common/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import ColumnSelector from '../../components/common/ColumnSelector';
import ChangesModal from '../../components/common/ChangesModal';
import { useGuias, useEnviarGuia, useAprobarGuia, useRechazarGuia } from '../../hooks/useGuias';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { guiasService } from '../../services/guiasService';
import { useAppContext } from '../../contexts/AppContext';
import { GUIAS_COLUMNS, ESTADOS_DOCUMENTO } from '../../utils/constants';
import { formatExcelDate, formatSerieNumero } from '../../utils/formatters';
import type { FilterParams, GuiaRemision, PaginationParams } from '../../types';

const { Title } = Typography;

export default function GuiasList() {
  const navigate = useNavigate();
  const { usuario } = useAppContext();
  const { message } = App.useApp();
  const [filters, setFilters] = useState<FilterParams>({
    fecha_inicio: dayjs().subtract(3, 'day').format('DD-MM-YYYY'),
    fecha_fin: dayjs().format('DD-MM-YYYY'),
  });
  const [pagination, setPagination] = useState<PaginationParams>({ page: 1, page_size: 20 });
  const [historyModal, setHistoryModal] = useState<{ open: boolean; record: GuiaRemision | null }>({
    open: false,
    record: null,
  });

  const { data, isLoading, refetch } = useGuias({ ...filters, ...pagination });
  const enviarMutation = useEnviarGuia();
  const aprobarMutation = useAprobarGuia();
  const rechazarMutation = useRechazarGuia();

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
    setFilters({
      fecha_inicio: dayjs().subtract(3, 'day').format('DD-MM-YYYY'),
      fecha_fin: dayjs().format('DD-MM-YYYY'),
    });
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

  const handleAprobar = async (record: GuiaRemision) => {
    try {
      const result = await aprobarMutation.mutateAsync({
        transactionId: record.Transaction,
        usuario,
      });
      if (result.success) {
        message.success('Guía aprobada correctamente');
        refetch();
      } else {
        message.error(result.message || 'Error al aprobar');
      }
    } catch {
      message.error('Error al aprobar guía');
    }
  };

  const handleRechazar = async (record: GuiaRemision) => {
    try {
      const result = await rechazarMutation.mutateAsync({
        transactionId: record.Transaction,
      });
      if (result.success) {
        message.success('Cambios eliminados y versión anterior restaurada');
        refetch();
      } else {
        message.error(result.message || 'Error al eliminar cambios');
      }
    } catch {
      message.error('Error al eliminar cambios');
    }
  };

  const canEdit = (record: Record<string, unknown>) => {
    const estado = ((record.nube_status_web as string) || '').toLowerCase();
    return ['rechazado', 'error', 'aceptado_observaciones'].includes(estado);
  };

  const canSend = (record: Record<string, unknown>) => {
    if (record.necesita_aprobacion) return false;
    const estado = ((record.nube_status_web as string) || '').toLowerCase();
    return !estado || ['pendiente', 'error'].includes(estado) || canEdit(record);
  };

  const handleDownloadPdf = async (record: Record<string, unknown>) => {
    const result = await guiasService.descargarPdf(record.Transaction as string);
    
    if (result.success && result.blob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.DocumentSerie}-${record.DocumentNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } else {
      message.warning(result.error || 'PDF no disponible');
    }
  };

  const handleDownloadXml = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    window.open(`${baseUrl}/guias/${record.Transaction}/xml`, '_blank');
  };

  const handleDownloadCdr = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    window.open(`${baseUrl}/guias/${record.Transaction}/cdr`, '_blank');
  };

  const tableData = useMemo(() => {
    return guias.map((g) => {
      const rawDate = g.TransactionDate;
      let fechaFormateada = '-';
      
      if (typeof rawDate === 'number') {
        fechaFormateada = formatExcelDate(rawDate);
      } else if (typeof rawDate === 'string' && rawDate) {
        const datePart = (rawDate as string).split('T')[0];
        const [year, month, day] = datePart.split('-');
        fechaFormateada = `${day}-${month}-${year}`;
      }

      return {
        ...g,
        key: g.Transaction,
        serieNumero: formatSerieNumero(g.DocumentSerie, g.DocumentNo),
        fechaTraslado: fechaFormateada,
        destinatario: `${g.TargetPersonRUC} - ${g.TargetPersonName}`,
        pesoBruto: `${g.PesoBruto} kg`,
        estado: (
          <Space orientation="vertical" size={0}>
            <StatusBadge estado={g.nube_status_web} />
            {g.necesita_aprobacion && <Tag color="blue" style={{ fontSize: '10px', marginTop: 4 }}>POR APROBAR</Tag>}
          </Space>
        ),
        hash: g.codigo_hash ? `${g.codigo_hash.substring(0, 16)}...` : '-',
      };
    });
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
        initialValues={{
          fecha_inicio: filters.fecha_inicio ? dayjs(filters.fecha_inicio, 'DD-MM-YYYY') : undefined,
          fecha_fin: filters.fecha_fin ? dayjs(filters.fecha_fin, 'DD-MM-YYYY') : undefined,
        }}
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
          onSend={(record) => handleEnviar(record as any)}
          onApprove={(record) => handleAprobar(record as any)}
          canEdit={canEdit}
          canSend={canSend}
          getEstado={(record) => record.nube_status_web as string}
          getError={(record) => record.error_mensaje as string}
          onDownloadPdf={handleDownloadPdf}
          onDownloadXml={handleDownloadXml}
          onDownloadCdr={handleDownloadCdr}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total,
            onChange: (page, pageSize) => setPagination({ page, page_size: pageSize }),
          }}
          onViewHistory={(record) => setHistoryModal({ open: true, record: record as any })}
        />
      </Card>

      {historyModal.record && (
        <ChangesModal
          open={historyModal.open}
          onClose={() => setHistoryModal({ open: false, record: null })}
          tabla="WH_Transaction"
          registroId={historyModal.record.Transaction}
          showApprove={historyModal.record.necesita_aprobacion}
          onApprove={() => {
            handleAprobar(historyModal.record!);
            setHistoryModal({ open: false, record: null });
          }}
          onReject={() => {
            handleRechazar(historyModal.record!);
            setHistoryModal({ open: false, record: null });
          }}
        />
      )}
    </div>
  );
}
