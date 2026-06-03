import { useState, useMemo } from 'react';
import { Typography, Card, App, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/common/DataTable';
import FilterPanel from '../../components/common/FilterPanel';
import StatusBadge from '../../components/common/StatusBadge';
import ColumnSelector from '../../components/common/ColumnSelector';
import ChangesModal from '../../components/common/ChangesModal';
import { useVentas, useEnviarVenta, useAprobarVenta, useRechazarVenta } from '../../hooks/useVentas';
import { useColumnVisibility } from '../../hooks/useColumnVisibility';
import { ventasService } from '../../services/ventasService';
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
  const [historyModal, setHistoryModal] = useState<{ open: boolean; record: DocumentoVenta | null }>({
    open: false,
    record: null,
  });

  const { data, isLoading, refetch } = useVentas({ ...filters, ...pagination });
  const enviarMutation = useEnviarVenta();
  const aprobarMutation = useAprobarVenta();
  const rechazarMutation = useRechazarVenta();

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

  const handleAprobar = async (record: DocumentoVenta) => {
    try {
      const result = await aprobarMutation.mutateAsync({
        documentId: record.Document,
        usuario,
      });
      if (result.success) {
        message.success('Documento aprobado correctamente');
        refetch();
      } else {
        message.error(result.message || 'Error al aprobar documento');
      }
    } catch {
      message.error('Error al aprobar documento');
    }
  };

  const handleRechazar = async (record: DocumentoVenta) => {
    try {
      const result = await rechazarMutation.mutateAsync({
        documentId: record.Document,
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
    return ['pendiente', '', undefined].includes(estado) || canEdit(record);
  };

  const handleDownloadPdf = async (record: Record<string, unknown>) => {
    const result = await ventasService.descargarPdf(record.Document as string);
    if (result.success && result.blob) {
      const url = window.URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${record.DocumentSerie || record.Document}-${record.DocumentNo || ''}.pdf`;
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
    window.open(`${baseUrl}/ventas/${record.Document}/xml`, '_blank');
  };

  const handleDownloadCdr = (record: Record<string, unknown>) => {
    const baseUrl = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;
    window.open(`${baseUrl}/ventas/${record.Document}/cdr`, '_blank');
  };

  const tableData = useMemo(() => {
    return ventas.map((v) => {
      const rawDate = v.DocumentDate;
      let fechaFormateada = '-';
      
      if (typeof rawDate === 'number') {
        fechaFormateada = formatExcelDate(rawDate);
      } else if (typeof rawDate === 'string' && rawDate) {
        // Si es ISO string "2025-09-24...", tomar solo la parte de la fecha
        const datePart = rawDate.split('T')[0];
        const [year, month, day] = datePart.split('-');
        fechaFormateada = `${day}-${month}-${year}`;
      }

      return {
        ...v,
        key: v.Document,
        tipoDocumento: v.DocumentType?.replace('LIMADSAS', '') || '-',
        serieNumero: formatSerieNumero(v.DocumentSerie, v.DocumentNo),
        fechaEmision: fechaFormateada,
        cliente: `${v.VendorRUC} - ${v.VendorName}`,
        monto: formatCurrency(v.AmountTotalLo, v.DocumentCurrency === 'LO' ? 'S/' : '$'),
        estado: (
          <Space orientation="vertical" size={0}>
            <StatusBadge estado={v.nube_status_web} />
            {v.necesita_aprobacion && <Tag color="blue" style={{ fontSize: '10px', marginTop: 4 }}>POR APROBAR</Tag>}
          </Space>
        ),
        hash: v.codigo_hash ? `${v.codigo_hash.substring(0, 16)}...` : '-',
      };
    });
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
          onSend={(record) => handleEnviar(record as any)}
          onApprove={(record) => handleAprobar(record as any)}
          canEdit={canEdit}
          canSend={canSend}
          getEstado={(record) => record.nube_status_web as string}
          getError={(record) => record.error_mensaje as string}
          showDownload={(record) => !!record.codigo_hash}
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
          tabla="AR_Document"
          registroId={historyModal.record.Document}
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
