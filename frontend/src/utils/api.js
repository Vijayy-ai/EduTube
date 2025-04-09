import axios from 'axios';
import config from '../config';

// In-memory cache for API responses
const memoryCache = new Map();

// Helper to get expiration time from Cache-Control header
const getExpirationFromHeaders = (headers) => {
  const cacheControl = headers['cache-control'];
  if (cacheControl) {
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
    if (maxAgeMatch && maxAgeMatch[1]) {
      return Date.now() + parseInt(maxAgeMatch[1]) * 1000;
    }
  }
  return Date.now() + 5 * 60 * 1000; // Default to 5 minutes
};

// Create local storage cache handler
const localStorageCache = {
  get: (key) => {
    try {
      const cachedItem = localStorage.getItem(`api_cache_${key}`);
      if (cachedItem) {
        const { data, expiration } = JSON.parse(cachedItem);
        if (expiration > Date.now()) {
          console.log(`Using localStorage cache for key: ${key}`);
          return data;
        } else {
          // Clean up expired item
          localStorage.removeItem(`api_cache_${key}`);
        }
      }
    } catch (e) {
      console.error('Error reading from localStorage:', e);
    }
    return null;
  },
  set: (key, data, headers) => {
    try {
      const expiration = getExpirationFromHeaders(headers);
      localStorage.setItem(
        `api_cache_${key}`,
        JSON.stringify({ data, expiration })
      );
    } catch (e) {
      console.error('Error writing to localStorage:', e);
    }
  },
  createKey: (config) => {
    // Create a unique key based on URL and parameters
    const method = config.method || 'get';
    const url = config.url;
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';
    return `${method}:${url}:${params}:${data}`;
  }
};

