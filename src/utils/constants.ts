import type { ColumnConfig } from '../types';

// Intervalo de polling para actualización automática (en milisegundos)
// Se lee de variable de entorno VITE_POLLING_INTERVAL (en segundos), default 5 segundos
export const POLLING_INTERVAL = (Number(import.meta.env.VITE_POLLING_INTERVAL) || 5) * 1000;

// Columnas por defecto para tabla de ventas
export const VENTAS_COLUMNS: ColumnConfig[] = [
  { key: 'selection', title: '', visible: true, required: true, width: 40 },
  { key: 'tipoDocumento', title: 'Tipo', visible: true, width: 100 },
  { key: 'serieNumero', title: 'Serie-Número', visible: true, width: 120 },
  { key: 'fechaEmision', title: 'Fecha Emisión', visible: true, width: 110 },
  { key: 'cliente', title: 'Cliente', visible: true, width: 200 },
  { key: 'monto', title: 'Monto Total', visible: true, width: 100 },
  { key: 'estado', title: 'Estado', visible: true, width: 100 },
  { key: 'hash', title: 'Hash', visible: false, width: 150 },
  { key: 'usuarioEnvio', title: 'Usuario Envío', visible: false, width: 120 },
  { key: 'fechaEnvio', title: 'Fecha Envío', visible: false, width: 110 },
  { key: 'acciones', title: 'Acciones', visible: true, required: true, width: 80 },
];

// Columnas por defecto para tabla de retenciones
export const RETENCIONES_COLUMNS: ColumnConfig[] = [
  { key: 'selection', title: '', visible: true, required: true, width: 40 },
  { key: 'serieNumero', title: 'Serie-Número', visible: true, width: 120 },
  { key: 'fechaEmision', title: 'Fecha Emisión', visible: true, width: 110 },
  { key: 'proveedor', title: 'Proveedor', visible: true, width: 200 },
  { key: 'tasa', title: 'Tasa', visible: true, width: 80 },
  { key: 'totalRetenido', title: 'Total Retenido', visible: true, width: 120 },
  { key: 'totalPagado', title: 'Total Pagado', visible: true, width: 120 },
  { key: 'estado', title: 'Estado', visible: true, width: 100 },
  { key: 'acciones', title: 'Acciones', visible: true, required: true, width: 120 },
];

// Columnas por defecto para tabla de guías
export const GUIAS_COLUMNS: ColumnConfig[] = [
  { key: 'selection', title: '', visible: true, required: true, width: 40 },
  { key: 'serieNumero', title: 'Serie-Número', visible: true, width: 120 },
  { key: 'fechaTraslado', title: 'Fecha Traslado', visible: true, width: 110 },
  { key: 'destinatario', title: 'Destinatario', visible: true, width: 200 },
  { key: 'motivoTraslado', title: 'Motivo', visible: true, width: 150 },
  { key: 'pesoBruto', title: 'Peso Bruto', visible: true, width: 100 },
  { key: 'estado', title: 'Estado', visible: true, width: 100 },
  { key: 'transportista', title: 'Transportista', visible: false, width: 150 },
  { key: 'acciones', title: 'Acciones', visible: true, required: true, width: 120 },
];

// Estados posibles
export const ESTADOS_DOCUMENTO = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'enviado_nubefact', label: 'Enviado a NubeFact' },
  { value: 'aceptado', label: 'Aceptado por SUNAT' },
  { value: 'aceptado_observaciones', label: 'Aceptado con observaciones' },
  { value: 'rechazado', label: 'Rechazado' },
  { value: 'error', label: 'Error' },
];

// Tipos de documento de venta
export const TIPOS_DOCUMENTO_VENTA = [
  { value: 'LIMADSASFACTURA', label: 'Factura' },
  { value: 'LIMADSASBOLETA', label: 'Boleta' },
  { value: 'LIMADSASCREDITO', label: 'Nota de Crédito' },
  { value: 'LIMADSASDEBITO', label: 'Nota de Débito' },
];

// Monedas
export const MONEDAS = [
  { value: 'LO', label: 'Soles (S/)' },
  { value: 'EX', label: 'Dólares ($)' },
];
