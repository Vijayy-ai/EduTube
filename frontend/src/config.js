// Configuration file for API endpoints and other constants
const config = {
    // API URL for backend services
    API_URL: process.env.REACT_APP_API_URL || 'https://edutube-backend.onrender.com/api',
    
    // Authentication API URL
    AUTH_API_URL: process.env.REACT_APP_AUTH_API_URL || 'https://edutube-backend.onrender.com/api-token-auth',
    
    // Default values
    DEFAULT_PAGINATION_LIMIT: 10,
    
    // Feature flags
    ENABLE_NFT_FEATURES: true,
    ENABLE_ADVANCED_QUIZ: true,
};

export default config; 