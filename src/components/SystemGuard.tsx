import { Navigate, Outlet } from 'react-router-dom';

const SystemGuard = () => {
  const authed = sessionStorage.getItem('system_auth') === 'true';
  if (!authed) return <Navigate to="/login" replace />;
  return <Outlet />;
};

export default SystemGuard;
