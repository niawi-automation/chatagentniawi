import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Key, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword, validateResetCode, getFriendlyErrorMessage } from '@/utils/validators';
import EtresBrandSvg from '@/assets/images/etres-brand.svg';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, lastError, clearError, isAuthenticated } = useAuth();

  // Obtener resetCode de los query params
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setResetCode(code);
    }
  }, [searchParams]);

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Limpiar errores cuando cambian los campos
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
      clearError();
    }
  }, [email, newPassword, confirmPassword, resetCode]);

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

      if (!validateResetCode(resetCode)) {
        setErrors({ resetCode: 'Por favor ingresa un código de recuperación válido' });
        return;
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        setErrors({ newPassword: passwordValidation.errors[0] });
        return;
      }

      if (newPassword !== confirmPassword) {
        setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
        return;
      }

      await resetPassword(email, newPassword, resetCode);
      
      // Si llegamos aquí, el reset fue exitoso
      navigate('/login?reset-success=true');
      
    } catch (error: any) {
      const errorMessage = getFriendlyErrorMessage(error);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-niawi-bg flex items-center justify-center p-4">
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
          <h2 className="text-3xl font-bold text-foreground">Nueva Contraseña</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crea una nueva contraseña para tu cuenta
          </p>
        </div>

        {/* Error general */}
        {(errors.general || lastError) && (
          <Alert className="bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {errors.general || lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario */}
        <Card className="bg-niawi-surface border-niawi-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Restablecer Contraseña</CardTitle>
            <CardDescription className="text-center">
              Completa los datos para crear tu nueva contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
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

                <div>
                  <Label htmlFor="resetCode" className="text-foreground">
                    Código de Recuperación
                  </Label>
                  <Input
                    id="resetCode"
                    name="resetCode"
                    type="text"
                    required
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    className={`mt-1 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground ${
                      errors.resetCode ? 'border-red-500' : ''
                    }`}
                    placeholder="Código del email"
                  />
                  {errors.resetCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.resetCode}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-foreground">
                    Nueva Contraseña
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`pr-10 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground ${
                        errors.newPassword ? 'border-red-500' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p>La contraseña debe contener:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      <li>Al menos 8 caracteres</li>
                      <li>Una letra mayúscula</li>
                      <li>Una letra minúscula</li>
                      <li>Un número</li>
                      <li>Un carácter especial</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-foreground">
                    Confirmar Nueva Contraseña
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pr-10 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground ${
                        errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Restableciendo...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Restablecer Contraseña
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información adicional */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Key className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-500">
            <strong>Importante:</strong> El código de recuperación tiene una validez limitada. 
            Si tienes problemas, solicita un nuevo código desde la página de recuperación.
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
          <p className="text-sm text-muted-foreground">
            <Link 
              to="/forgot-password" 
              className="text-niawi-primary hover:text-niawi-accent underline"
            >
              Solicitar nuevo código
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas para restablecer tu contraseña?{' '}
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

export default ResetPassword;


