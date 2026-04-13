import { Table, Button, Tooltip, Popconfirm } from 'antd';
import { EditOutlined, SendOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import type { TableProps, TableColumnsType } from 'antd';
import type { ColumnConfig } from '../../types';
import ColumnSelector from './ColumnSelector';

interface DataTableProps<T> {
  data: T[];
  loading?: boolean;
  columns: ColumnConfig[];
  visibleColumns: ColumnConfig[];
  onToggleColumn: (key: string) => void;
  onResetColumns: () => void;
  hiddenCount: number;
  rowKey: string;
  onRowClick?: (record: T) => void;
  onEdit?: (record: T) => void;
  onSend?: (record: T) => void;
  onView?: (record: T) => void;
  onDownloadPdf?: (record: T) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  canEdit?: (record: T) => boolean;
  canSend?: (record: T) => boolean;
  getEstado?: (record: T) => string;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  loading,
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
  hiddenCount,
  rowKey,
  onRowClick,
  onEdit,
  onSend,
  onView,
  onDownloadPdf,
  pagination,
  canEdit,
  canSend,
  getEstado,
}: DataTableProps<T>) {
  const buildColumns = (): TableColumnsType<T> => {
    return visibleColumns.map((col) => {
      if (col.key === 'acciones') {
        return {
          key: 'acciones',
          title: (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Acciones</span>
              <ColumnSelector
                columns={columns}
                onToggle={onToggleColumn}
                onReset={onResetColumns}
                hiddenCount={hiddenCount}
              />
            </div>
          ),
          width: col.width,
          fixed: 'right' as const,
          render: (_: unknown, record: T) => {
            const estado = getEstado?.(record) || '';
            const showEdit = canEdit?.(record) ?? false;
            const showSend = canSend?.(record) ?? false;

            return (
              <div className="table-actions">
                {showSend && (
                  <Popconfirm
                    title="¿Enviar a NubeFact?"
                    description="Se enviará el documento a SUNAT"
                    onConfirm={() => onSend?.(record)}
                    okText="Sí, enviar"
                    cancelText="Cancelar"
                  >
                    <Tooltip title="Enviar a NubeFact">
                      <Button
                        type="primary"
                        size="small"
                        icon={<SendOutlined />}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
                {showEdit && (
                  <Tooltip title="Editar">
                    <Button
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => onEdit?.(record)}
                    />
                  </Tooltip>
                )}
                <Tooltip title="Ver detalle">
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => onView?.(record)}
                  />
                </Tooltip>
                {estado !== 'pendiente' && estado !== 'error' && (
                  <Tooltip title="Descargar PDF">
                    <Button
                      size="small"
                      icon={<FilePdfOutlined />}
                      onClick={() => onDownloadPdf?.(record)}
                    />
                  </Tooltip>
                )}
              </div>
            );
          },
        };
      }

      if (col.key === 'selection') {
        return {
          key: 'selection',
          width: col.width,
          render: () => null, // Checkbox de selección
        };
      }

      return {
        key: col.key,
        title: col.title,
        width: col.width,
        ellipsis: true,
      };
    });
  };

  const tableProps: TableProps<T> = {
    dataSource: data,
    columns: buildColumns(),
    rowKey: rowKey as keyof T,
    loading,
    size: 'small',
    pagination: pagination
      ? {
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} registros`,
          onChange: pagination.onChange,
        }
      : false,
    scroll: { x: 'max-content' },
    onRow: (record) => ({
      onClick: () => onRowClick?.(record),
      style: { cursor: onRowClick ? 'pointer' : 'default' },
    }),
  };

  return <Table {...tableProps} />;
}
