import { useState, useEffect, useCallback } from 'react';
import type { ColumnConfig } from '../types';

export function useColumnVisibility(
  tableName: string,
  defaultColumns: ColumnConfig[]
) {
  const storageKey = `table_columns_${tableName}`;

  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const savedColumns = JSON.parse(saved);
      // Merge saved visibility with default columns
      return defaultColumns.map((col) => {
        const savedCol = savedColumns.find((sc: ColumnConfig) => sc.key === col.key);
        return savedCol ? { ...col, visible: savedCol.visible } : col;
      });
    }
    return defaultColumns;
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(columns));
  }, [columns, storageKey]);

  const toggleColumn = useCallback((key: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key && !col.required ? { ...col, visible: !col.visible } : col
      )
    );
  }, []);

  const setVisible = useCallback((key: string, visible: boolean) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key && !col.required ? { ...col, visible } : col
      )
    );
  }, []);

  const resetToDefault = useCallback(() => {
    setColumns(defaultColumns);
  }, [defaultColumns]);

  const visibleColumns = columns.filter((col) => col.visible);
  const hiddenCount = columns.filter((col) => !col.visible && !col.required).length;

  return {
    columns,
    visibleColumns,
    hiddenCount,
    toggleColumn,
    setVisible,
    resetToDefault,
  };
}
