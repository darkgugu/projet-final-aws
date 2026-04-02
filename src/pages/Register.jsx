import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

export const Register = () => {
  const [givenName, setGivenName] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [email, setEmail] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    // Format phone number to E.164 if not already
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+33' + formattedPhone.replace(/^0/, '');
    }

    setLoading(true);

    try {
      await register({
        givenName,
        familyName,
        email,
        password,
        birthdate,
        phoneNumber: formattedPhone
      });
      navigate('/confirm', { state: { email } });
    } catch (err) {
      if (err.code === 'UsernameExistsException') {
        setError('Un compte existe déjà avec cet email.');
      } else if (err.code === 'InvalidPasswordException') {
        setError('Le mot de passe ne respecte pas les exigences (majuscule, chiffre, caractère spécial).');
      } else if (err.code === 'InvalidParameterException') {
        setError(err.message);
      } else {
        setError(err.message || "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  const errorBoxStyle = {
    padding: '0.75rem 1rem', marginBottom: '1.5rem', borderRadius: 'var(--radius-md)',
    background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
    color: 'var(--danger)', fontSize: '0.875rem', textAlign: 'center'
  };

  return (
    <div className="container" style={{ maxWidth: '460px', marginTop: '3rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Créer un compte</h2>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Prénom</label>
              <input type="text" className="form-input" value={givenName}
                onChange={(e) => setGivenName(e.target.value)} placeholder="Jean" required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Nom</label>
              <input type="text" className="form-input" value={familyName}
                onChange={(e) => setFamilyName(e.target.value)} placeholder="Dupont" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Adresse Email</label>
            <input type="email" className="form-input" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" required />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date de naissance</label>
              <input type="date" className="form-input" value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)} required />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Téléphone</label>
              <input type="tel" className="form-input" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)} placeholder="06 12 34 56 78" required />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input type="password" className="form-input" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 caractères" required />
          </div>

          <div className="form-group">
            <label className="form-label">Confirmer le mot de passe</label>
            <input type="password" className="form-input" value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Inscription en cours...' : "S'inscrire"}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
};