const API = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to add auth token to requests
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    
    // Special case for YouTube search to ensure it works without auth if needed
    if (config.url && config.url.includes('/search-youtube/')) {
      // Always include token if available for proper user tracking
      console.log('Making YouTube search request with URL:', config.url);
      
      // Check for cached response
      const cacheKey = localStorageCache.createKey(config);
      const cachedData = localStorageCache.get(cacheKey);
      
      if (cachedData) {
        console.log('Using cached YouTube search results');
        
        // Create a new property to indicate this is a cached response
        config.adapter = (config) => {
          return Promise.resolve({
            data: cachedData,
            status: 200,
            statusText: 'OK (Cached)',
            headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'Client' },
            config
          });
        };
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle response errors
API.interceptors.response.use(
  (response) => {
    // Log successful responses in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response [${response.config.method.toUpperCase()} ${response.config.url}]:`, 
        response.status, 
        response.data?.length ? `${response.data.length} items` : '');
    }
    
    // Cache responses that include cache headers
    if (response.headers['cache-control'] && 
        (response.config.url.includes('/search-youtube/') || 
         response.config.url.includes('/courses/'))) {
      
      // Cache in memory first for fastest access
      const cacheKey = localStorageCache.createKey(response.config);
      memoryCache.set(cacheKey, {
        data: response.data,
        expiration: getExpirationFromHeaders(response.headers)
      });
      
      // Also cache in localStorage for persistence between page loads
      localStorageCache.set(cacheKey, response.data, response.headers);
      
      console.log(`Cached API response for: ${response.config.url}`);
    }
    
    return response;
  },
  
  async (error) => {
    // Get the original request
    const originalRequest = error.config;
    
    // For YouTube API errors, try to fetch from cache as fallback
    if (error.response && 
        (error.response.status === 429 || error.response.status === 403) && 
        originalRequest.url.includes('/search-youtube/')) {
      
      console.log('YouTube API limit error, trying to use cache');
      
      // Try memory cache first
      const cacheKey = localStorageCache.createKey(originalRequest);
      const memoryCached = memoryCache.get(cacheKey);
      
      if (memoryCached && memoryCached.expiration > Date.now()) {
        console.log('Using memory cache as fallback for YouTube API limit');
        return Promise.resolve({
          data: memoryCached.data,
          status: 200,
          statusText: 'OK (From Cache)',
          headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'Memory' },
          config: originalRequest
        });
      }
      
      // Try localStorage cache
      const cachedData = localStorageCache.get(cacheKey);
      if (cachedData) {
        console.log('Using localStorage cache as fallback for YouTube API limit');
        return Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (From Cache)',
          headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'LocalStorage' },
          config: originalRequest
        });
      }
      
      // Use sample data as final fallback for YouTube search
      // For now, disable sample data to ensure we see the actual error
      /*
      if (originalRequest.url.includes('/search-youtube/')) {
        console.log('Using sample data as fallback for YouTube API');
        const requestData = JSON.parse(originalRequest.data);
        const query = requestData.query || '';
        const searchType = requestData.search_type || 'video';
        let sampleResults = getSampleSearchResults(query, searchType);
        
        return Promise.resolve({
          data: sampleResults,
          status: 200,
          statusText: 'OK (Sample Data)',
          headers: {},
          config: originalRequest
        });
      }
      */
    }
    
    // Verify response contains meaningful error data
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
      // The request was made and the server responded with an error status
      errorMessage = error.response.data?.error || 
                    error.response.data?.detail || 
                    `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error (No Response):', error.request);
      errorMessage = 'No response received from server. Please check your network connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Setup:', error.message);
      errorMessage = error.message;
    }
    
    error.displayMessage = errorMessage;
    return Promise.reject(error);
  }
);

// Auth endpoints
export const AuthAPI = {
  login: (username, password) => 
    axios.post(config.AUTH_API_URL, { username, password }),
    
  firebaseAuth: (token) => 
    API.post('/firebase-auth/', { token }),
    
  register: (userData) => 
    API.post('/register/', userData),
    
  signOut: () => 
    API.post('/sign-out/'),
    
  me: () => 
    API.get('/me/')
};

// User endpoints
export const UserAPI = {
  getCurrentUser: () => 
    API.get('/me/'),
    
  updateProfile: (userData) => 
    API.patch('/me/', userData)
};

// Course endpoints
export const CourseAPI = {
  getAllCourses: (params = {}) => 
    API.get('/courses/', { params }),
    
  getCourse: (id) => 
    API.get(`/courses/${id}/`),
    
  searchYouTube: async (queryOrId, searchType = 'video', isId = false) => {
    const data = {
      search_type: searchType,
    };
    
    if (isId) {
      console.log(`Searching with ID: ${queryOrId}, type: ${searchType}`);
      if (searchType === 'video') {
        data.video_id = queryOrId;
      } else if (searchType === 'playlist') {
        data.playlist_id = queryOrId;
      }
    } else {
      console.log(`Searching with query: ${queryOrId}, type: ${searchType}`);
      data.query = queryOrId;
    }
    
    // Create a cache key for this specific search
    const cacheKey = `search_${searchType}_${queryOrId}`;
    
    // Check memory cache first (fastest)
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached && memoryCached.expiration > Date.now()) {
      console.log(`Using memory cache for search: ${cacheKey}`);
      return {
        data: memoryCached.data,
        status: 200,
        statusText: 'OK (Memory Cache)',
        headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'Memory' },
      };
    }
    
    // Then check localStorage
    const cachedData = localStorageCache.get(cacheKey);
    if (cachedData) {
      // Add to memory cache for future use
      memoryCache.set(cacheKey, {
        data: cachedData,
        expiration: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
      
      return {
        data: cachedData,
        status: 200,
        statusText: 'OK (LocalStorage Cache)',
        headers: { 'X-Cache': 'HIT', 'X-Cache-Source': 'LocalStorage' },
      };
    }
    
    // Use only the production YouTube search endpoint
    const endpoint = '/search-youtube/';
    
    try {
      console.log(`Using YouTube search endpoint: ${endpoint} with data:`, data);
      
      // Add specific headers for this request to help with debugging
      const response = await API.post(endpoint, data, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'application/json',
        }
      });
      
      // Cache the results
      memoryCache.set(cacheKey, {
        data: response.data,
        expiration: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      });
      
      // Store in localStorage too
      localStorageCache.set(cacheKey, response.data, response.headers);
      
      // Enhanced logging for debugging
      if (process.env.NODE_ENV === 'development') {
        if (Array.isArray(response.data)) {
          console.log(`YouTube search returned ${response.data.length} results. First result format:`, 
            response.data.length > 0 ? Object.keys(response.data[0]) : 'N/A');
        } else {
          console.log(`YouTube search returned non-array response:`, typeof response.data);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`YouTube search error on ${endpoint}:`, error);
      
      // Better error handling for YouTube API issues
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        console.error('Error response headers:', error.response.headers);
        
        // For now, disable sample data to ensure we see the actual error
        // This will force the application to show the real error to the user
        /*
        if (error.response.status === 403 || 
           (error.response.data && 
            (error.response.data.error?.includes('quota') || 
             error.response.data.error?.includes('limit')))) {
          console.error('YouTube API quota exceeded.');
          
          // Return sample data as fallback when API fails
          console.log('Using sample data as fallback');
          const query = data.query || '';
          let sampleResults = getSampleSearchResults(query, searchType);
          
          return {
            data: sampleResults,
            status: 200,
            statusText: 'OK (Sample Data)',
            headers: {},
            config: {}
          };
        }
        */
      }
      
      throw error;
    }
  },
  
  createCourse: (courseData) => 
    API.post('/courses/', courseData),
    
  enrollCourse: (courseId) => 
    API.post(`/courses/${courseId}/enroll/`),
    
  updateProgress: (courseId, data) => 
    API.post(`/user-courses/${courseId}/update_progress/`, data),

  generateQuiz: (courseId, options = {}) =>
    API.post(`/courses/${courseId}/generate_quiz/`, options, {
      headers: {
        'Content-Type': 'application/json'
      }
    }),
};

// Quiz endpoints
export const QuizAPI = {
  getQuizzes: (params = {}) => 
    API.get('/quizzes/', { params }),
    
  getQuiz: (id) => 
    API.get(`/quizzes/${id}/`),
    
  submitQuiz: (quizId, data) => {
    console.log('QuizAPI.submitQuiz - Raw data:', data);
    
    // Ensure we're sending data in the correct format
    let formattedData = data;
    
    // If data already contains an answers key, use it directly
    if (!data.answers && Array.isArray(data)) {
      // If data is just an array, wrap it in an object with answers key
      formattedData = { answers: data };
    } else if (!data.answers) {
      // If data doesn't have an answers key and isn't an array, 
      // assume the entire object should be sent as is
      formattedData = { answers: [] };
      console.error('Invalid quiz submission data format');
    }
    
    console.log('QuizAPI.submitQuiz - Formatted data:', formattedData);
    return API.post(`/quizzes/${quizId}/submit_attempt/`, formattedData);
  }
};

// Certificate endpoints
export const CertificateAPI = {
  getAllCertificates: () => 
    API.get('/certificates/'),
    
  getCertificate: (id) => 
    API.get(`/certificates/${id}/`),
    
  generateCertificate: (courseId) => 
    API.post('/certificates/', { course_id: courseId }),
    
  mintNFT: (certificateId, walletAddress) => {
    console.log(`CertificateAPI.mintNFT - Minting NFT for certificate: ${certificateId}`);
    return API.post(`/certificates/${certificateId}/mint_nft/`, { wallet_address: walletAddress })
      .catch(error => {
        console.error('Error in mintNFT API call:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
        }
        throw error;
      });
  }
};

// User courses endpoints
export const UserCourseAPI = {
  getEnrolledCourses: () => 
    API.get('/user-courses/')
};

// Helper function to generate sample search results when API fails
function getSampleSearchResults(query, searchType) {
  // Sample data responses
  const sampleResults = [
    {
      id: "sampleVideoId1",
      title: `Learn about ${query || 'Programming'} - Sample Video 1`,
      description: "This is a sample video to show when the YouTube API is unavailable",
      thumbnail: "https://via.placeholder.com/480x360?text=Sample+Video",
      channelTitle: "Sample Educational Channel",
      duration: "PT15M30S",
      viewCount: 12345,
      publishedAt: "2023-01-01T00:00:00Z",
      isSample: true
    },
    {
      id: "samplePlaylistId1",
      title: `${query || 'Complete'} Learning Course - Sample Playlist`,
      description: "This is a sample playlist to show when the YouTube API is unavailable",
      thumbnail: "https://via.placeholder.com/480x360?text=Sample+Playlist",
      channelTitle: "Sample Educational Channel",
      videoCount: 15,
      publishedAt: "2023-01-01T00:00:00Z",
      isSample: true
    }
  ];
  
  // Return appropriate results based on searchType
  if (searchType === 'video') {
    return sampleResults.filter(item => !('videoCount' in item));
  } else if (searchType === 'playlist') {
    return sampleResults.filter(item => 'videoCount' in item);
  } else {
    return sampleResults;
  }
}

export default API; 