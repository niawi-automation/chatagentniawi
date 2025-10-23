// Tipos para el módulo de Automatizaciones

export type ProcessType = 'WIP' | 'PO_BUYS' | 'PACKING_LIST';

export type ProcessStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface AutomationProcess {
  id: string;
  type: ProcessType;
  fileName: string;
  fileSize: number;
  status: ProcessStatus;
  uploadedAt: string;
  processedAt?: string;
  userId: string;
  userName: string;
  results?: ProcessResults;
  error?: string;
}

export interface ProcessResults {
  success: boolean;
  data: Array<Record<string, any>>;
  fileUrl?: string;
  message?: string;
  processedAt: string;
  recordCount?: number;
}

// Nuevo tipo para el formato WIP con records directamente
export interface WipWebhookResponse {
  records: Array<WipRecord>;
}

export interface WipRecord {
  buyer_name: string | null;
  pwn_no: number;
  po_no: string;
  article_code: string;
  article_desc: string | null;
  buyer_style_ref: string | null;
  delivery_date: string | null;
  color_code: string | null;
  color_name: string;
  size_code: string | null;
  po_qty: number;
  process_name: string;
  current_qty: number;
  balance_qty: number;
  start_process: string | null;
  actual_start_date: string | null;
  reason_desc: string;
  end_process: string | null;
  actual_end_date: string | null;
}

export interface ProcessTypeConfig {
  id: ProcessType;
  label: string;
  description: string;
  icon: string;
  webhookUrl: string;
  acceptedFileTypes: string[];
  maxFileSize: number; // en MB
}

export interface AutomationStats {
  totalProcesses: number;
  successfulProcesses: number;
  failedProcesses: number;
  pendingProcesses: number;
}

export interface ProcessHistoryFilters {
  type?: ProcessType;
  status?: ProcessStatus;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

// Respuesta de la API para procesamiento
export interface ProcessFileResponse {
  success: boolean;
  data?: ProcessResults;
  error?: string;
  processId: string;
}

// Tipos para Packing List
export interface PackingListWebhookResponse {
  index: number;
  message: {
    role: string;
    content: PackingListContent;
  };
}

export interface PackingListContent {
  buyerName: string | null;
  factoryName: string | null;
  userName: string | null;
  buyerERPCode: string | null;
  factoryERPCode: string | null;
  buyerPONumber: string;
  PONumberEDI: string | null;
  packs: PackingListPack[];
}

export interface PackingListPack {
  destinationCode: string;
  style: string;
  DC: string;
  Address: string;
  City: string;
  PostalCode: string;
  State: string;
  Country: string;
  CartonsQty: number;
  CartonLength: number;
  CartonWidth: number;
  CartonHeight: number;
  CartonNetWg: number;
  CartonGrossWg: number;
  nroPacking: number;
  sizeDetail: PackingListSizeDetail[];
}

export interface PackingListSizeDetail {
  ColorName: string;
  Size: string;
  ShippedQty: number;
}

// Registro aplanado para tabla/Excel
export interface PackingListRecord {
  BuyerName: string | null;
  FactoryName: string | null;
  UserName: string | null;
  BuyerERPCode: string | null;
  FactoryERPCode: string | null;
  BuyerPO: string;
  PONumberEDI: string | null;
  DestinationCode: string;
  Style: string;
  DC: string;
  Address: string;
  City: string;
  State: string;
  PostalCode: string;
  Country: string;
  CartonsQty: number;
  CartonLength: number;
  CartonWidth: number;
  CartonHeight: number;
  CartonNetWg: number;
  CartonGrossWg: number;
  NroPacking: number;
  ColorName: string;
  Size: string;
  ShippedQty: number;
}

// Estado local del componente
export interface AutomationState {
  selectedFile: File | null;
  selectedProcessType: ProcessType | null;
  isProcessing: boolean;
  currentResults: ProcessResults | null;
  error: string | null;
}

