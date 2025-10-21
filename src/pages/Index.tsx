import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, TrendingUp } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  // Mock data for the dashboardss
  const stats = [
    { label: 'Ventas Totales', value: '$124,500', change: '+12%', changeType: 'positive', icon: BarChart, bgColor: 'bg-green-500/10', iconColor: 'text-green-500' },
    { label: 'Conversiones', value: '8.2%', change: '+2.1%', changeType: 'positive', icon: TrendingUp, bgColor: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { label: 'Usuarios Activos', value: '2,847', change: '+18%', changeType: 'positive', icon: Calendar, bgColor: 'bg-purple-500/10', iconColor: 'text-purple-500' },
    { label: 'Retención', value: '94.3%', change: '-1.2%', changeType: 'negative', icon: Download, bgColor: 'bg-orange-500/10', iconColor: 'text-orange-500' }
  ];

  const recentActivity = [
    { title: 'Nueva venta procesada', time: 'Hace 5 min', icon: BarChart, bgColor: 'bg-green-500/10', iconColor: 'text-green-500' },
    { title: 'Usuario registrado', time: 'Hace 12 min', icon: Calendar, bgColor: 'bg-blue-500/10', iconColor: 'text-blue-500' },
    { title: 'Reporte generado', time: 'Hace 30 min', icon: Download, bgColor: 'bg-purple-500/10', iconColor: 'text-purple-500' },
    { title: 'Sistema actualizado', time: 'Hace 1 hora', icon: TrendingUp, bgColor: 'bg-orange-500/10', iconColor: 'text-orange-500' }
  ];

  const alerts = [
    { 
      title: 'Sistema funcionando correctamente', 
      description: 'Todos los servicios operativos', 
      icon: TrendingUp, 
      bgColor: 'bg-green-500/10', 
      borderColor: 'border-green-500/20', 
      iconColor: 'text-green-500', 
      textColor: 'text-green-400' 
    },
    { 
      title: 'Backup programado', 
      description: 'Próximo backup: Mañana 3:00 AM', 
      icon: Calendar, 
      bgColor: 'bg-blue-500/10', 
      borderColor: 'border-blue-500/20', 
      iconColor: 'text-blue-500', 
      textColor: 'text-blue-400' 
    }
  ];

  useEffect(() => {
    navigate('/login');
  }, [navigate]);

  return (
    <div className="page-container">
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard Ejecutivo</h1>
            <p className="text-muted-foreground">
              Panel de control principal de Copiloto Niawi
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="border-niawi-border hover:bg-niawi-surface">
              <Calendar className="w-4 h-4 mr-2" />
              Este Mes
            </Button>
            <Button className="bg-niawi-primary hover:bg-niawi-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {stats.map((stat, index) => (
            <Card key={index} className="bg-niawi-surface border-niawi-border hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change} vs mes anterior
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Revenue Chart */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Ingresos por Mes</CardTitle>
              <CardDescription>Comparación últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <BarChart className="w-12 h-12 mr-3" />
                <span>Gráfico de ingresos - Datos desde API</span>
              </div>
            </CardContent>
          </Card>

          {/* Conversion Chart */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Conversiones</CardTitle>
              <CardDescription>Embudo de ventas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center text-muted-foreground">
                <TrendingUp className="w-12 h-12 mr-3" />
                <span>Gráfico de conversiones - Datos desde API</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity & Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
              <CardDescription>Últimas acciones del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-niawi-bg/50">
                    <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                      <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card className="bg-niawi-surface border-niawi-border">
            <CardHeader>
              <CardTitle className="text-foreground">Alertas del Sistema</CardTitle>
              <CardDescription>Notificaciones importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${alert.bgColor} ${alert.borderColor}`}>
                    <div className="flex items-start gap-3">
                      <alert.icon className={`w-5 h-5 mt-0.5 ${alert.iconColor}`} />
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${alert.textColor}`}>{alert.title}</h4>
                        <p className={`text-xs mt-1 ${alert.textColor}/80`}>{alert.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
