import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const authData = await login(email, password);
      if (authData.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/client/dashboard');
      }
    } catch (err) {
      if (err.code === 'UserNotConfirmedException') {
        setError('Votre compte n\'est pas encore confirmé. Vérifiez votre email.');
      } else if (err.code === 'NotAuthorizedException') {
        setError('Identifiants incorrects.');
      } else if (err.message === 'NEW_PASSWORD_REQUIRED') {
        setError('Un changement de mot de passe est requis. Contactez l\'administrateur.');
      } else {
        setError(err.message || 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '4rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Connexion</h2>
        
        {error && (
          <div style={{ 
            padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input 
              type="email" 
              className="form-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="vous@exemple.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input 
              type="password" 
              className="form-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              required 
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
};
