import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exportPackingListToXlsx } from '@/lib/exportExcel';
import { transformPackingListData } from '@/utils/packingListTransform';

interface PackingListResultsTableProps {
  data: Array<Record<string, any>>;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onExport?: () => void;
}

// Columnas específicas para Packing List en el orden correcto
const PACKING_LIST_TABLE_COLUMNS = [
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

// Mapeo de campos a nombres de columnas más legibles
const PACKING_LIST_COLUMN_NAMES: Record<string, string> = {
  'BuyerName': 'Buyer Name',
  'FactoryName': 'Factory Name',
  'UserName': 'User Name',
  'BuyerERPCode': 'Buyer ERP Code',
  'FactoryERPCode': 'Factory ERP Code',
  'BuyerPO': 'Buyer PO',
  'PONumberEDI': 'PO Number EDI',
  'DestinationCode': 'Destination Code',
  'Style': 'Style',
  'DC': 'DC',
  'Address': 'Address',
  'City': 'City',
  'State': 'State',
  'PostalCode': 'Postal Code',
  'Country': 'Country',
  'CartonsQty': 'Cartons Qty',
  'CartonLength': 'Carton Length',
  'CartonWidth': 'Carton Width',
  'CartonHeight': 'Carton Height',
  'CartonNetWg': 'Carton Net Wg',
  'CartonGrossWg': 'Carton Gross Wg',
  'NroPacking': 'Nro Packing',
  'ColorName': 'Color Name',
  'Size': 'Size',
  'ShippedQty': 'Shipped Qty'
};

// Usar la función de transformación compartida desde utils/packingListTransform.ts

export const PackingListResultsTable: React.FC<PackingListResultsTableProps> = ({
  data,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onExport,
}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Transformar los datos
  const transformedData = React.useMemo(() => transformPackingListData(data), [data]);

  // Filtrar datos basado en el término de búsqueda
  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return transformedData;
    
    const term = searchTerm.toLowerCase();
    return transformedData.filter((row) =>
      Object.values(row).some((value) =>
        value != null && String(value).toLowerCase().includes(term)
      )
    );
  }, [transformedData, searchTerm]);

  const total = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const paginated = React.useMemo(() => filteredData.slice(start, end), [filteredData, start, end]);

  React.useEffect(() => {
    // Ajustar página si el tamaño cambia o el total disminuye
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  React.useEffect(() => {
    // Reset página cuando cambie el filtro de búsqueda
    setPage(1);
  }, [searchTerm]);

  if (!transformedData || transformedData.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center text-muted-foreground">
        Sin datos para mostrar
      </div>
    );
  }

  const handleExport = () => {
    console.log('📊 Iniciando exportación manual desde tabla');
    console.log('📊 Datos filtrados para exportar:', filteredData.length, 'registros');
    
    if (onExport) {
      onExport();
    } else {
      // Usar los datos filtrados que ya están siendo mostrados en la tabla
      try {
        exportPackingListToXlsx(filteredData, 'PACKING_LIST_procesado.xlsx');
        console.log('✅ Exportación manual completada exitosamente');
      } catch (error) {
        console.error('❌ Error en exportación manual:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Barra de herramientas superior con búsqueda y exportar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            placeholder="Buscar en la tabla..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs bg-transparent border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <Button onClick={handleExport} size="sm" className="bg-green-500 hover:bg-green-500/90">
          Exportar a Excel
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              {PACKING_LIST_TABLE_COLUMNS.map((column) => (
                <TableHead key={column} className="text-foreground whitespace-nowrap">
                  {PACKING_LIST_COLUMN_NAMES[column] || column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-accent">
                {PACKING_LIST_TABLE_COLUMNS.map((column, ci) => (
                  <TableCell key={ci} className="text-foreground whitespace-nowrap">
                    {row[column] == null ? '' : String(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando {start + 1}-{end} de {total}
        </div>

        <div className="flex items-center gap-3">
          <select
            className="bg-transparent border border-border rounded-md px-2 py-1 text-sm text-foreground"
            value={pageSize}
            onChange={(e) => {
              const size = Number(e.target.value);
              setPageSize(size);
              setPage(1);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt} className="bg-card text-foreground">
                {opt} / página
              </option>
            ))}
          </select>

          <div className="inline-flex items-center gap-1">
            <Button variant="outline" size="sm" className="border-border" onClick={() => setPage(1)} disabled={page === 1}>
              «
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              ‹
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {page} / {totalPages}
            </span>
            <Button variant="outline" size="sm" className="border-border" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              ›
            </Button>
            <Button variant="outline" size="sm" className="border-border" onClick={() => setPage(totalPages)} disabled={page === totalPages}>
              »
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PackingListResultsTable;
