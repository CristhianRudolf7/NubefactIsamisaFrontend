import { Button, Dropdown, Checkbox, Divider } from 'antd';
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ColumnConfig } from '../../types';

interface ColumnSelectorProps {
  columns: ColumnConfig[];
  onToggle: (key: string) => void;
  onReset: () => void;
  hiddenCount: number;
}

export default function ColumnSelector({
  columns,
  onToggle,
  onReset,
  hiddenCount,
}: ColumnSelectorProps) {
  const optionalColumns = columns.filter((col) => !col.required);

  const dropdownContent = (
    <div
      style={{
        padding: '12px 16px',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        minWidth: 200,
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600, color: '#666' }}>
        Columnas visibles
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {optionalColumns.map((col) => (
          <Checkbox
            key={col.key}
            checked={col.visible}
            onChange={() => onToggle(col.key)}
          >
            {col.title}
          </Checkbox>
        ))}
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <Button
        type="text"
        size="small"
        icon={<ReloadOutlined />}
        onClick={onReset}
        style={{ padding: 0 }}
      >
        Restaurar por defecto
      </Button>
    </div>
  );

  const menuItems: MenuProps['items'] = [
    {
      key: 'content',
      label: dropdownContent,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      trigger={['click']}
      placement="bottomRight"
      popupRender={() => dropdownContent}
    >
      <Button icon={<SettingOutlined />} size="small">
        Columnas
        {hiddenCount > 0 && (
          <span style={{ marginLeft: 4, color: '#999', fontSize: 11 }}>
            ({hiddenCount} ocultas)
          </span>
        )}
      </Button>
    </Dropdown>
  );
}
