import { ProcessType, ProcessFileResponse, ProcessResults, AutomationProcess, WipWebhookResponse, PackingListRecord } from '@/types/automations';

// Configuración de tipos de proceso
export const PROCESS_TYPES_CONFIG = {
  WIP: {
    id: 'WIP' as ProcessType,
    label: 'Work in Progress',
    description: 'Procesamiento de documentos de trabajo en progreso',
    webhookUrl: import.meta.env.VITE_WEBHOOK_WIP || '',
    acceptedFileTypes: ['.xlsx', '.xls'],
    maxFileSize: 10 // MB
  },
  PO_BUYS: {
    id: 'PO_BUYS' as ProcessType,
    label: 'Purchase Orders',
    description: 'Procesamiento de órdenes de compra',
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_POBUYS || '',
    acceptedFileTypes: ['.xlsx', '.xls'],
    maxFileSize: 10 // MB
  },
  PACKING_LIST: {
    id: 'PACKING_LIST' as ProcessType,
    label: 'Packing List',
    description: 'Procesamiento de listas de empaque',
    webhookUrl: import.meta.env.VITE_WEBHOOK_PACKING_LIST || '',
    acceptedFileTypes: ['.xlsx', '.xls'],
    maxFileSize: 10 // MB
  }
};

// Función para validar archivo antes del envío
export const validateFile = (file: File, processType: ProcessType): { valid: boolean; error?: string } => {
  const config = PROCESS_TYPES_CONFIG[processType];
  
  // Verificar tipo de archivo
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!config.acceptedFileTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `Tipo de archivo no válido. Formatos aceptados: ${config.acceptedFileTypes.join(', ')}`
    };
  }
  
  // Verificar tamaño de archivo
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > config.maxFileSize) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${config.maxFileSize}MB`
    };
  }
  
  return { valid: true };
};

// Función para procesar archivo via webhook N8N
export const processFile = async (
  file: File, 
  processType: ProcessType,
  userId: string,
  userName: string
): Promise<ProcessFileResponse> => {
  try {
    const config = PROCESS_TYPES_CONFIG[processType];
    
    // Validar configuración del webhook
    if (!config.webhookUrl) {
      throw new Error(`URL del webhook para ${processType} no configurada`);
    }
    
    // Validar archivo
    const validation = validateFile(file, processType);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Preparar FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processType', processType);
    formData.append('userId', userId);
    formData.append('userName', userName);
    formData.append('timestamp', new Date().toISOString());
    
    // Llamada al webhook N8N
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type, el navegador lo establece automáticamente con boundary para FormData
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();

    // Caso especial para WIP: nuevos formato con records directamente
    if (processType === 'WIP' && Array.isArray(result)) {
      // Procesar el nuevo formato WIP: [{ records: [...] }]
      const wipData = result as WipWebhookResponse[];
      const allRecords: Array<Record<string, any>> = [];
      
      wipData.forEach((item) => {
        if (item.records && Array.isArray(item.records)) {
          allRecords.push(...item.records);
        }
      });

      if (allRecords.length > 0) {
        const wrapped: ProcessResults = {
          success: true,
          data: allRecords,
          processedAt: new Date().toISOString(),
          recordCount: allRecords.length
        };
        return {
          success: true,
          data: wrapped,
          processId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
    }

    // Caso especial para PACKING_LIST: formato con message.content y packs anidados
    if (processType === 'PACKING_LIST') {
      const flattenedRecords: PackingListRecord[] = [];
      
      // Manejar si es array o objeto único
      const dataArray = Array.isArray(result) ? result : [result];
      
      dataArray.forEach((item: any, index: number) => {
        
        // Verificar si tiene la estructura esperada: { index, message: { role, content } }
        if (item.message?.content?.packs && Array.isArray(item.message.content.packs)) {
          const { 
            buyerName,
            factoryName,
            userName,
            buyerERPCode,
            factoryERPCode,
            buyerPONumber, 
            PONumberEDI 
          } = item.message.content;
          
          item.message.content.packs.forEach((pack: any, packIndex: number) => {
            
            if (pack.sizeDetail && Array.isArray(pack.sizeDetail)) {
              pack.sizeDetail.forEach((sizeDetail: any, sizeIndex: number) => {
                const flattenedRecord: PackingListRecord = {
                  BuyerName: buyerName || '',
                  FactoryName: factoryName || '',
                  UserName: userName || '',
                  BuyerERPCode: buyerERPCode || '',
                  FactoryERPCode: factoryERPCode || '',
                  BuyerPO: buyerPONumber || '',
                  PONumberEDI: PONumberEDI || '',
                  DestinationCode: pack.destinationCode || '',
                  Style: pack.style || '',
                  DC: pack.DC || '',
                  Address: pack.Address || '',
                  City: pack.City || '',
                  State: pack.State || '',
                  PostalCode: pack.PostalCode || '',
                  Country: pack.Country || '',
                  CartonsQty: pack.CartonsQty || 0,
                  CartonLength: pack.CartonLength || 0,
                  CartonWidth: pack.CartonWidth || 0,
                  CartonHeight: pack.CartonHeight || 0,
                  CartonNetWg: pack.CartonNetWg || 0,
                  CartonGrossWg: pack.CartonGrossWg || 0,
                  NroPacking: pack.nroPacking || 0,
                  ColorName: sizeDetail.ColorName || '',
                  Size: sizeDetail.Size || '',
                  ShippedQty: sizeDetail.ShippedQty || 0
                };
                
                flattenedRecords.push(flattenedRecord);
              });
            }
          });
        }
      });

      if (flattenedRecords.length > 0) {
        const wrapped: ProcessResults = {
          success: true,
          data: flattenedRecords,
          processedAt: new Date().toISOString(),
          recordCount: flattenedRecords.length
        };
        return {
          success: true,
          data: wrapped,
          processId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }
    }

    // Caso 1: El webhook devuelve un array (formato genérico)
    if (Array.isArray(result)) {
      // 1a) Nuevo esquema: [{ data: [...] }]
      const first = result[0] as any;
      if (first && typeof first === 'object' && Array.isArray(first.data)) {
        const wrappedFromDataArray: ProcessResults = {
          success: true,
          data: first.data as Array<Record<string, any>>,
          processedAt: new Date().toISOString(),
          recordCount: (first.data as Array<unknown>).length
        };
        return {
          success: true,
          data: wrappedFromDataArray,
          processId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      // 1b) Esquema previo: array directo de filas
      const wrapped: ProcessResults = {
        success: true,
        data: result as Array<Record<string, any>>,
        processedAt: new Date().toISOString(),
        recordCount: (result as Array<unknown>).length
      };
      return {
        success: true,
        data: wrapped,
        processId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    // Caso 2: Objeto con campos esperados
    if (typeof result === 'object' && result !== null) {
      // Si ya trae success/data, lo respetamos
      if ('success' in result || 'data' in result) {
        const candidateData = (result as any).data;
        if (Array.isArray(candidateData)) {
          const wrappedFromObjectData: ProcessResults = {
            success: Boolean((result as any).success ?? true),
            data: candidateData as Array<Record<string, any>>,
            processedAt: new Date().toISOString(),
            recordCount: candidateData.length,
            fileUrl: (result as any).fileUrl,
            message: (result as any).message
          };
          return {
            success: true,
            data: wrappedFromObjectData,
            error: (result as any).error,
            processId: (result as any).processId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
        // Si data no es array, se envuelve el objeto completo como fila única
        const wrappedSingle: ProcessResults = {
          success: Boolean((result as any).success ?? true),
          data: [(result as any)],
          processedAt: new Date().toISOString(),
          recordCount: 1,
          fileUrl: (result as any).fileUrl,
          message: (result as any).message
        };
        return {
          success: true,
          data: wrappedSingle,
          error: (result as any).error,
          processId: (result as any).processId || `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      }

      // Si trae otros campos pero no success/data, lo envolvemos como data
      const wrapped: ProcessResults = {
        success: true,
        data: [result as Record<string, any>],
        processedAt: new Date().toISOString(),
        recordCount: 1
      };
      return {
        success: true,
        data: wrapped,
        processId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    }

    // Caso 3: Formato no reconocido
    throw new Error('Respuesta del servidor en formato inesperado');
    
  } catch (error) {
    console.error('Error procesando archivo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido al procesar el archivo',
      processId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
};

// Función para descargar archivo procesado
export const downloadProcessedFile = async (fileUrl: string, fileName: string): Promise<void> => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error('Error al descargar el archivo');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
    
  } catch (error) {
    console.error('Error descargando archivo:', error);
    throw new Error('No se pudo descargar el archivo procesado');
  }
};

