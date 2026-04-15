import { Table, Button, Tooltip, Popconfirm, Modal, App, Dropdown } from 'antd';
import { EditOutlined, SendOutlined, EyeOutlined, FilePdfOutlined, ExclamationCircleOutlined, CopyOutlined, DownloadOutlined, FileTextOutlined, FileZipOutlined, DownOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { TableProps, TableColumnsType } from 'antd';
import type { ColumnConfig } from '../../types';

interface DataTableProps<T> {
  data: T[];
  loading?: boolean;
  visibleColumns: ColumnConfig[];
  rowKey: string;
  onRowClick?: (record: T) => void;
  onEdit?: (record: T) => void;
  onSend?: (record: T) => void;
  onView?: (record: T) => void;
  onDownloadPdf?: (record: T) => void;
  onDownloadXml?: (record: T) => void;
  onDownloadCdr?: (record: T) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  canEdit?: (record: T) => boolean;
  canSend?: (record: T) => boolean;
  getEstado?: (record: T) => string;
  getError?: (record: T) => string | undefined;
}

export default function DataTable<T extends Record<string, unknown>>({
  data,
  loading,
  visibleColumns,
  rowKey,
  onRowClick,
  onEdit,
  onSend,
  onView,
  onDownloadPdf,
  onDownloadXml,
  onDownloadCdr,
  pagination,
  canEdit,
  canSend,
  getEstado,
  getError,
}: DataTableProps<T>) {
  const { message } = App.useApp();
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [currentError, setCurrentError] = useState<string>('');

  const handleCopyError = () => {
    navigator.clipboard.writeText(currentError);
    message.success('Error copiado al portapapeles');
  };
  const buildColumns = (): TableColumnsType<T> => {
    return visibleColumns.map((col) => {
      if (col.key === 'acciones') {
        return {
          key: 'acciones',
          title: 'Acciones',
          width: col.width,
          fixed: 'right' as const,
          render: (_: unknown, record: T) => {
            const estado = getEstado?.(record) || '';
            const showEdit = canEdit?.(record) ?? false;
            const showSend = canSend?.(record) ?? false;

            const errorMsg = getError?.(record);
            const estadoLower = estado.toLowerCase();
            const showErrorBtn = estadoLower === 'error' || estadoLower === 'rechazado';

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
                {showErrorBtn && errorMsg && (
                  <Tooltip title="Ver error">
                    <Button
                      size="small"
                      danger
                      icon={<ExclamationCircleOutlined />}
                      onClick={() => {
                        setCurrentError(errorMsg);
                        setErrorModalVisible(true);
                      }}
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
                {estadoLower && estadoLower !== 'pendiente' && estadoLower !== 'error' && estadoLower !== 'rechazado' && (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'pdf',
                          label: 'Descargar PDF',
                          icon: <FilePdfOutlined />,
                          onClick: () => onDownloadPdf?.(record),
                        },
                        {
                          key: 'xml',
                          label: 'Descargar XML',
                          icon: <FileTextOutlined />,
                          onClick: () => onDownloadXml?.(record),
                        },
                        {
                          key: 'cdr',
                          label: 'Descargar CDR',
                          icon: <FileZipOutlined />,
                          onClick: () => onDownloadCdr?.(record),
                        },
                      ]
                    }}
                  >
                    <Button size="small" icon={<DownloadOutlined />}>
                      <DownOutlined />
                    </Button>
                  </Dropdown>
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
        dataIndex: col.key,
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

  return (
    <>
      <Table {...tableProps} />
      <Modal
        title={
          <span>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
            Error del documento
          </span>
        }
        open={errorModalVisible}
        onCancel={() => setErrorModalVisible(false)}
        footer={[
          <Button key="copy" icon={<CopyOutlined />} onClick={handleCopyError}>
            Copiar error
          </Button>,
          <Button key="close" onClick={() => setErrorModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={600}
      >
        <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {currentError}
        </div>
      </Modal>
    </>
  );
}
