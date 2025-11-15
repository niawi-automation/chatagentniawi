import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';

interface ResultsTableProps {
  rows: Array<Record<string, any>>;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  onExport?: () => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  rows,
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50],
  onExport,
}) => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(defaultPageSize);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  const paginated = React.useMemo(() => rows.slice(start, end), [rows, start, end]);

  React.useEffect(() => {
    // Ajustar página si el tamaño cambia o el total disminuye
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  if (!rows || rows.length === 0) {
    return (
      <div className="border border-border rounded-lg p-6 text-center text-muted-foreground">
        Sin datos para mostrar
      </div>
    );
  }

  const headers = Object.keys(rows[0] ?? {});

  return (
    <div className="space-y-4">
      <div className="border border-border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              {headers.map((h) => (
                <TableHead key={h} className="text-foreground whitespace-nowrap">{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.map((row, idx) => (
              <TableRow key={idx} className="hover:bg-accent">
                {headers.map((h, ci) => (
                  <TableCell key={ci} className="text-foreground whitespace-nowrap">
                    {row[h] == null ? '' : (typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h]))}
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

          {onExport && (
            <Button onClick={onExport} size="sm" className="bg-green-500 hover:bg-green-500/90">
              Exportar a Excel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultsTable;


