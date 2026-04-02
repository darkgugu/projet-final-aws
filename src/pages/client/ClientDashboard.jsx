import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../services/authService';
import { getLoansByUser, returnMedia } from '../../services/loanService';
import { getCatalog } from '../../services/mediaService';
import { getAllClients, updateSubscription } from '../../services/userService';
import { Book, Disc, Calendar, AlertCircle } from 'lucide-react';

export const ClientDashboard = () => {
    const authUser = getCurrentUser();
    const [userProfile, setUserProfile] = useState(null);
    const [loans, setLoans] = useState([]);
    const [catalog, setCatalog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [renewing, setRenewing] = useState(false);
    const [returning, setReturning] = useState(null);

    const fetchData = async () => {
        if (authUser) {
            setLoading(true);
            const [userLoans, allMedia, allUsers] = await Promise.all([
                getLoansByUser(authUser.id),
                getCatalog(),
                getAllClients()
            ]);
            setLoans(userLoans);
            setCatalog(allMedia);
            const profile = allUsers.find(u => u.userId === authUser.id);
            setUserProfile(profile || { subscriptionStatus: 'expired' });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [authUser?.id]);

    if (!authUser) return <div className="container">Accès Refusé</div>;

    const getMediaInfo = (mediaId) => catalog.find(m => m.mediaId === mediaId) || {};

    const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'late');
    const reservations = loans.filter(l => l.status === 'reserved');

    const handleRenew = async () => {
        setRenewing(true);
        try {
            await updateSubscription(authUser.id, 'active');
            await fetchData();
            alert("Abonnement renouvelé avec succès !");
        } catch (err) {
            alert("Erreur lors du renouvellement : " + err.message);
        } finally {
            setRenewing(false);
        }
    };

    const handleReturn = async (loanId) => {
        setReturning(loanId);
        try {
            await returnMedia(loanId);
            await fetchData();
        } catch (err) {
            alert("Erreur lors du retour : " + err.message);
        } finally {
            setReturning(null);
        }
    };

    const status = userProfile?.subscriptionStatus || 'expired';

    return (
         <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Bonjour, {authUser.name}</h1>
            
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                   <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                       Statut de l'abonnement : 
                       {status === 'active' ? (
                           <span className="badge badge-success">Actif</span>
                       ) : (
                           <span className="badge badge-danger">Expiré</span>
                       )}
                   </h3>
                   
                   {status !== 'active' && (
                       <button 
                           className="btn btn-primary" 
                           onClick={handleRenew} 
                           disabled={renewing}
                       >
                           {renewing ? 'Renouvellement...' : 'Renouveler mon abonnement'}
                       </button>
                   )}
               </div>

               {status === 'expired' && (
                   <p style={{ color: 'var(--danger)', marginTop: '1rem', marginBottom: 0 }}>
                       <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }}/>
                       Veuillez renouveler votre abonnement pour continuer à emprunter des médias.
                   </p>
               )}
            </div>

            {loading ? (
                <div>Chargement de vos informations...</div>
            ) : (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 400px' }}>
                        <h2>Mes Emprunts ({activeLoans.length})</h2>
                        {activeLoans.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Aucun emprunt en cours.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {activeLoans.map(loan => {
                                    const media = getMediaInfo(loan.mediaId);
                                    const isLate = loan.status === 'late' || new Date(loan.dueDate) < new Date();
                                    return (
                                        <div key={loan.loanId} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', border: isLate ? '1px solid var(--danger)' : '' }}>
                                            <div style={{ width: '80px', height: '110px', flexShrink: 0 }}>
                                                <img src={media.coverUrl} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ marginBottom: '0.25rem' }}>{media.title}</h4>
                                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{media.type === 'book' ? 'Livre' : 'DVD'}</p>
                                                <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: isLate ? 'var(--danger)' : 'var(--text-primary)' }}>
                                                    <Calendar size={14} style={{ display: 'inline', marginRight: '0.25rem' }} />
                                                    À rendre avant le: {new Date(loan.dueDate).toLocaleDateString()}
                                                </p>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {isLate && <span className="badge badge-danger">En retard</span>}
                                                    <button 
                                                        className="btn btn-primary btn-sm" 
                                                        onClick={() => handleReturn(loan.loanId)}
                                                        disabled={returning === loan.loanId}
                                                    >
                                                        {returning === loan.loanId ? 'Retour...' : 'Rendre'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: '1 1 400px' }}>
                        <h2>Mes Réservations ({reservations.length})</h2>
                        {reservations.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>Aucune réservation en cours.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reservations.map(res => {
                                    const media = getMediaInfo(res.mediaId);
                                    return (
                                        <div key={res.loanId} className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
                                            <div style={{ width: '60px', height: '80px', flexShrink: 0 }}>
                                                <img src={media.coverUrl} alt={media.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }} />
                                            </div>
                                            <div>
                                                <h4 style={{ marginBottom: '0.25rem' }}>{media.title}</h4>
                                                <span className="badge badge-warning">En attente de retrait</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
         </div>
    );
};
