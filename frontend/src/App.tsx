import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DockProvider } from './context/DockContext';
import { RepairProvider } from './context/RepairContext';
import { ToastProvider } from './context/ToastContext';
import { useAuth } from './context/AuthContext';
import type { ReactNode } from 'react';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import OperatorDock from './pages/OperatorDock';
import Ships from './pages/Ships';
import ShipDetail from './pages/ShipDetail';
import Repairs from './pages/Repairs';
import RepairDetail from './pages/RepairDetail';
import TaskDetail from './pages/TaskDetail';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import ToastContainer from './components/ui/Toast';
import './App.css';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Загрузка...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="repairs" element={<Repairs />} />
        <Route path="repairs/:id" element={<RepairDetail />} />
        <Route path="repairs/:repairId/tasks/:taskId" element={<TaskDetail />} />
        
        {(user?.role === 'admin' || user?.role === 'dispatcher') && (
          <>
            <Route path="ships" element={<Ships />} />
            <Route path="ships/:id" element={<ShipDetail />} />
          </>
        )}
        
        {user?.role === 'admin' && (
          <>
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="settings" element={<Settings />} />
          </>
        )}
        
        {(user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator' || user?.role === 'master') && (
          <>
            <Route path="calendar" element={<Calendar />} />
            <Route path="reports" element={<Reports />} />
          </>
        )}
        
        {(user?.role === 'admin' || user?.role === 'dispatcher' || user?.role === 'operator') && (
          <>
            <Route path="ships" element={<Ships />} />
            <Route path="ships/:id" element={<ShipDetail />} />
          </>
        )}
        
        {(user?.role === 'worker' || user?.role === 'master' || user?.role === 'dispatcher') && (
          <Route path="tasks" element={<Tasks />} />
        )}
        
        {user?.role === 'operator' && (
          <Route path="my-dock" element={<OperatorDock />} />
        )}
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <DockProvider>
            <RepairProvider>
              <AppRoutes />
              <ToastContainer />
            </RepairProvider>
          </DockProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;