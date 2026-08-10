import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from '@/components/layout/AppLayout';
import StockControl from '@/pages/StockControl';
import MaterialOutput from '@/pages/MaterialOutput';
import Replenishment from '@/pages/Replenishment';
import Statistics from '@/pages/Statistics';
import PriceHistory from '@/pages/PriceHistory';
import Labels from '@/pages/Labels';
import Charts from '@/pages/Charts';
import Alerts from '@/pages/Alerts';
import Backup from '@/pages/Backup';
import Employees from '@/pages/Employees';
import DailyHistory from '@/pages/DailyHistory';
import MonthlyReport from '@/pages/MonthlyReport';
import PurchaseRequests from '@/pages/PurchaseRequests';
import AccessManagement from '@/pages/AccessManagement';
import Help from '@/pages/Help';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<StockControl />} />
        <Route path="/saida" element={<MaterialOutput />} />
        <Route path="/reposicao" element={<Replenishment />} />
        <Route path="/estatisticas" element={<Statistics />} />
        <Route path="/historico-precos" element={<PriceHistory />} />
        <Route path="/graficos" element={<Charts />} />
        <Route path="/etiquetas" element={<Labels />} />
        <Route path="/alertas" element={<Alerts />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/funcionarios" element={<Employees />} />
        <Route path="/historico-diario" element={<DailyHistory />} />
        <Route path="/relatorio-mensal" element={<MonthlyReport />} />
        <Route path="/solicitacoes-compra" element={<PurchaseRequests />} />
        <Route path="/gerenciar-acessos" element={<AccessManagement />} />
        <Route path="/ajuda" element={<Help />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App