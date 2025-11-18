import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Grid3x3, List, Filter, Calendar, X, CheckCircle, XCircle, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Brain } from 'lucide-react';
import { getCurrentClientConfig } from '@/services/clientConfig';

interface Recommendation {
  id: number;
  mensaje: string;
  descripcion: string;
  impacto: string;
  categoria: string;
  estado: string;
  fecha: string;
  prioridad: number;
  estimatedRevenue: string;
}

interface ApiResponse {
  recommendations: Recommendation[];
  stats: {
    total: number;
    nuevas: number;
    aplicadas: number;
    descartadas: number;
    criticas: number;
  };
}

const Recommendations = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // MULTI-CLIENTE: Obtener URL dinámica del cliente actual
      let apiUrl: string;
      try {
        const clientConfig = getCurrentClientConfig();
        apiUrl = clientConfig.recommendationsApiUrl;
      } catch (clientError) {
        throw new Error('No se pudo obtener la configuración del cliente. Verifica que hayas iniciado sesión correctamente.');
      }

      if (!apiUrl) {
        throw new Error('URL de recomendaciones no configurada para el cliente actual');
      }

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const apiData: ApiResponse = await response.json();
      setData(apiData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las recomendaciones');
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const handleCardClick = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleCloseExpanded = () => {
    setExpandedCard(null);
  };

  const getPriorityColor = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case 'alto':
        return 'bg-red-500 text-white';
      case 'medio':
        return 'bg-yellow-500 text-white';
      case 'bajo':
        return 'bg-green-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const getPriorityText = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case 'alto':
        return 'Alto';
      case 'medio':
        return 'Medio';
      case 'bajo':
        return 'Bajo';
      default:
        return 'Medio';
    }
  };

  const getPriorityIcon = (impacto: string) => {
    switch (impacto.toLowerCase()) {
      case 'alto':
        return <AlertTriangle className="w-5 h-5" />;
      case 'medio':
        return <CheckCircle className="w-5 h-5" />;
      case 'bajo':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado.toLowerCase()) {
      case 'nueva':
        return 'bg-blue-500';
      case 'aplicada':
        return 'bg-green-500';
      case 'descartada':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const metrics = data ? [
    { label: 'Total', value: data.stats.total, color: 'bg-muted text-foreground' },
    { label: 'Nuevas', value: data.stats.nuevas, color: 'bg-primary text-primary-foreground' },
    { label: 'Aplicadas', value: data.stats.aplicadas, color: 'bg-green-500 text-white' },
    { label: 'Críticas', value: data.stats.criticas, color: 'bg-red-500 text-white' }
  ] : [
    { label: 'Total', value: 0, color: 'bg-muted text-foreground' },
    { label: 'Nuevas', value: 0, color: 'bg-primary text-primary-foreground' },
    { label: 'Aplicadas', value: 0, color: 'bg-green-500 text-white' },
    { label: 'Críticas', value: 0, color: 'bg-red-500 text-white' }
  ];

  const recommendations = data?.recommendations || [];

  const filteredRecommendations = recommendations.filter(rec =>
    rec.mensaje.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const expandedRecommendation = expandedCard ? recommendations.find(rec => rec.id === expandedCard) : null;

  const openModal = (rec: Recommendation) => {
    setSelectedRecommendation(rec);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
            <span className="text-foreground">Cargando recomendaciones...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-destructive mb-4">
            <span className="text-lg">⚠️ Error al cargar recomendaciones</span>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} className="gradient-bg hover:opacity-90 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container gradient-recommendations">
      <div className="page-content">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Recomendaciones IA</h1>
            <p className="text-muted-foreground">
              Insights estratégicos y oportunidades detectadas por nuestros agentes
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" className="border-input hover:bg-accent">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
            <Button variant="outline" size="sm" className="border-input hover:bg-accent">
              <Calendar className="w-4 h-4 mr-2" />
              Fecha
            </Button>
            <div className="flex border border-border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((metric, index) => (
            <Card key={index} className="bg-card/95 backdrop-blur-sm border-border hover-lift animate-slide-in-up shadow-md" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-4 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${metric.color} mb-2 animate-counter`} style={{ animationDelay: `${index * 0.2}s` }}>
                  <span className="text-xl font-bold">{metric.value}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{metric.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm" className="bg-primary text-primary-foreground">
              Todas
              <Badge className="ml-2 bg-accent text-accent-foreground">
                {recommendations.length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm" className="border-input hover:bg-accent">
              Nuevas
              <Badge className="ml-2 bg-blue-500 text-white">
                {recommendations.filter(r => r.estado.toLowerCase() === 'nueva').length}
              </Badge>
            </Button>
            <Button variant="outline" size="sm" className="border-input hover:bg-accent">
              Aplicadas
              <Badge className="ml-2 bg-green-500 text-white">
                {recommendations.filter(r => r.estado.toLowerCase() === 'aplicada').length}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Recommendations Grid/List */}
        <div className={
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" 
            : "space-y-4"
        }>
          {filteredRecommendations.map((rec, index) => (
            <Card
              key={rec.id}
              className={`bg-card/95 backdrop-blur-sm border-border hover:border-primary/50 cursor-pointer animate-slide-in-up hover-lift shadow-md ${
                viewMode === 'list' ? 'p-4' : ''
              }`}
              onClick={() => openModal(rec)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className={viewMode === 'list' ? 'pb-2' : ''}>
                <div className={`flex ${viewMode === 'list' ? 'items-center' : 'items-start'} justify-between gap-4`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className={`text-foreground ${viewMode === 'list' ? 'text-lg' : 'text-base'} truncate`}>
                        {rec.mensaje}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground truncate">
                        {rec.categoria} • {rec.fecha}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={`text-xs ${getPriorityColor(rec.impacto)}`}>
                      {rec.impacto}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(rec.estado)}`}>
                      {rec.estado}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              {viewMode === 'grid' && (
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 truncate-3">
                    {rec.descripcion}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">{rec.estimatedRevenue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground">
                        #{rec.prioridad}
                      </span>
                    </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                      Ver detalles
                    </Button>
                  </div>
                </CardContent>
              )}

              {viewMode === 'list' && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate flex-1 pr-4">
                    {rec.descripcion}
                  </p>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground font-medium">{rec.estimatedRevenue}</span>
                    </div>
                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                      Ver detalles
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredRecommendations.length === 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No hay recomendaciones</h3>
              <p className="text-muted-foreground">
                Los agentes están analizando tus datos. Las recomendaciones aparecerán aquí cuando estén listas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recommendation Detail Modal */}
      <Dialog open={!!selectedRecommendation} onOpenChange={() => setSelectedRecommendation(null)}>
        <DialogContent className="max-w-2xl bg-card border-border">
          {selectedRecommendation && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl text-foreground">{selectedRecommendation.mensaje}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedRecommendation.categoria} • {selectedRecommendation.fecha}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge className={getPriorityColor(selectedRecommendation.impacto)}>
                    {getPriorityText(selectedRecommendation.impacto)}
                  </Badge>
                  <Badge className={getStatusColor(selectedRecommendation.estado)}>
                    {selectedRecommendation.estado}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">Descripción</h4>
                  <p className="text-muted-foreground">{selectedRecommendation.descripcion}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Impacto Estimado</h4>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-bold text-green-600">{selectedRecommendation.estimatedRevenue}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Prioridad</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-cyan-600">#{selectedRecommendation.prioridad}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-2">Análisis Detallado</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">{selectedRecommendation.descripcion}</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedRecommendation(null)}>
                  Cerrar
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Aplicar Recomendación
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recommendations;
