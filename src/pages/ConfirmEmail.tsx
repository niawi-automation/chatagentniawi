import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { sanitizeQueryParam, getFriendlyErrorMessage } from '@/utils/validators';
import NiawiLogoSvg from '@/assets/images/Niawilogo.svg';

const ConfirmEmail = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmEmail, isAuthenticated } = useAuth();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Confirmar email al montar el componente
  useEffect(() => {
    const confirmEmailAsync = async () => {
      try {
        const userId = sanitizeQueryParam(searchParams.get('userId'));
        const code = sanitizeQueryParam(searchParams.get('code'));
        const changedEmail = sanitizeQueryParam(searchParams.get('changedEmail'));

        if (!userId || !code) {
          setError('Parámetros de confirmación inválidos. Verifica que el enlace sea correcto.');
          return;
        }

        await confirmEmail(userId, code, changedEmail || undefined);
        setIsSuccess(true);
        
      } catch (err: any) {
        const errorMessage = getFriendlyErrorMessage(err);
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    confirmEmailAsync();
  }, [searchParams, confirmEmail]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-niawi-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img 
                src={NiawiLogoSvg} 
                alt="Niawi" 
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Confirmando Email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Verificando tu dirección de email...
            </p>
          </div>

          {/* Loading Card */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-niawi-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-8 h-8 border-2 border-niawi-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Procesando confirmación de email...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-niawi-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={NiawiLogoSvg} 
              alt="Niawi" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {isSuccess ? 'Email Confirmado' : 'Error de Confirmación'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSuccess 
              ? 'Tu email ha sido verificado exitosamente' 
              : 'Hubo un problema al confirmar tu email'
            }
          </p>
        </div>

        {/* Resultado */}
        <Card className="bg-niawi-surface border-niawi-border">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {isSuccess ? (
                <>
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      ¡Confirmación exitosa!
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Tu dirección de email ha sido verificada correctamente. 
                      Ya puedes iniciar sesión con tu cuenta.
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Ir al inicio de sesión
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Error de confirmación
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {error || 'No se pudo confirmar tu email. El enlace puede haber expirado o ser inválido.'}
                    </p>
                  </div>

                  <div className="space-y-3 pt-4">
                    <Button
                      onClick={() => navigate('/login')}
                      className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Ir al inicio de sesión
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate('/forgot-password')}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Solicitar nuevo enlace
                    </Button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        {isSuccess ? (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              <strong>¡Perfecto!</strong> Tu cuenta está lista para usar. 
              Ahora puedes acceder a todas las funcionalidades de Niawi.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              <strong>¿Necesitas ayuda?</strong> Si sigues teniendo problemas, 
              puedes solicitar un nuevo enlace de confirmación o contactar soporte.
            </AlertDescription>
          </Alert>
        )}

        {/* Links adicionales */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link 
              to="/login" 
              className="text-niawi-primary hover:text-niawi-accent underline"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas con la confirmación?{' '}
            <a href="mailto:soporte@niawi.tech" className="text-niawi-primary hover:text-niawi-accent">
              Contacta soporte
            </a>
          </p>
          <p className="mt-2">
            © 2025 Niawi. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmail;
