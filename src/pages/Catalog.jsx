import { useState, useEffect } from 'react';
import { getCatalog } from '../services/mediaService';
import { reserveMedia, borrowMedia } from '../services/loanService';
import { getCurrentUser } from '../services/authService';
import { MediaCard } from '../components/MediaCard';

export const Catalog = () => {
    const [medias, setMedias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [toast, setToast] = useState('');
    
    const user = getCurrentUser();
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchCatalogAndUser = async () => {
            setLoading(true);
            try {
                const [mediaData, usersData] = await Promise.all([
                    getCatalog(),
                    user ? import('../services/userService').then(m => m.getAllClients()) : Promise.resolve(null)
                ]);
                
                setMedias(mediaData);
                
                if (usersData && user) {
                    const profile = usersData.find(u => u.userId === user.id);
                    setUserProfile(profile);
                }
            } catch (err) {
                console.error(err);
            }
            setLoading(false);
        };
        fetchCatalogAndUser();
    }, [user?.id]);

    const handleReserve = async (mediaId) => {
        if (!user) {
            alert("Veuillez vous connecter pour réserver.");
            return;
        }
        if (userProfile && userProfile.subscriptionStatus === 'expired') {
            alert("Votre abonnement a expiré. Veuillez le renouveler dans votre tableau de bord.");
            return;
        }

        try {
            await reserveMedia(mediaId, user.id);
            setToast('Réservation effectuée avec succès !');
            setTimeout(() => setToast(''), 3000);
            
            // Optimistic update
            setMedias(prev => prev.map(m => m.mediaId === mediaId ? { ...m, status: 'reserved' } : m));
        } catch (error) {
            console.error(error);
        }
    };

    const handleBorrow = async (mediaId) => {
        if (!user) {
            alert("Veuillez vous connecter pour emprunter.");
            return;
        }
        if (userProfile && userProfile.subscriptionStatus === 'expired') {
            alert("Votre abonnement a expiré. Veuillez le renouveler dans votre tableau de bord.");
            return;
        }

        try {
            await borrowMedia(mediaId, user.id);
            setToast('Emprunt effectué avec succès !');
            setTimeout(() => setToast(''), 3000);
            
            // Optimistic update
            setMedias(prev => prev.map(m => m.mediaId === mediaId ? { ...m, status: 'loaned' } : m));
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'emprunt.");
        }
    };

    const displayMedias = medias.filter(m => filter === 'all' ? true : m.type === filter);

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: 0 }}>Catalogue de la Médiathèque</h1>
                
                <select 
                    className="form-input" 
                    style={{ width: 'auto', display: 'inline-block' }} 
                    value={filter} 
                    onChange={e => setFilter(e.target.value)}
                >
                    <option value="all">Tous les médias</option>
                    <option value="book">Livres</option>
                    <option value="dvd">DVDs</option>
                </select>
            </div>

            {toast && (
                <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.4)', marginBottom: '2rem' }}>
                    {toast}
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>Chargement du catalogue...</div>
            ) : (
                <div className="grid-cards">
                    {displayMedias.map(media => (
                        <MediaCard key={media.mediaId} media={media} onReserve={handleReserve} onBorrow={handleBorrow} userRole={user ? user.role : null} />
                    ))}
                </div>
            )}
        </div>
    );
};
