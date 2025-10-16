import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword, getFriendlyErrorMessage } from '@/utils/validators';
import NiawiLogoSvg from '@/assets/images/Niawilogo.svg';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const { register, lastError, clearError, isAuthenticated } = useAuth();

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
  }, [email, password, confirmPassword]);

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

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setErrors({ password: passwordValidation.errors[0] });
        return;
      }

      if (password !== confirmPassword) {
        setErrors({ confirmPassword: 'Las contraseñas no coinciden' });
        return;
      }

      await register(email, password);
      
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
              src={NiawiLogoSvg} 
              alt="Niawi" 
              className="h-16 w-auto"
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Crear Cuenta</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Únete a Niawi y accede a tu Copiloto de IA
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

        {/* Formulario de registro */}
        <Card className="bg-niawi-surface border-niawi-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Información de Registro</CardTitle>
            <CardDescription className="text-center">
              Completa los datos para crear tu cuenta
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
                  <Label htmlFor="password" className="text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pr-10 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground ${
                        errors.password ? 'border-red-500' : ''
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
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
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
                    Confirmar Contraseña
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
                    Creando cuenta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Crear Cuenta
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información sobre confirmación de email */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <CheckCircle className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            <strong>Importante:</strong> Después del registro, recibirás un email de confirmación. 
            Debes hacer clic en el enlace para activar tu cuenta antes de poder iniciar sesión.
          </AlertDescription>
        </Alert>

        {/* Links adicionales */}
        <div className="text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link 
              to="/login" 
              className="text-niawi-primary hover:text-niawi-accent underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas para registrarte?{' '}
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

export default Register;
