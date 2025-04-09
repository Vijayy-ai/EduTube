import axios from 'axios';

// Configure axios interceptors for consistent auth handling
const setupAxiosInterceptors = () => {
  // Request interceptor to add auth token to all requests
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Token ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response && error.response.status === 401) {
        // Clear token on 401 Unauthorized errors (except for login/register endpoints)
        const isAuthEndpoint = 
          error.config.url.includes('/login') || 
          error.config.url.includes('/register') ||
          error.config.url.includes('/api-token-auth');
        
        if (!isAuthEndpoint) {
          console.warn('Authentication failed. Redirecting to login...');
          localStorage.removeItem('token');
          
          // Only redirect if we're not already on the login page
          if (!window.location.pathname.includes('/login')) {
            // Save the current location to redirect back after login
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            window.location.href = '/login';
          }
        }
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
