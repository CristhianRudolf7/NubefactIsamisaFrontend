import dayjs from 'dayjs';
import 'dayjs/locale/es';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configurar plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es');

// Formatea fecha con hora de Perú
export function formatDateTime(date: string | Date | undefined | null, format: string = 'DD/MM/YYYY HH:mm:ss'): string {
  if (!date) return '-';
  return dayjs(date).tz('America/Lima').format(format);
}

export function formatDate(date: string | Date | undefined | null, format: string = 'DD/MM/YYYY'): string {
  if (!date) return '-';
  return dayjs(date).tz('America/Lima').format(format);
}

// Obtiene fecha actual en Perú
export function nowPeru(): dayjs.Dayjs {
  return dayjs().tz('America/Lima');
}

// Convierte fecha de Excel (número) o string ISO/legible a formato legible
export function formatExcelDate(excelDate: number | string | undefined | null, format: string = 'DD/MM/YYYY'): string {
  if (!excelDate) return '-';
  
  if (typeof excelDate === 'number') {
    // Excel fecha base: 30/12/1899
    const baseDate = dayjs('1899-12-30');
    const date = baseDate.add(excelDate, 'day');
    return date.format(format);
  }
  
  // Si ya es un string (formato ISO retornado por el backend)
  const date = dayjs(excelDate);
  if (!date.isValid()) return '-';
  return date.format(format);
}

// Formatea monto con símbolo de moneda
export function formatCurrency(amount: number | undefined | null, currency: string = 'S/'): string {
  if (amount === undefined || amount === null) return '-';
  
  return `${currency} ${amount.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// Formatea número con separador de miles
export function formatNumber(num: number | undefined | null, decimals: number = 0): string {
  if (num === undefined || num === null) return '-';
  
  return num.toLocaleString('es-PE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// Formatea RUC o DNI
export function formatDocumentNumber(doc: string | undefined | null): string {
  if (!doc) return '-';
  
  if (doc.length === 11) {
    // RUC: 20 602 67448 8
    return `${doc.slice(0, 2)} ${doc.slice(2, 5)} ${doc.slice(5, 10)} ${doc.slice(10)}`;
  } else if (doc.length === 8) {
    // DNI: 12 345 678
    return `${doc.slice(0, 2)} ${doc.slice(2, 5)} ${doc.slice(5)}`;
  }
  
  return doc;
}

// Formatea serie y número de documento
export function formatSerieNumero(serie: string, numero: string): string {
  if (!serie && !numero) return '-';
  return `${serie}-${numero}`;
}

// Obtiene clase CSS según estado
export function getEstadoClass(estado: string | undefined): string {
  if (!estado) return 'status-pending';
  
  const estadoLower = estado.toLowerCase();
  
  if (estadoLower.includes('aceptado') && !estadoLower.includes('observacion')) {
    return 'status-accepted';
  } else if (estadoLower.includes('aceptado') && estadoLower.includes('observacion')) {
    return 'status-pending';
  } else if (estadoLower.includes('rechazado')) {
    return 'status-rejected';
  } else if (estadoLower.includes('enviado')) {
    return 'status-sent';
  } else if (estadoLower.includes('error')) {
    return 'status-error';
  } else if (estadoLower.includes('anulado')) {
    return 'status-rejected';
  }
  
  return 'status-pending';
}

// Obtiene color según estado
export function getEstadoColor(estado: string | undefined): string {
  const colorMap: Record<string, string> = {
    pendiente: '#faad14',
    enviado_nubefact: '#52c41a',
    enviado: '#52c41a',
    aceptado: '#52c41a',
    aceptada: '#52c41a',
    aceptado_observaciones: '#faad14',
    rechazado: '#ff4d4f',
    rechazada: '#ff4d4f',
    error: '#ff4d4f',
    anulado: '#faad14',
  };

  return colorMap[estado?.toLowerCase() || 'pendiente'] || '#faad14';
}
