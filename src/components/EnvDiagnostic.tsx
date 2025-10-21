import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

/**
 * Componente de diagnóstico para verificar las variables de entorno
 * Úsalo temporalmente agregándolo en cualquier página para verificar la configuración
 * 
 * Ejemplo de uso en Login.tsx:
 * import EnvDiagnostic from '@/components/EnvDiagnostic';
 * 
 * Y luego en el JSX:
 * {import.meta.env.DEV && <EnvDiagnostic />}
 */
export const EnvDiagnostic = () => {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Capturar todas las variables VITE_
    const vars: Record<string, string> = {};
    Object.keys(import.meta.env).forEach((key) => {
      if (key.startsWith('VITE_')) {
        vars[key] = import.meta.env[key] as string;
      }
    });
    setEnvVars(vars);
  }, []);

  const checkUrl = (url: string) => {
    if (!url) return { status: 'error', message: 'No definida' };
    if (url.startsWith('https://')) return { status: 'success', message: 'HTTPS ✓' };
    if (url.startsWith('http://')) return { status: 'warning', message: 'HTTP (inseguro)' };
    if (url.startsWith('/')) return { status: 'info', message: 'Relativa (OK en dev)' };
    return { status: 'info', message: 'Formato desconocido' };
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-[600px] overflow-auto z-50 shadow-lg">
      <CardHeader className="bg-blue-500/10">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="w-4 h-4" />
          Diagnóstico de Variables de Entorno
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-3">
        <div className="text-xs space-y-2">
          <div className="font-semibold">Modo: {import.meta.env.DEV ? 'Desarrollo' : 'Producción'}</div>
          
          {Object.entries(envVars).map(([key, value]) => {
            const check = key.includes('URL') ? checkUrl(value) : null;
            return (
              <div key={key} className="border-b pb-2">
                <div className="font-mono font-semibold text-xs">{key}:</div>
                <div className="font-mono text-xs break-all flex items-start gap-2">
                  {check && (
                    <span>
                      {check.status === 'success' && <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />}
                      {check.status === 'warning' && <AlertCircle className="w-3 h-3 text-orange-500 flex-shrink-0 mt-0.5" />}
                      {check.status === 'error' && <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />}
                      {check.status === 'info' && <Info className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />}
                    </span>
                  )}
                  <span className="flex-1">{value || '(vacío)'}</span>
                </div>
                {check && check.status !== 'success' && (
                  <div className="text-xs text-muted-foreground ml-5">{check.message}</div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(envVars).length === 0 && (
          <Alert className="bg-yellow-500/10 border-yellow-500/20">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <AlertDescription className="text-xs text-yellow-700">
              No se encontraron variables VITE_*. Verifica tu configuración de Vercel.
            </AlertDescription>
          </Alert>
        )}

        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-xs text-blue-700">
            <strong>Importante:</strong> Después de actualizar variables en Vercel, debes hacer REDEPLOY.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default EnvDiagnostic;
