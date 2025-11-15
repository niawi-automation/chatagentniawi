import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary">404</h1>
          <h2 className="text-2xl font-semibold text-foreground">Página no encontrada</h2>
          <p className="text-muted-foreground">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-lg bg-card border border-border">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-sm text-muted-foreground">
              Si llegaste aquí desde un enlace, es posible que esté desactualizado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="border-border hover:bg-card"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver atrás
            </Button>
            <Button
              onClick={() => navigate('/dashboard/chat')}
              className="bg-primary hover:bg-primary/90"
            >
              <Home className="w-4 h-4 mr-2" />
              Ir al inicio
            </Button>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>
            ¿Necesitas ayuda?{' '}
            <a href="mailto:soporte@niawi.tech" className="text-primary hover:text-green-600">
              Contacta soporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
