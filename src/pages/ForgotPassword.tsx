import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, getFriendlyErrorMessage } from '@/utils/validators';
import NiawiLogoSvg from '@/assets/images/Niawilogo.svg';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const { forgotPassword, lastError, clearError, isAuthenticated } = useAuth();

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores cuando cambia el email
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
      clearError();
    }
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validaciones
      if (!validateEmail(email)) {
        setErrors({ email: 'Por favor ingresa un email válido' });
        return;
      }

      await forgotPassword(email);
      setIsSuccess(true);
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
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
            <h2 className="text-3xl font-bold text-foreground">Email Enviado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Revisa tu bandeja de entrada
            </p>
          </div>

          {/* Mensaje de éxito */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Instrucciones enviadas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Si el email <strong>{email}</strong> está registrado en nuestro sistema, 
                    recibirás un enlace para restablecer tu contraseña.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revisa tu bandeja de entrada y carpeta de spam. El enlace expirará en 24 horas.
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
                  >
                    Volver al inicio de sesión
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsSuccess(false);
                      setEmail('');
                    }}
                    className="w-full"
                  >
                    Enviar otro email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              ¿No recibiste el email?{' '}
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
          <h2 className="text-3xl font-bold text-foreground">¿Olvidaste tu contraseña?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            No te preocupes, te enviaremos un enlace para restablecerla
          </p>
        </div>

        {/* Error general */}
        {errors.general && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {errors.general}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Card className="bg-niawi-surface border-niawi-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Restablecer Contraseña</CardTitle>
            <CardDescription className="text-center">
              Ingresa tu email y te enviaremos un enlace para crear una nueva contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  className={`mt-1 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="tu@empresa.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar enlace de recuperación
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Mail className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Importante:</strong> El enlace de recuperación será enviado al email registrado 
            y expirará en 24 horas. Si no recibes el email, revisa tu carpeta de spam.
          </AlertDescription>
        </Alert>

        {/* Links adicionales */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            <Link 
              to="/login" 
              className="text-niawi-primary hover:text-niawi-accent underline inline-flex items-center"
            >
              <ArrowLeft className="w-3 h-3 mr-1" />
              Volver al inicio de sesión
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas para recuperar tu cuenta?{' '}
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

export default ForgotPassword;
