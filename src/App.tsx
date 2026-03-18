import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { RecibosProvider } from "@/contexts/RecibosContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import SystemGuard from "@/components/SystemGuard";
import FinanceiroGuard from "@/components/FinanceiroGuard";
import FinanceiroLayout from "@/components/FinanceiroLayout";
import RecibosLayout from "@/components/recibos/RecibosLayout";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import EmissaoReciboPage from "./pages/recibos/EmissaoReciboPage";
import ClientesReciboPage from "./pages/recibos/ClientesReciboPage";
import ServicosReciboPage from "./pages/recibos/ServicosReciboPage";
import DashboardReciboPage from "./pages/recibos/DashboardReciboPage";
import RelatoriosReciboPage from "./pages/recibos/RelatoriosReciboPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AuthProvider>
        <RecibosProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              {/* All routes below require system auth */}
              <Route element={<SystemGuard />}>
                <Route path="/" element={<HomePage />} />

                {/* Recibos module */}
                <Route path="/recibos" element={<RecibosLayout />}>
                  <Route index element={<EmissaoReciboPage />} />
                  <Route path="clientes" element={<ClientesReciboPage />} />
                  <Route path="servicos" element={<ServicosReciboPage />} />
                  <Route path="dashboard" element={<DashboardReciboPage />} />
                  <Route path="relatorios" element={<RelatoriosReciboPage />} />
                </Route>

                {/* Financial module */}
                <Route path="/financeiro" element={<FinanceiroGuard />}>
                  <Route element={<FinanceiroLayout />}>
                    <Route index element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  </Route>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </RecibosProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
