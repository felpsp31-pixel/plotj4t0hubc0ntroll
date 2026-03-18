import { Navigate, Outlet } from 'react-router-dom';

const FinanceiroGuard = () => {
  const authed = sessionStorage.getItem('financial_auth') === 'true';
  if (!authed) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default FinanceiroGuard;
