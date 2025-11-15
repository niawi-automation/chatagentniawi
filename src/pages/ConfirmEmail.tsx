import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthContext } from '@/contexts/AuthContext';
import EtresBrandSvg from '@/assets/images/etres-brand.svg';

const ConfirmEmail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { confirmEmail, resendConfirmationEmail, isAuthenticated } = useAuthContext();

  // Obtener parámetros de confirmación de la URL (backend espera userId, code, y opcionalmente changedEmail)
  const userId = searchParams.get('userId');
  const code = searchParams.get('code');
  const changedEmail = searchParams.get('changedEmail') || undefined;

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Confirmar email automáticamente si hay userId y code
  useEffect(() => {
    if (userId && code && !isSuccess && !error) {
      handleConfirmEmail();
    }
  }, [userId, code]);

  const handleConfirmEmail = async () => {
    if (!userId || !code) {
      setError('Parámetros de confirmación no válidos. Verifica el enlace del email.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await confirmEmail(userId, code, changedEmail);
      setIsSuccess(true);
    } catch (error: any) {
      setError(error.message || 'Error al confirmar el email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Por favor ingresa tu email para reenviar la confirmación');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await resendConfirmationEmail(email);
      setError('');
      // Mostrar mensaje de éxito temporal
      setError('Email de confirmación reenviado. Revisa tu bandeja de entrada.');
      setTimeout(() => setError(''), 5000);
    } catch (error: any) {
      setError(error.message || 'Error al reenviar confirmación');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <img
                src={EtresBrandSvg}
                alt="E.tres Agent"
                className="h-16 w-auto"
              />
            </div>
            <h2 className="text-3xl font-bold text-foreground">Email Confirmado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu cuenta ha sido verificada exitosamente
            </p>
          </div>

          {/* Mensaje de éxito */}
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    ¡Bienvenido a Niawi!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Tu email ha sido confirmado correctamente. Ya puedes acceder a todas las funcionalidades de la plataforma.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    Iniciar Sesión
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="w-full"
                  >
                    Ir al Dashboard
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              ¿Necesitas ayuda?{' '}
              <a href="mailto:soporte@niawi.tech" className="text-primary hover:text-green-600">
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
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img
              src={EtresBrandSvg}
              alt="E.tres Agent"
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Confirmar Email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifica tu dirección de email para activar tu cuenta
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert className={`${error.includes('reenviado') ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <AlertCircle className={`h-4 w-4 ${error.includes('reenviado') ? 'text-green-500' : 'text-red-500'}`} />
            <AlertDescription className={error.includes('reenviado') ? 'text-green-700' : 'text-red-700'}>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Confirmación de Email</CardTitle>
            <CardDescription className="text-center">
              {userId && code 
                ? 'Procesando confirmación...' 
                : 'Ingresa tu email para reenviar el enlace de confirmación'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {userId && code ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-8 h-8 text-blue-500" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      Confirmando tu email...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Por favor espera mientras verificamos tu cuenta.
                    </p>
                  </div>

                  <Button
                    onClick={handleConfirmEmail}
                    disabled={isLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Confirmando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Email
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Reenviar Confirmación
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Si no recibiste el email de confirmación, puedes solicitarlo nuevamente.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 bg-background border-border focus:border-primary text-foreground"
                      placeholder="tu@empresa.com"
                    />
                  </div>

                  <Button
                    onClick={handleResendConfirmation}
                    disabled={isLoading || !email}
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Reenviar Email de Confirmación
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Mail className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Importante:</strong> El enlace de confirmación expira en 24 horas. 
            Si no recibes el email, revisa tu carpeta de spam.
          </AlertDescription>
        </Alert>

        {/* Links adicionales */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link
              to="/login"
              className="text-primary hover:text-green-600 underline inline-flex items-center"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Volver al inicio de sesión
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas con la confirmación?{' '}
            <a href="mailto:soporte@niawi.tech" className="text-primary hover:text-green-600">
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
