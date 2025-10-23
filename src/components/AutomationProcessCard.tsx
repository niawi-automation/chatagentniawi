import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileSpreadsheet, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  FileText,
  Package,
  ShoppingCart
} from 'lucide-react';
import { ProcessType, ProcessResults, AutomationState } from '@/types/automations';
import { processFile, downloadProcessedFile, validateFile } from '@/services/automationService';
import { useAgent } from '@/hooks/useAgent';
import { toast } from 'sonner';

interface AutomationProcessCardProps {
  processType: ProcessType;
  onResultsUpdate?: (results: ProcessResults) => void;
  onProcessingStart?: () => void;
  onProcessingError?: (message: string) => void;
}

const PROCESS_TYPE_CONFIG = {
  WIP: {
    label: 'Work in Progress',
    description: 'Procesa documentos de trabajo en progreso',
    icon: FileText,
    color: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    borderColor: 'border-blue-500/20'
  },
  PO_BUYS: {
    label: 'Purchase Orders',
    description: 'Procesa órdenes de compra y documentos de compras',
    icon: ShoppingCart,
    color: 'bg-green-500/10',
    iconColor: 'text-green-500',
    borderColor: 'border-green-500/20'
  },
  PACKING_LIST: {
    label: 'Packing List',
    description: 'Procesa listas de empaque y documentos de envío',
    icon: Package,
    color: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    borderColor: 'border-purple-500/20'
  }
};

export const AutomationProcessCard: React.FC<AutomationProcessCardProps> = ({
  processType,
  onResultsUpdate,
  onProcessingStart,
  onProcessingError
}) => {
  const { currentUser } = useAgent();
  const [state, setState] = useState<AutomationState>({
    selectedFile: null,
    selectedProcessType: processType,
    isProcessing: false,
    currentResults: null,
    error: null
  });

  const config = PROCESS_TYPE_CONFIG[processType];
  const Icon = config.icon;

  // Manejar selección de archivo
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar archivo
    const validation = validateFile(file, processType);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Archivo inválido' }));
      toast.error(validation.error || 'Archivo inválido');
      return;
    }

    setState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      currentResults: null
    }));
    
    toast.success('Archivo seleccionado correctamente');
  }, [processType]);

  // Manejar drag & drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    const validation = validateFile(file, processType);
    if (!validation.valid) {
      setState(prev => ({ ...prev, error: validation.error || 'Archivo inválido' }));
      toast.error(validation.error || 'Archivo inválido');
      return;
    }

    setState(prev => ({
      ...prev,
      selectedFile: file,
      error: null,
      currentResults: null
    }));
    
    toast.success('Archivo cargado correctamente');
  }, [processType]);

  // Procesar archivo
  const handleProcessFile = useCallback(async () => {
    if (!state.selectedFile || !currentUser) return;

    onProcessingStart?.();
    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      const result = await processFile(
        state.selectedFile,
        processType,
        currentUser.id,
        currentUser.name
      );

      if (result.success && result.data) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          currentResults: result.data!,
          error: null
        }));
        
        onResultsUpdate?.(result.data);
        toast.success('Archivo procesado exitosamente');
      } else {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: result.error || 'Error desconocido al procesar el archivo'
        }));
        onProcessingError?.(result.error || 'Error desconocido al procesar el archivo');
        toast.error(result.error || 'Error al procesar el archivo');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));
      onProcessingError?.(errorMessage);
      toast.error(errorMessage);
    }
  }, [state.selectedFile, processType, currentUser, onResultsUpdate]);

  // Descargar archivo procesado
  const handleDownload = useCallback(async () => {
    if (!state.currentResults?.fileUrl) return;

    try {
      const fileName = state.selectedFile?.name.replace(/\.(xlsx?|xls)$/i, '_processed.xlsx') || 'archivo_procesado.xlsx';
      await downloadProcessedFile(state.currentResults.fileUrl, fileName);
      toast.success('Archivo descargado exitosamente');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al descargar el archivo';
      toast.error(errorMessage);
    }
  }, [state.currentResults, state.selectedFile]);

  // Limpiar estado
  const handleReset = useCallback(() => {
    setState({
      selectedFile: null,
      selectedProcessType: processType,
      isProcessing: false,
      currentResults: null,
      error: null
    });
  }, [processType]);

  // Renderizar estado del proceso
  const renderProcessStatus = () => {
    if (state.isProcessing) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-niawi-warning animate-spin" />
            <span className="text-sm text-niawi-warning">Procesando archivo...</span>
          </div>
          <Progress value={undefined} className="h-2 bg-niawi-border/30">
            <div className="h-full w-full bg-gradient-to-r from-niawi-primary via-niawi-secondary to-niawi-accent animate-shimmer"></div>
          </Progress>
        </div>
      );
    }

    if (state.currentResults) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-niawi-accent animate-bounce-slow" />
            <span className="text-sm text-niawi-accent">Procesamiento completado</span>
          </div>
          
          {state.currentResults.data && state.currentResults.data.length > 0 && (
            <div className="space-y-2">
              <Badge variant="outline" className="border-niawi-accent text-niawi-accent">
                {state.currentResults.recordCount || state.currentResults.data.length} registros procesados
              </Badge>
              
              {state.currentResults.fileUrl && (
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="w-full bg-niawi-accent hover:bg-niawi-accent/90 btn-magnetic hover:shadow-xl hover:shadow-niawi-accent/40"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Archivo
                </Button>
              )}
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={`bg-niawi-surface border-niawi-border hover-lift animate-slide-in-up ${config.borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-foreground">{config.label}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {config.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Zona de upload */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center backdrop-blur-sm ${
            state.selectedFile
              ? 'border-niawi-accent bg-niawi-accent/10 shadow-lg shadow-niawi-accent/20'
              : 'border-niawi-border hover:border-niawi-primary/60 hover:bg-niawi-primary/5 hover:shadow-md animate-glow-pulse'
          }`}
          style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {state.selectedFile ? (
            <div className="space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-niawi-accent mx-auto" />
              <p className="text-sm font-medium text-foreground">{state.selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(state.selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
              >
                Cambiar archivo
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
              <p className="text-sm text-foreground">Arrastra tu archivo Excel aquí</p>
              <p className="text-xs text-muted-foreground">o</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-input-${processType}`)?.click()}
                className="border-niawi-border hover:bg-niawi-surface"
              >
                Seleccionar archivo
              </Button>
              <input
                id={`file-input-${processType}`}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Botón de procesar */}
        {state.selectedFile && !state.isProcessing && !state.currentResults && (
          <Button
            onClick={handleProcessFile}
            className="w-full bg-niawi-primary hover:bg-niawi-primary/90 btn-magnetic hover:shadow-xl hover:shadow-niawi-primary/40"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Procesar Archivo
          </Button>
        )}

        {/* Estado del procesamiento */}
        {renderProcessStatus()}

        {/* Mensaje de error */}
        {state.error && (
          <Alert className="border-niawi-danger/20 bg-niawi-danger/5">
            <AlertCircle className="h-4 w-4 text-niawi-danger" />
            <AlertDescription className="text-niawi-danger">
              {state.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Botón de reset cuando hay resultados */}
        {state.currentResults && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Procesar nuevo archivo
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
