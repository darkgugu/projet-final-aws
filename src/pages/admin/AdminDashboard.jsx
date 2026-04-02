import { useState, useEffect } from 'react';
import { getCatalog, addMedia, deleteMedia } from '../../services/mediaService';
import { getAllLoans, processLoan, returnMedia } from '../../services/loanService';
import { getAllClients } from '../../services/userService';
import { MediaCard } from '../../components/MediaCard';

const AddMediaModal = ({ onClose, onAdd }) => {
    const [form, setForm] = useState({ type: 'book', title: '', author: '', director: '', year: new Date().getFullYear(), description: '' });
    const [coverFile, setCoverFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalCoverUrl = 'https://images.unsplash.com/photo-1614332287897-cdc485fa562d?q=80&w=600&auto=format&fit=crop';
            
            if (coverFile) {
                // 1. Get presigned URL
                const { uploadUrl, publicUrl } = await import('../../services/mediaService').then(m => m.getUploadUrl(coverFile.name, coverFile.type));
                
                // 2. Upload file directly to S3
                await fetch(uploadUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': coverFile.type },
                    body: coverFile
                });
                
                finalCoverUrl = publicUrl;
            }

            await onAdd({ ...form, coverUrl: finalCoverUrl });
            onClose();
        } catch (err) {
            alert('Erreur: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const overlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
    const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--surface-border)', background: 'var(--surface)', color: 'var(--text-primary)', fontSize: '0.95rem' };

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div className="glass-panel animate-fade-in" style={{ padding: '2rem', width: '500px', maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Ajouter un média</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            <option value="book">📘 Livre</option>
                            <option value="dvd">💿 DVD</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Titre</label>
                        <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Le Petit Prince" required />
                    </div>
                    {form.type === 'book' ? (
                        <div className="form-group">
                            <label className="form-label">Auteur</label>
                            <input style={inputStyle} value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Antoine de Saint-Exupéry" required />
                        </div>
                    ) : (
                        <div className="form-group">
                            <label className="form-label">Réalisateur</label>
                            <input style={inputStyle} value={form.director} onChange={e => setForm({ ...form, director: e.target.value })} placeholder="Christopher Nolan" required />
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Année</label>
                        <input type="number" style={inputStyle} value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} min="1800" max="2030" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Résumé du média..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Image de couverture</label>
                        <input type="file" style={inputStyle} accept="image/*" onChange={e => setCoverFile(e.target.files[0])} />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? 'Ajout en cours...' : 'Ajouter'}
                        </button>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>Annuler</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('media');
    const [catalog, setCatalog] = useState([]);
    const [loans, setLoans] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        const [catData, loanData, usersData] = await Promise.all([
            getCatalog(),
            getAllLoans(),
            getAllClients()
        ]);
        setCatalog(catData);
        setLoans(loanData);
        setUsers(usersData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddMedia = async (mediaData) => {
        await addMedia(mediaData);
        fetchData();
    };

    const handleDeleteMedia = async (mediaId) => {
        if (confirm('Supprimer ce média ?')) {
            await deleteMedia(mediaId);
            fetchData();
        }
    };

    const handleProcessLoan = async (mediaId) => {
        const res = loans.find(l => l.mediaId === mediaId && l.status === 'reserved');
        if (res) {
            await processLoan(res.loanId);
            fetchData();
        } else {
            alert('Aucune réservation trouvée pour ce média.');
        }
    };

    const handleReturnMedia = async (mediaId) => {
        const loan = loans.find(l => l.mediaId === mediaId && (l.status === 'active' || l.status === 'late'));
        if (loan) {
            await returnMedia(loan.loanId);
            fetchData();
        }
    };

    const navStyles = { display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem' };
    const tabStyles = (tab) => ({
        padding: '1rem 2rem', cursor: 'pointer', borderBottom: activeTab === tab ? '3px solid var(--primary)' : 'none',
        color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600
    });

    return (
        <div className="container animate-fade-in" style={{ paddingBottom: '3rem' }}>
            <h1 style={{ marginBottom: '2rem' }}>Administration</h1>

            <div style={navStyles}>
                <div style={tabStyles('media')} onClick={() => setActiveTab('media')}>Inventaire Médias</div>
                <div style={tabStyles('loans')} onClick={() => setActiveTab('loans')}>Gestion Emprunts ({loans.filter(l=>l.status!=='returned').length})</div>
                <div style={tabStyles('users')} onClick={() => setActiveTab('users')}>Utilisateurs ({users.length})</div>
            </div>

            {loading ? <p>Chargement...</p> : (
                <>
                    {activeTab === 'media' && (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                                <h2>Catalogue complet</h2>
                                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>+ Ajouter Média</button>
                            </div>
                            {catalog.length === 0 && <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>Aucun média dans le catalogue. Cliquez sur "Ajouter Média" pour commencer.</p>}
                            <div className="grid-cards">
                                {catalog.map(media => (
                                    <MediaCard 
                                        key={media.mediaId} 
                                        media={media} 
                                        userRole="admin" 
                                        onLoan={handleProcessLoan}
                                        onReturn={handleReturnMedia}
                                        onDelete={handleDeleteMedia}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'loans' && (
                        <div>
                            <h2>Tous les mouvements</h2>
                            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}>ID Prêt</th>
                                            <th style={{ padding: '1rem' }}>Média ID</th>
                                            <th style={{ padding: '1rem' }}>Utilisateur</th>
                                            <th style={{ padding: '1rem' }}>Statut</th>
                                            <th style={{ padding: '1rem' }}>Date Retour Prévue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loans.map(loan => (
                                            <tr key={loan.loanId} style={{ borderTop: '1px solid var(--surface-border)' }}>
                                                <td style={{ padding: '1rem' }}>{loan.loanId}</td>
                                                <td style={{ padding: '1rem' }}>{loan.mediaId}</td>
                                                <td style={{ padding: '1rem' }}>{users.find(u => u.userId === loan.userId)?.email || loan.userId}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`badge badge-${loan.status === 'returned'?'success':loan.status==='late'?'danger':loan.status==='reserved'?'warning':'primary'}`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>{loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div>
                            <h2>Utilisateurs et Abonnements</h2>
                            <div className="glass-panel" style={{ overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'rgba(255,255,255,0.05)' }}>
                                        <tr>
                                            <th style={{ padding: '1rem' }}># ID</th>
                                            <th style={{ padding: '1rem' }}>Nom</th>
                                            <th style={{ padding: '1rem' }}>Email</th>
                                            <th style={{ padding: '1rem' }}>Statut Abonnement</th>
                                            <th style={{ padding: '1rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(user => (
                                            <tr key={user.userId} style={{ borderTop: '1px solid var(--surface-border)' }}>
                                                <td style={{ padding: '1rem' }}>{user.userId}</td>
                                                <td style={{ padding: '1rem' }}>{user.name}</td>
                                                <td style={{ padding: '1rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`badge badge-${user.subscriptionStatus === 'active' ? 'success' : 'danger'}`}>
                                                        {user.subscriptionStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <button className="btn btn-secondary btn-sm" disabled={user.subscriptionStatus === 'active'}>Renouveler</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {showAddModal && <AddMediaModal onClose={() => setShowAddModal(false)} onAdd={handleAddMedia} />}
        </div>
    );
};
