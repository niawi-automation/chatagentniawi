import * as XLSX from 'xlsx';

// Columnas fijas para WIP en el orden solicitado
export const WIP_COLUMNS: string[] = [
  'BuyerName',
  'PWN No',
  'PONo',
  'ArticleCode',
  'ArticleDesc',
  'BuyerStyleRef',
  'Delivery Date',
  'ColorCode',
  'ColorName',
  'SizeCode',
  'POQty',
  'ProcessName',
  'CurrentQty',
  'BalanceQty',
  'StartProcess',
  'ActualStartDate',
  'ReasonDesc',
  'EndProcess',
  'ActualEndDate'
];

// Columnas fijas para Packing List en el orden solicitado
export const PACKING_LIST_COLUMNS: string[] = [
  'BuyerName',
  'FactoryName',
  'UserName',
  'BuyerERPCode',
  'FactoryERPCode',
  'BuyerPO',
  'PONumberEDI',
  'DestinationCode',
  'Style',
  'DC',
  'Address',
  'City',
  'State',
  'PostalCode',
  'Country',
  'CartonsQty',
  'CartonLength',
  'CartonWidth',
  'CartonHeight',
  'CartonNetWg',
  'CartonGrossWg',
  'NroPacking',
  'ColorName',
  'Size',
  'ShippedQty'
];

// Mapeo de campos del webhook a columnas de exportación para WIP
const WIP_FIELD_MAPPING: Record<string, string> = {
  'buyer_name': 'BuyerName',
  'pwn_no': 'PWN No',
  'po_no': 'PONo',
  'article_code': 'ArticleCode',
  'article_desc': 'ArticleDesc',
  'buyer_style_ref': 'BuyerStyleRef',
  'delivery_date': 'Delivery Date',
  'color_code': 'ColorCode',
  'color_name': 'ColorName',
  'size_code': 'SizeCode',
  'po_qty': 'POQty',
  'process_name': 'ProcessName',
  'current_qty': 'CurrentQty',
  'balance_qty': 'BalanceQty',
  'start_process': 'StartProcess',
  'actual_start_date': 'ActualStartDate',
  'reason_desc': 'ReasonDesc',
  'end_process': 'EndProcess',
  'actual_end_date': 'ActualEndDate'
};

// Mapeo de campos del webhook a columnas de exportación para Packing List
// Los datos ya vienen transformados desde PackingListResultsTable, así que usamos mapeo directo
const PACKING_LIST_FIELD_MAPPING: Record<string, string> = {
  'BuyerName': 'BuyerName',
  'FactoryName': 'FactoryName',
  'UserName': 'UserName',
  'BuyerERPCode': 'BuyerERPCode',
  'FactoryERPCode': 'FactoryERPCode',
  'BuyerPO': 'BuyerPO',
  'PONumberEDI': 'PONumberEDI',
  'DestinationCode': 'DestinationCode',
  'Style': 'Style',
  'DC': 'DC',
  'Address': 'Address',
  'City': 'City',
  'State': 'State',
  'PostalCode': 'PostalCode',
  'Country': 'Country',
  'CartonsQty': 'CartonsQty',
  'CartonLength': 'CartonLength',
  'CartonWidth': 'CartonWidth',
  'CartonHeight': 'CartonHeight',
  'CartonNetWg': 'CartonNetWg',
  'CartonGrossWg': 'CartonGrossWg',
  'NroPacking': 'NroPacking',
  'ColorName': 'ColorName',
  'Size': 'Size',
  'ShippedQty': 'ShippedQty'
};

/**
 * Exporta a XLSX con columnas fijas para WIP.
 * Cualquier columna ausente en los datos se rellena con ''.
 */
export function exportWipToXlsx(rows: Array<Record<string, any>>, fileName = 'WIP_procesado.xlsx') {
  if (!Array.isArray(rows) || rows.length === 0) return;

  const normalized = rows.map((row) => {
    const output: Record<string, any> = {};
    
    // Mapear campos del webhook a columnas de exportación
    for (const [webhookField, exportColumn] of Object.entries(WIP_FIELD_MAPPING)) {
      output[exportColumn] = row[webhookField] ?? '';
    }
    
    // Asegurar que todas las columnas estén presentes
    for (const col of WIP_COLUMNS) {
      if (!(col in output)) {
        output[col] = '';
      }
    }
    
    return output;
  });

  const worksheet = XLSX.utils.json_to_sheet(normalized, { header: WIP_COLUMNS });

  // Ajuste simple de ancho de columnas basado en longitud de header
  const colWidths = WIP_COLUMNS.map((h) => ({ wch: Math.max(12, String(h).length + 2) }));
  (worksheet as any)['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WIP');
  XLSX.writeFile(workbook, fileName);
}

/**
 * Exporta a XLSX con columnas fijas para Packing List.
 * Los datos ya vienen transformados desde PackingListResultsTable.
 */
export function exportPackingListToXlsx(rows: Array<Record<string, any>>, fileName = 'PACKING_LIST_procesado.xlsx') {
  if (!Array.isArray(rows) || rows.length === 0) {
    console.warn('No hay datos para exportar a Excel');
    return;
  }

  console.log('📊 Datos recibidos para exportación:', rows.length, 'registros');
  console.log('📊 Primer registro de ejemplo:', rows[0]);

  const normalized = rows.map((row) => {
    const output: Record<string, any> = {};
    
    // Los datos ya vienen con los nombres correctos de columnas desde PackingListResultsTable
    // Solo necesitamos asegurar que todas las columnas estén presentes
    for (const col of PACKING_LIST_COLUMNS) {
      output[col] = row[col] ?? '';
    }
    
    return output;
  });

  console.log('📊 Datos normalizados para Excel:', normalized.length, 'registros');
  console.log('📊 Primer registro normalizado:', normalized[0]);

  const worksheet = XLSX.utils.json_to_sheet(normalized, { header: PACKING_LIST_COLUMNS });

  // Ajuste simple de ancho de columnas basado en longitud de header
  const colWidths = PACKING_LIST_COLUMNS.map((h) => ({ wch: Math.max(12, String(h).length + 2) }));
  (worksheet as any)['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PackingList');
  
  console.log('📥 Iniciando descarga de Excel:', fileName);
  XLSX.writeFile(workbook, fileName);
  console.log('✅ Excel descargado exitosamente');
}



