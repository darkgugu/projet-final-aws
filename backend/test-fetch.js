const fetchUser = async () => {
    try {
        const res = await fetch('https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api/users');
        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Headers:', [...res.headers.entries()]);
        console.log('Body:', text);
    } catch (err) {
        console.error('Fetch Failed:', err);
    }
};

fetchUser();
