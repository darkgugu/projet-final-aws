import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { confirmAccount } from '../services/authService';

export const ConfirmAccount = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleConfirm = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await confirmAccount(email, code);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.code === 'CodeMismatchException') {
        setError('Code de vérification incorrect.');
      } else if (err.code === 'ExpiredCodeException') {
        setError('Le code a expiré. Veuillez demander un nouveau code.');
      } else {
        setError(err.message || 'Erreur lors de la confirmation.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '420px', marginTop: '4rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>Confirmer votre compte</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Un code de vérification a été envoyé à votre adresse email.
        </p>

        {success ? (
          <div style={{ 
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)',
            color: 'var(--success)', textAlign: 'center'
          }}>
            ✓ Compte confirmé ! Redirection vers la connexion...
          </div>
        ) : (
          <>
            {error && (
              <div style={{ 
                padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            <form onSubmit={handleConfirm}>
              <div className="form-group">
                <label className="form-label">Adresse Email</label>
                <input 
                  type="email" className="form-input" value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="vous@exemple.com" required 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Code de vérification</label>
                <input 
                  type="text" className="form-input" value={code}
                  onChange={(e) => setCode(e.target.value)} 
                  placeholder="123456" required
                  style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Vérification...' : 'Confirmer le compte'}
              </button>
            </form>

            <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Link to="/login" style={{ color: 'var(--primary)' }}>Retour à la connexion</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
