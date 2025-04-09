const config = {
    API_URL: (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/$/, ''),
    AUTH_API_URL: process.env.REACT_APP_AUTH_API_URL || 'http://localhost:8000/api-token-auth/',
    YOUTUBE_API_KEY: process.env.REACT_APP_YOUTUBE_API_KEY,
    THIRDWEB_CLIENT_ID: process.env.REACT_APP_THIRDWEB_CLIENT_ID,
    THIRDWEB_CHAIN: process.env.REACT_APP_THIRDWEB_CHAIN || 'polygon-mumbai',
};

export default config; 