import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function Automations() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname.endsWith(path);

  return (
    <div className="page-container gradient-automations">
      <div className="page-content">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Automatizaciones</h1>
            <p className="text-muted-foreground">Procesos y resultados</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-niawi-accent text-niawi-accent">Sistema Activo</Badge>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <div className="inline-flex rounded-lg border border-niawi-border bg-niawi-surface/90 backdrop-blur-sm p-1 shadow-md">
            <button
              className={`px-4 py-2 rounded-md text-sm ${isActive('dashboard') ? 'bg-niawi-primary text-white' : 'text-foreground'}`}
              onClick={() => navigate('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${isActive('wip') ? 'bg-niawi-primary text-white' : 'text-foreground'}`}
              onClick={() => navigate('wip')}
            >
              WIP
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${isActive('po-buys') ? 'bg-niawi-primary text-white' : 'text-foreground'}`}
              onClick={() => navigate('po-buys')}
            >
              PO Buys
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${isActive('packing-list') ? 'bg-niawi-primary text-white' : 'text-foreground'}`}
              onClick={() => navigate('packing-list')}
            >
              Packing List
            </button>
            <button
              className={`px-4 py-2 rounded-md text-sm ${isActive('history') ? 'bg-niawi-primary text-white' : 'text-foreground'}`}
              onClick={() => navigate('history')}
            >
              Historial
            </button>
          </div>
        </div>

        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
