import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { MainLayout } from './layouts/MainLayout';
import { Catalog } from './pages/Catalog';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ConfirmAccount } from './pages/ConfirmAccount';
import { ClientDashboard } from './pages/client/ClientDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { getCurrentUser } from './services/authService';

const PrivateRoute = ({ children, role }) => {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/catalog" replace />;
  return children;
};

const Home = () => {
    const user = getCurrentUser();
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user?.role === 'client') return <Navigate to="/client/dashboard" replace />;
    
    return (
      <div className="container animate-fade-in" style={{ padding: '6rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Bienvenue à la Médiathèque
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '3rem', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
            Le portail moderne pour réserver, emprunter, et gérer votre collection de livres et de DVDs.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="/login" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Se Connecter</a>
          <a href="/catalog" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Voir le Catalogue</a>
        </div>
        
        {/* Decorative elements */}
        <div style={{ marginTop: '5rem', display: 'flex', justifyContent: 'center', gap: '2rem', opacity: 0.6 }}>
            <div className="glass-panel" style={{ padding: '2rem', width: '200px' }}>📘 Livres</div>
            <div className="glass-panel" style={{ padding: '2rem', width: '200px' }}>💿 DVDs</div>
            <div className="glass-panel" style={{ padding: '2rem', width: '200px' }}>🚀 Réservations Rapides</div>
        </div>
      </div>
    );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/confirm" element={<ConfirmAccount />} />
          <Route path="/catalog" element={<Catalog />} />

          {/* Client Routes */}
          <Route path="/client/dashboard" element={
            <PrivateRoute role="client">
              <ClientDashboard />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