// Función para obtener historial de procesos (mock por ahora)
export const getProcessHistory = async (): Promise<AutomationProcess[]> => {
  // TODO: Implementar llamada real a API cuando esté disponible
  // Por ahora retornamos datos mock
  return [
    {
      id: '1',
      type: 'WIP',
      fileName: 'wip_report_2024.xlsx',
      fileSize: 2048000,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 86400000).toISOString(), // 1 día atrás
      processedAt: new Date(Date.now() - 86350000).toISOString(),
      userId: 'user1',
      userName: 'Usuario Demo',
      results: {
        success: true,
        data: [
          { id: 1, item: 'Producto A', status: 'En proceso', progress: '75%' },
          { id: 2, item: 'Producto B', status: 'Completado', progress: '100%' }
        ],
        fileUrl: 'https://example.com/processed/wip_report_2024_processed.xlsx',
        message: 'Procesamiento exitoso',
        processedAt: new Date(Date.now() - 86350000).toISOString(),
        recordCount: 2
      }
    },
    {
      id: '2',
      type: 'PO_BUYS',
      fileName: 'purchase_orders_q1.xlsx',
      fileSize: 1536000,
      status: 'completed',
      uploadedAt: new Date(Date.now() - 172800000).toISOString(), // 2 días atrás
      processedAt: new Date(Date.now() - 172700000).toISOString(),
      userId: 'user1',
      userName: 'Usuario Demo',
      results: {
        success: true,
        data: [
          { id: 1, supplier: 'Proveedor A', amount: '$15,000', status: 'Aprobado' },
          { id: 2, supplier: 'Proveedor B', amount: '$8,500', status: 'Pendiente' }
        ],
        fileUrl: 'https://example.com/processed/purchase_orders_q1_processed.xlsx',
        message: 'Procesamiento exitoso',
        processedAt: new Date(Date.now() - 172700000).toISOString(),
        recordCount: 2
      }
    },
    {
      id: '3',
      type: 'PACKING_LIST',
      fileName: 'packing_list_export.xlsx',
      fileSize: 1024000,
      status: 'failed',
      uploadedAt: new Date(Date.now() - 259200000).toISOString(), // 3 días atrás
      userId: 'user1',
      userName: 'Usuario Demo',
      error: 'Error en formato de archivo: columna requerida faltante'
    }
  ];
};

// Función para obtener estadísticas (mock por ahora)
export const getAutomationStats = async (): Promise<{ totalProcesses: number; successfulProcesses: number; failedProcesses: number; pendingProcesses: number }> => {
  const history = await getProcessHistory();
  
  return {
    totalProcesses: history.length,
    successfulProcesses: history.filter(p => p.status === 'completed').length,
    failedProcesses: history.filter(p => p.status === 'failed').length,
    pendingProcesses: history.filter(p => p.status === 'pending' || p.status === 'processing').length
  };
};
