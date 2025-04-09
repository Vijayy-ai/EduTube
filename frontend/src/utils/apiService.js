import axios from 'axios';
import config from '../config';


const api = {
  /**
   * Get the authentication token from local storage
   * @returns {string|null} The authentication token or null if not found
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get the base headers for API requests
   * @returns {Object} Headers object with Authorization token if available
   */
  getHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Token ${token}` } : {})
    };
  },

  /**
   * Normalize endpoint to prevent double slashes
   * @param {string} endpoint - The API endpoint to normalize
   * @returns {string} Normalized endpoint
   */
  normalizeEndpoint(endpoint) {
    // Remove leading slash if present since API_URL already ends with a slash
    return endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  },

  /**
   * Make a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise with response data
   */
  async get(endpoint, params = {}) {
    try {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await axios.get(`${config.API_URL}/${normalizedEndpoint}`, {
        headers: this.getHeaders(),
        params
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Make a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} Promise with response data
   */
  async post(endpoint, data = {}) {
    try {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await axios.post(`${config.API_URL}/${normalizedEndpoint}`, data, {
        headers: this.getHeaders()
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Make a PUT request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} Promise with response data
   */
  async put(endpoint, data = {}) {
    try {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await axios.put(`${config.API_URL}/${normalizedEndpoint}`, data, {
        headers: this.getHeaders()
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Make a PATCH request to the API
   * @param {string} endpoint - The API endpoint
   * @param {Object} data - Request body data
   * @returns {Promise} Promise with response data
   */
  async patch(endpoint, data = {}) {
    try {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await axios.patch(`${config.API_URL}/${normalizedEndpoint}`, data, {
        headers: this.getHeaders()
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Make a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @returns {Promise} Promise with response data
   */
  async delete(endpoint) {
    try {
      const normalizedEndpoint = this.normalizeEndpoint(endpoint);
      const response = await axios.delete(`${config.API_URL}/${normalizedEndpoint}`, {
        headers: this.getHeaders()
      });
      return response;
    } catch (error) {
      return this.handleError(error);
    }
  },

  /**
   * Handle API errors
   * @param {Error} error - The error object
   * @throws {Error} Rethrows the error after handling
   */
  handleError(error) {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        console.warn('Authentication token expired or invalid. Redirecting to login...');
        // Clear token and redirect to login
        localStorage.removeItem('token');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          // Save the current location to redirect back after login
          localStorage.setItem('redirectAfterLogin', window.location.pathname);
          window.location.href = '/login';
        }
      }
      
      // Log error details
      console.error('API Error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

export default api;