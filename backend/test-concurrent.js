const fetchUrls = async () => {
    try {
        const [users, media, loans] = await Promise.all([
            fetch('https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api/users'),
            fetch('https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api/media'),
            fetch('https://onplbwmwga.execute-api.eu-west-3.amazonaws.com/Prod/api/loans')
        ]);
        console.log('Users:', users.status);
        console.log('Media:', media.status);
        console.log('Loans:', loans.status);
    } catch (err) {
        console.error('Fetch Failed:', err);
    }
};

fetchUrls();
