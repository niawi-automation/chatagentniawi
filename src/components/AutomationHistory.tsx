import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Eye, Filter, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AutomationProcess, ProcessType, ProcessStatus } from '@/types/automations';
import { getProcessHistory, downloadProcessedFile } from '@/services/automationService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  WIP: 'Work in Progress',
  PO_BUYS: 'Purchase Orders',
  PACKING_LIST: 'Packing List'
};

const STATUS_LABELS: Record<ProcessStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido'
};

const STATUS_COLORS: Record<ProcessStatus, string> = {
  pending: 'bg-yellow-500 text-white',
  processing: 'bg-primary text-white',
  completed: 'bg-green-500 text-white',
  failed: 'bg-destructive text-white'
};

interface AutomationHistoryProps {
  onViewResults?: (process: AutomationProcess) => void;
}

export const AutomationHistory: React.FC<AutomationHistoryProps> = ({ onViewResults }) => {
  const [typeFilter, setTypeFilter] = useState<ProcessType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ProcessStatus | 'all'>('all');
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState('');

  // Query para obtener historial
  const { data: processes, isLoading, error, refetch } = useQuery({
    queryKey: ['automation-history', typeFilter, statusFilter, dateFrom, dateTo, searchTerm],
    queryFn: getProcessHistory,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
  });

  // Filtrar procesos
  const filteredProcesses = React.useMemo(() => {
    if (!processes) return [];

    return processes.filter(process => {
      // Filtro por tipo
      if (typeFilter !== 'all' && process.type !== typeFilter) return false;
      
      // Filtro por estado
      if (statusFilter !== 'all' && process.status !== statusFilter) return false;
      
      // Filtro por rango de fechas
      const processDate = new Date(process.uploadedAt);
      if (dateFrom && processDate < dateFrom) return false;
      if (dateTo && processDate > dateTo) return false;
      
      // Filtro por término de búsqueda
      if (searchTerm && !process.fileName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !process.userName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
  }, [processes, typeFilter, statusFilter, dateFrom, dateTo, searchTerm]);

  // Manejar descarga de archivo
  const handleDownload = async (process: AutomationProcess) => {
    if (!process.results?.fileUrl) {
      toast.error('No hay archivo disponible para descargar');
      return;
    }

    try {
      const fileName = process.fileName.replace(/\.(xlsx?|xls)$/i, '_processed.xlsx');
      await downloadProcessedFile(process.results.fileUrl, fileName);
      toast.success('Archivo descargado exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al descargar el archivo';
      toast.error(errorMessage);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <p>Error al cargar el historial</p>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <CardTitle className="text-foreground">Historial de Procesos</CardTitle>
            <CardDescription className="text-muted-foreground">
              Registro de todos los archivos procesados
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
            className="border-border hover:bg-card"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-background/50 rounded-lg border border-border/50">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Proceso</label>
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as ProcessType | 'all')}>
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="WIP">Work in Progress</SelectItem>
                <SelectItem value="PO_BUYS">Purchase Orders</SelectItem>
                <SelectItem value="PACKING_LIST">Packing List</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estado</label>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ProcessStatus | 'all')}>
              <SelectTrigger className="border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Desde</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left border-border hover:bg-card"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'Seleccionar'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-card border-border">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Buscar</label>
            <Input
              placeholder="Buscar por archivo o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-border"
            />
          </div>
        </div>

        {/* Tabla de historial */}
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Cargando historial...</p>
            </div>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-background/50">
                  <TableHead className="text-foreground">Archivo</TableHead>
                  <TableHead className="text-foreground">Tipo</TableHead>
                  <TableHead className="text-foreground">Usuario</TableHead>
                  <TableHead className="text-foreground">Estado</TableHead>
                  <TableHead className="text-foreground">Fecha</TableHead>
                  <TableHead className="text-foreground">Tamaño</TableHead>
                  <TableHead className="text-foreground">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProcesses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No se encontraron procesos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProcesses.map((process) => (
                    <TableRow key={process.id} className="hover:bg-background/30">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                          <span className="text-foreground font-medium">{process.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-border">
                          {PROCESS_TYPE_LABELS[process.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{process.userName}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[process.status]}>
                          {STATUS_LABELS[process.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(process.uploadedAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatFileSize(process.fileSize)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {process.results && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewResults?.(process)}
                              className="text-primary hover:text-primary/80"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {process.results?.fileUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(process)}
                              className="text-green-600 hover:text-green-600/80"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Resumen */}
        {filteredProcesses.length > 0 && (
          <div className="text-sm text-muted-foreground text-center">
            Mostrando {filteredProcesses.length} de {processes?.length || 0} procesos
          </div>
        )}
      </CardContent>
    </Card>
  );
};

