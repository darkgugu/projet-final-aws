const API_BASE = 'https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api';

export const getAllClients = async () => {
    const res = await fetch(`${API_BASE}/users`);
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
};

export const updateSubscription = async (userId, newStatus) => {
    const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionStatus: newStatus })
    });
    if (!res.ok) throw new Error('Failed to update subscription');
    return res.json();
};
