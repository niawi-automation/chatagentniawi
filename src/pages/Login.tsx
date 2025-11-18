import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EtresBrandSvg from '@/assets/images/etres-brand.svg';
import { useAuthContext } from '@/contexts/AuthContext';
import { validateEmail } from '@/utils/validators';
import { validateClientEmail } from '@/utils/clientValidator';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, lastError, clearError, isAuthenticated } = useAuthContext();

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
  }, [email, password]);

  // Obtener mensajes de success de query params
  const registered = searchParams.get('registered');
  const resetSuccess = searchParams.get('reset-success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // VALIDACIÓN MULTI-CLIENTE: Validar patrón de email antes de enviar
    const clientValidation = validateClientEmail(email);
    if (!clientValidation.isValid) {
      setErrors({ email: clientValidation.error || 'Email inválido' });
      return;
    }

    // Validación básica de email (formato)
    if (!validateEmail(email)) {
      setErrors({ email: 'Por favor ingresa un email válido' });
      return;
    }

    if (!password || password.length < 6) {
      setErrors({ password: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    try {
      await login(email, password);
      // La navegación la hace automáticamente el AuthContext
    } catch (error: any) {
      // Los errores se manejan en el contexto
      console.error('Error en login:', error);
    }
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Light Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float-subtle"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float-subtle" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <img 
              src={EtresBrandSvg} 
              alt="E.tres Agent" 
              className="h-16 w-auto animate-float-subtle"
            />
          </div>
          <h2 className="text-3xl font-bold text-foreground">E.tres Agent</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Asistente Inteligente de Negocios
          </p>
        </div>

        {/* Mensaje de éxito de registro */}
        {registered && (
          <Alert className="glass-premium border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Registro exitoso. Por favor, inicia sesión con tus credenciales.
            </AlertDescription>
          </Alert>
        )}

        {/* Mensaje de éxito de reset password */}
        {resetSuccess && (
          <Alert className="glass-premium border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Contraseña restablecida exitosamente. Ya puedes iniciar sesión.
            </AlertDescription>
          </Alert>
        )}

        {/* Error general */}
        {(errors.general || lastError) && (
          <Alert className="glass-premium border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700">
              {errors.general || lastError}
            </AlertDescription>
          </Alert>
        )}

        {/* Login Form - Glass Premium */}
        <Card className="glass-premium border-border/50 shadow-2xl specular-reflection ambient-pattern">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-foreground">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`mt-1 bg-background/50 backdrop-blur-sm border-border focus:border-primary text-foreground input-enhanced transition-all duration-300 ${
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
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`pr-10 bg-background/50 backdrop-blur-sm border-border focus:border-primary text-foreground input-enhanced transition-all duration-300 ${
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
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-green-600 underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-white btn-magnetic hover:shadow-xl hover:shadow-primary/40 transition-all duration-300"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link a registro */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/register"
              className="text-primary hover:text-green-600 underline font-medium"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            E.tres Stores • Solo usuarios autorizados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
