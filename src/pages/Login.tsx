import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EtresBrandSvg from '@/assets/images/etres-brand.svg';
import { useAuth } from '@/hooks/useAuth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      console.log('Intentando login con:', email, password);
      const result = login(email, password);
      console.log('Resultado del login:', result);
      
      if (result.success && result.user) {
        console.log('Login exitoso, redirigiendo...');
        // Determinar la ruta de redirección según el tipo de usuario
        if (result.user.accessType === 'automations_only') {
          navigate('/dashboard/automations');
        } else {
          navigate('/dashboard');
        }
      } else {
        console.log('Login fallido:', result.message);
        // Mostrar error de credenciales inválidas
        alert(result.message || 'Credenciales incorrectas. Acceso denegado.');
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient Light Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-niawi-primary/10 rounded-full blur-3xl animate-float-subtle"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-niawi-secondary/10 rounded-full blur-3xl animate-float-subtle" style={{ animationDelay: '2s' }}></div>
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

        {/* Login Form - Glass Premium */}
        <Card className="glass-premium border-niawi-border/50 shadow-2xl specular-reflection ambient-pattern">
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
                    className="mt-1 bg-niawi-bg/50 backdrop-blur-sm border-niawi-border focus:border-niawi-primary text-foreground input-enhanced transition-all duration-300"
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
                      className="pr-10 bg-niawi-bg/50 backdrop-blur-sm border-niawi-border focus:border-niawi-primary text-foreground input-enhanced transition-all duration-300"
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
                className="w-full bg-niawi-primary hover:bg-niawi-primary/90 text-white btn-magnetic hover:shadow-xl hover:shadow-niawi-primary/40 transition-all duration-300"
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
            E.tres Stores • Solo usuarios autorizados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
