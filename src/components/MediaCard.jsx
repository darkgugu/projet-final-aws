import { Book, Disc } from 'lucide-react';
import './Card.css';

export const MediaCard = ({ media, onReserve, onBorrow, onLoan, onReturn, userRole }) => {
  const isBook = media.type === 'book';

  return (
    <div className="card glass-panel animate-fade-in">
      <div className="card-img-wrapper">
        <img src={media.coverUrl} alt={media.title} className="card-img" />
        <div className="card-badge">
          {media.status === 'available' && <span className="badge badge-success">Disponible</span>}
          {media.status === 'reserved' && <span className="badge badge-warning">Réservé</span>}
          {media.status === 'loaned' && <span className="badge badge-danger">Emprunté</span>}
        </div>
      </div>
      <div className="card-content">
        <div className="card-type">
          {isBook ? <Book size={16} /> : <Disc size={16} />}
          <span>{isBook ? 'Livre' : 'DVD'}</span>
          <span className="card-year">• {media.year}</span>
        </div>
        <h3 className="card-title">{media.title}</h3>
        <p className="card-author">{isBook ? media.author : media.director}</p>
        <p className="card-description">{media.description}</p>
        
        <div className="card-actions">
          {userRole !== 'admin' && (
            <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
              {media.status === 'available' && (
                <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => onBorrow(media.mediaId)}>
                  Emprunter
                </button>
              )}
              {media.status === 'loaned' && (
                <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => onReserve(media.mediaId)}>
                  Réserver
                </button>
              )}
              {media.status === 'reserved' && (
                <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                  Déjà réservé
                </button>
              )}
            </div>
          )}
          
          {userRole === 'admin' && (
             <div className="admin-actions">
               {media.status === 'reserved' && (
                 <button className="btn btn-primary btn-sm" onClick={() => onLoan(media.mediaId)}>
                   Valider Emprunt
                 </button>
               )}
               {media.status === 'loaned' && (
                 <button className="btn btn-secondary btn-sm" onClick={() => onReturn(media.mediaId)}>
                   Retourner
                 </button>
               )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
