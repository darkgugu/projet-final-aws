import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/authService';
import { LogOut, User, Library, ShieldAlert } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass-panel">
      <div className="container nav-container">
        <Link to="/" className="nav-logo">
          <Library className="icon" size={28} />
          <span>Médiathèque</span>
        </Link>
        <div className="nav-links">
          <Link to="/catalog" className="nav-link">Catalogue</Link>
          
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="nav-link admin-link">
                  <ShieldAlert size={18} /> Admin
                </Link>
              )}
              {user.role === 'client' && (
                <Link to="/client/dashboard" className="nav-link">
                  <User size={18} /> Mon Compte
                </Link>
              )}
              <button onClick={handleLogout} className="btn btn-secondary btn-sm logout-btn">
                <LogOut size={16} /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Se Connecter</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
