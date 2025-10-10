import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import NiawiLogoSvg from '@/assets/images/Niawilogo.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Obtener credenciales desde variables de entorno
    const validEmail = import.meta.env.VITE_AUTH_EMAIL;
    const validPassword = import.meta.env.VITE_AUTH_PASSWORD;

    // Validar credenciales
    const isValidCredentials = (
      email === validEmail && 
      password === validPassword
    );

    // Simulate API call
    setTimeout(() => {
      if (isValidCredentials) {
        // Almacenar estado de autenticación
        localStorage.setItem('niawi-auth', 'authenticated');
        navigate('/dashboard');
      } else {
        // Mostrar error de credenciales inválidas
        alert('Credenciales incorrectas. Acceso denegado.');
      }
      setIsLoading(false);
    }, 1500);
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
          <h2 className="text-3xl font-bold text-foreground">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Accede a tu Copiloto Niawi
          </p>
        </div>

        {/* Login Form */}
        <Card className="bg-niawi-surface border-niawi-border">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Credenciales de Acceso</CardTitle>
            <CardDescription className="text-center">
              Ingresa tus datos para acceder al sistema
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
                    className="mt-1 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground"
                    placeholder="tu@empresa.com"
                  />
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
                      className="pr-10 bg-niawi-bg border-niawi-border focus:border-niawi-primary text-foreground"
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
          </CardContent>
        </Card>

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
