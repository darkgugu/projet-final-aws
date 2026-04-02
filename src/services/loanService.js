const API_BASE = 'https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api';

export const getLoansByUser = async (userId) => {
    const res = await fetch(`${API_BASE}/loans?userId=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch loans');
    return res.json();
};

export const getAllLoans = async () => {
    const res = await fetch(`${API_BASE}/loans`);
    if (!res.ok) throw new Error('Failed to fetch loans');
    return res.json();
};

export const reserveMedia = async (mediaId, userId) => {
    const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reserve', mediaId, userId })
    });
    if (!res.ok) throw new Error('Failed to reserve media');
    return res.json();
};

export const borrowMedia = async (mediaId, userId) => {
    const res = await fetch(`${API_BASE}/loans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'loan', mediaId, userId })
    });
    if (!res.ok) throw new Error('Failed to borrow media');
    return res.json();
};

export const processLoan = async (loanId) => {
    const res = await fetch(`${API_BASE}/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process' })
    });
    if (!res.ok) throw new Error('Failed to process loan');
    return res.json();
};

export const returnMedia = async (loanId) => {
    const res = await fetch(`${API_BASE}/loans/${loanId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'return' })
    });
    if (!res.ok) throw new Error('Failed to return media');
    return res.json();
};
