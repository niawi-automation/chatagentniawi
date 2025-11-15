import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { exportWipToXlsx } from '@/lib/exportExcel';

interface WipResultsTableProps {
  data: Array<Record<string, any>>;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onExport?: () => void;
}

// Columnas específicas para WIP en el orden correcto
const WIP_TABLE_COLUMNS = [
  'buyer_name',
  'pwn_no', 
  'po_no',
  'article_code',
  'article_desc',
  'buyer_style_ref',
  'delivery_date',
  'color_code',
  'color_name',
  'size_code',
  'po_qty',
  'process_name',
  'current_qty',
  'balance_qty',
  'start_process',
  'actual_start_date',
  'reason_desc',
  'end_process',
  'actual_end_date'
];

// Mapeo de campos a nombres de columnas más legibles
const WIP_COLUMN_NAMES: Record<string, string> = {
  'buyer_name': 'Buyer Name',
  'pwn_no': 'PWN No',
  'po_no': 'PO No',
  'article_code': 'Article Code',
  'article_desc': 'Article Desc',
  'buyer_style_ref': 'Buyer Style Ref',
  'delivery_date': 'Delivery Date',
  'color_code': 'Color Code',
  'color_name': 'Color Name',
  'size_code': 'Size Code',
  'po_qty': 'PO Qty',
  'process_name': 'Process Name',
  'current_qty': 'Current Qty',
  'balance_qty': 'Balance Qty',
  'start_process': 'Start Process',
  'actual_start_date': 'Actual Start Date',
  'reason_desc': 'Reason Desc',
  'end_process': 'End Process',
  'actual_end_date': 'Actual End Date'
};

// Función para transformar datos del webhook a formato de tabla
const transformWipData = (rawData: Array<Record<string, any>>): Array<Record<string, any>> => {
  const transformedData: Array<Record<string, any>> = [];

  rawData.forEach((item) => {
    // Si el item tiene records directamente (nuevo formato)
    if (item && typeof item === 'object' && Array.isArray(item.records)) {
      item.records.forEach((record: Record<string, any>) => {
        transformedData.push(record);
      });
    } 
    // Si el item ya es un record individual (ya procesado)
    else if (item && typeof item === 'object' && (item.buyer_name !== undefined || item.article_code)) {
      transformedData.push(item);
    }
  });

  return transformedData;
};

export const WipResultsTable: React.FC<WipResultsTableProps> = ({
  data,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onExport,
}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Transformar los datos
  const transformedData = React.useMemo(() => transformWipData(data), [data]);

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
    if (onExport) {
      onExport();
    } else {
      // Usar los datos filtrados que ya están siendo mostrados en la tabla
      exportWipToXlsx(filteredData, 'WIP_procesado.xlsx');
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
              {WIP_TABLE_COLUMNS.map((column) => (
                <TableHead key={column} className="text-foreground whitespace-nowrap">
                  {WIP_COLUMN_NAMES[column] || column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-accent">
                {WIP_TABLE_COLUMNS.map((column, ci) => (
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

export default WipResultsTable;
