import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { validateEmail, validatePassword, getFriendlyErrorMessage, isTwoFactorRequiredError, isLockoutError } from '@/utils/validators';
import NiawiLogoSvg from '@/assets/images/Niawilogo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'login' | '2fa'>('login');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, lastError, clearError, isAuthenticated } = useAuth();

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
  }, [email, password, twoFactorCode]);

  // Mostrar mensaje de registro exitoso
  const registered = searchParams.get('registered');
  const resetSuccess = searchParams.get('reset-success');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      // Validaciones básicas
      if (!validateEmail(email)) {
        setErrors({ email: 'Por favor ingresa un email válido' });
        return;
      }

      if (!password.trim()) {
        setErrors({ password: 'Por favor ingresa tu contraseña' });
        return;
      }

      await login(email, password, step === '2fa' ? twoFactorCode : undefined);
      
      // Si llegamos aquí, el login fue exitoso
      navigate('/dashboard');
      
    } catch (error: any) {
      if (error.message === '2FA_REQUIRED') {
        setStep('2fa');
        setErrors({});
      } else {
        const errorMessage = getFriendlyErrorMessage(error);
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (twoFactorCode.length !== 6) {
      setErrors({ twoFactor: 'El código debe tener 6 dígitos' });
      return;
    }

    await handleSubmit(e);
  };

  const handleBackToLogin = () => {
    setStep('login');
    setTwoFactorCode('');
    setErrors({});
    clearError();
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
          <h2 className="text-3xl font-bold text-foreground">
            {step === '2fa' ? 'Verificación en dos pasos' : 'Iniciar Sesión'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === '2fa' 
              ? 'Ingresa el código de tu aplicación autenticadora' 
              : 'Accede a tu Copiloto Niawi'
            }
          </p>
        </div>

        {/* Mensajes de éxito */}
        {registered && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Usuario registrado exitosamente. Por favor inicia sesión.
            </AlertDescription>
          </Alert>
        )}

        {resetSuccess && (
          <Alert className="bg-green-500/10 border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">
              Contraseña restablecida exitosamente. Por favor inicia sesión.
            </AlertDescription>
          </Alert>
        )}

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
            <CardTitle className="text-center text-foreground">
              {step === '2fa' ? 'Código de verificación' : 'Credenciales de Acceso'}
            </CardTitle>
            <CardDescription className="text-center">
              {step === '2fa' 
                ? 'Ingresa el código de 6 dígitos de tu app autenticadora'
                : 'Ingresa tus datos para acceder al sistema'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 'login' ? (
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
                        autoComplete="current-password"
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
            ) : (
              <form onSubmit={handle2FASubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <Label htmlFor="twoFactorCode" className="text-foreground">
                      Código de verificación
                    </Label>
                    <div className="flex justify-center mt-4">
                      <InputOTP
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={setTwoFactorCode}
                        className="gap-2"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {errors.twoFactor && (
                      <p className="text-red-500 text-sm mt-2">{errors.twoFactor}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading || twoFactorCode.length !== 6}
                    className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Verificar código
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    className="w-full"
                  >
                    Volver al login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Links adicionales */}
        {step === 'login' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              <Link 
                to="/forgot-password" 
                className="text-niawi-primary hover:text-niawi-accent underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link 
                to="/register" 
                className="text-niawi-primary hover:text-niawi-accent underline"
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Problemas para acceder?{' '}
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

export default Login;
