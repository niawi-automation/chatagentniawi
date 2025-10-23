
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AgentProvider } from "@/contexts/AgentContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ConfirmEmail from "./pages/ConfirmEmail";
import DashboardLayout from "./components/DashboardLayout";
import Chat from "./pages/Chat";
import Recommendations from "./pages/Recommendations";
import Integrations from "./pages/Integrations";
import Automations from "./pages/Automations";
import AutomationsDashboard from "./pages/automations/AutomationsDashboard";
import WipProcess from "./pages/automations/WipProcess";
import PoBuysProcess from "./pages/automations/PoBuysProcess";
import PackingListProcess from "./pages/automations/PackingListProcess";
import { AutomationHistory } from "./components/AutomationHistory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AgentsDashboard from "./pages/AgentsDashboard";

const queryClient = new QueryClient();


const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AgentProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/confirm-email" element={<ConfirmEmail />} />
                
                {/* Rutas protegidas */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Chat />} />
                  <Route path="chat" element={<Chat />} />
                  <Route path="agents" element={<AgentsDashboard />} />
                  <Route path="recommendations" element={<Recommendations />} />
                  <Route path="integrations" element={<Integrations />} />
                  <Route path="automations" element={<Automations />}>
                    <Route index element={<Navigate to="dashboard" replace />} />
                    <Route path="dashboard" element={<AutomationsDashboard />} />
                    <Route path="wip" element={<WipProcess />} />
                    <Route path="po-buys" element={<PoBuysProcess />} />
                    <Route path="packing-list" element={<PackingListProcess />} />
                    <Route path="history" element={<AutomationHistory />} />
                  </Route>
                  <Route path="settings" element={<Settings />} />
                </Route>
                
                {/* Ruta 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </AgentProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
