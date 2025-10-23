// Función para transformar datos del webhook a formato de tabla para Packing List
// Esta función puede ser usada tanto por la descarga automática como por la manual

export const transformPackingListData = (rawData: Array<Record<string, any>>): Array<Record<string, any>> => {
  const flattenedData: Array<Record<string, any>> = [];
  
  console.log('🔄 Transformando datos de Packing List:', rawData.length, 'elementos');
  
  rawData.forEach((item, index) => {
    if (!item || typeof item !== 'object') return;
    
    console.log(`🔄 Procesando elemento ${index}:`, item);
    
    // Extraer datos del nivel principal
    const {
      buyerName,
      factoryName,
      userName,
      buyerERPCode,
      factoryERPCode,
      buyerPONumber,
      PONumberEDI,
      packs
    } = item;
    
    // Procesar cada pack
    if (Array.isArray(packs)) {
      packs.forEach((pack, packIndex) => {
        if (!pack || typeof pack !== 'object') return;
        
        console.log(`🔄 Procesando pack ${packIndex}:`, pack);
        
        const {
          destinationCode,
          style,
          DC,
          Address,
          City,
          PostalCode,
          State,
          Country,
          CartonsQty,
          CartonLength,
          CartonWidth,
          CartonHeight,
          CartonNetWg,
          CartonGrossWg,
          nroPacking,
          sizeDetail
        } = pack;
        
        // Procesar cada sizeDetail
        if (Array.isArray(sizeDetail)) {
          sizeDetail.forEach((sizeItem, sizeIndex) => {
            if (!sizeItem || typeof sizeItem !== 'object') return;
            
            console.log(`🔄 Procesando sizeDetail ${sizeIndex}:`, sizeItem);
            
            const {
              ColorName,
              Size,
              ShippedQty
            } = sizeItem;
            
            // Crear registro aplanado
            const flattenedRecord = {
              BuyerName: buyerName || '',
              FactoryName: factoryName || '',
              UserName: userName || '',
              BuyerERPCode: buyerERPCode || '',
              FactoryERPCode: factoryERPCode || '',
              BuyerPO: buyerPONumber || '',
              PONumberEDI: PONumberEDI || '',
              DestinationCode: destinationCode || '',
              Style: style || '',
              DC: DC || '',
              Address: Address || '',
              City: City || '',
              State: State || '',
              PostalCode: PostalCode || '',
              Country: Country || '',
              CartonsQty: CartonsQty || 0,
              CartonLength: CartonLength || 0,
              CartonWidth: CartonWidth || 0,
              CartonHeight: CartonHeight || 0,
              CartonNetWg: CartonNetWg || 0,
              CartonGrossWg: CartonGrossWg || 0,
              NroPacking: nroPacking || 0,
              ColorName: ColorName || '',
              Size: Size || '',
              ShippedQty: ShippedQty || 0
            };
            
            console.log('🔄 Registro aplanado creado:', flattenedRecord);
            flattenedData.push(flattenedRecord);
          });
        }
      });
    }
  });
  
  console.log('✅ Transformación completada:', flattenedData.length, 'registros generados');
  return flattenedData;
};




