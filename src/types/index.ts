// Tipos para documentos y respuestas de la API

export type EstadoDocumento = 
  | 'pendiente' 
  | 'enviado_nubefact' 
  | 'aceptado' 
  | 'aceptado_observaciones' 
  | 'rechazado' 
  | 'error';

export interface ResponseBase<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  page_size: number;
  total?: number;
}

export interface FilterParams {
  fecha_inicio?: string;
  fecha_fin?: string;
  serie?: string;
  numero?: string;
  estado?: EstadoDocumento;
  ruc_cliente?: string;
  tipo_documento?: string;
}

// ==================== VENTAS ====================

export interface DocumentoVenta {
  Document: string;
  DocumentSerie: string;
  DocumentNo: string;
  DocumentType: string;
  VendorRUC: string;
  VendorName: string;
  VendorAddress: string;
  VendorEmail?: string;
  DocumentDate: number;
  DueDate?: number;
  DocumentCurrency: string;
  ExchangeRate?: number;
  AmountNetLo: number;
  AmountTaxLo: number;
  AmountTotalLo: number;
  AmountNoImponibleLo?: number;
  fe?: string;
  Status?: string;
}

export interface DocumentoVentaDetalle {
  Line: number;
  ItemCode: string;
  Description: string;
  Quantity: number;
  Unit: string;
  Price: number;
  PriceTax: number;
  SubTotal: number;
  Total: number;
  TotalTaxLo: number;
}

export interface DocumentoVentaComplete {
  cabecera: DocumentoVenta;
  detalles: DocumentoVentaDetalle[];
  respuesta_nubefact?: RespuestaNubeFact;
}

// ==================== RETENCIONES ====================

export interface Retencion {
  Id: number;
  Serie: string;
  Numero: string;
  VendorRuc: string;
  VendorName: string;
  VendorAddress: string;
  DocumentDate: number;
  Tasa: number;
  TotalRetenido: number;
  TotalPagado: number;
  Obs?: string;
  status?: string;
}

export interface RetencionDetalle {
  ID: number;
  DRserie: string;
  DRnumero: string;
  DRfecha: number;
  DRmoneda: string;
  DRtotal: number;
  DRpagoFecha: number;
  Retenido: number;
  Pagado: number;
}

export interface RetencionComplete {
  cabecera: Retencion;
  detalles: RetencionDetalle[];
  estado_sunat?: EstadoSunatRetencion;
}

export interface EstadoSunatRetencion {
  Status: string;
  Pdf?: string;
  Xml?: string;
  Cdr?: string;
  Descripcion?: string;
}

// ==================== GUÍAS ====================

export interface GuiaRemision {
  Transaction: string;
  DocumentSerie: string;
  DocumentNo: string;
  TransactionDate: number;
  TargetPersonRUC: string;
  TargetPersonName: string;
  TargetAddress: string;
  MotivoTraslado: string;
  PesoBruto: number;
  RucTransportista: string;
  Transportista: string;
  VehicleID: string;
  Driver: string;
  LicenciaConducir: string;
  origenaddress: string;
  ubigeo_des: string;
  envio_nube?: string;
  Status?: string;
  Comments?: string;
}

export interface GuiaRemisionDetalle {
  Line: number;
  ItemCode: string;
  ItemDescription: string;
  Quantity: number;
  Unit: string;
}

export interface GuiaRemisionComplete {
  cabecera: GuiaRemision;
  detalles: GuiaRemisionDetalle[];
}

// ==================== NUBEFACT ====================

export interface RespuestaNubeFact {
  enlace?: string;
  aceptada_por_sunat?: string;
  sunat_description?: string;
  sunat_note?: string;
  sunat_responsecode?: string;
  sunat_soap_error?: string;
  pdf_zip_base64?: string;
  xml_zip_base64?: string;
  cdr_zip_base64?: string;
  codigo_hash_qr?: string;
  codigo_hash?: string;
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  ventas: {
    total: number;
    enviadas: number;
    pendientes: number;
    error: number;
  };
  retenciones: {
    total: number;
    enviadas: number;
    pendientes: number;
  };
  guias: {
    total: number;
    aceptadas: number;
    pendientes: number;
  };
}

export interface EstadoInfo {
  codigo: EstadoDocumento;
  descripcion: string;
  color: string;
  puede_editar: boolean;
}

export interface TipoDocumento {
  codigo: string;
  descripcion: string;
  tipo_sunat: number | string;
}

export interface MotivoTraslado {
  codigo: string;
  descripcion: string;
}

// ==================== COLUMNAS DE TABLA ====================

export interface ColumnConfig {
  key: string;
  title: string;
  visible: boolean;
  required?: boolean;
  width?: number;
}
