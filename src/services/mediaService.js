const API_BASE = 'https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api';

export const getCatalog = async () => {
    const res = await fetch(`${API_BASE}/media`);
    if (!res.ok) throw new Error('Failed to fetch catalog');
    return res.json();
};

export const addMedia = async (mediaData) => {
    const res = await fetch(`${API_BASE}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mediaData)
    });
    if (!res.ok) throw new Error('Failed to add media');
    return res.json();
};

export const updateMediaStatus = async (mediaId, newStatus) => {
    const res = await fetch(`${API_BASE}/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update media');
    return res.json();
};

export const deleteMedia = async (mediaId) => {
    const res = await fetch(`${API_BASE}/media/${mediaId}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete media');
    return res.json();
};

export const getUploadUrl = async (fileName, contentType) => {
    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, contentType })
    });
    if (!res.ok) throw new Error('Failed to get upload URL');
    return res.json();
};
