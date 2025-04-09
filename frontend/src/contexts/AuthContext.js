import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { loginWithEmailAndPassword, loginWithGoogle as firebaseLoginWithGoogle, logoutUser, getCurrentUser } from '../utils/firebase';
import config from '../config';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [authError, setAuthError] = useState(null);

  // Check for existing token and fetch user data on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile from backend API
  const fetchUserProfile = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.API_URL}/me/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setUserProfile(response.data);
      setCurrentUser(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // If there's an error, clear the token and user state
      localStorage.removeItem('token');
      setAuthToken(null);
      setCurrentUser(null);
      setUserProfile(null);
      setLoading(false);
    }
  };

  // Login function
  const login = async (email, password) => {
    setAuthError(null);
    try {
      // First authenticate with Firebase
      const { user, error } = await loginWithEmailAndPassword(email, password);
      
      if (error) {
        setAuthError(error);
        return { success: false, error };
      }
      
      // Then get token from Django backend
      const response = await axios.post(config.AUTH_API_URL, {
        email,
        password,
        firebase_uid: user.uid
      });
      
      // Save token to localStorage
      const token = response.data.token;
      localStorage.setItem('token', token);
      setAuthToken(token);
      
      // Fetch user profile
      await fetchUserProfile(token);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.non_field_errors?.[0] || 
                          error.response?.data?.detail ||
                          'Failed to login. Please try again.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Google Login function
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      // First authenticate with Firebase
      const { user, error } = await firebaseLoginWithGoogle();
      
      if (error) {
        setAuthError(error);
        return false;
      }
      
      if (!user) {
        setAuthError('Failed to authenticate with Google');
        return false;
      }
      
      // Get the Firebase ID token
      const idToken = await user.getIdToken();
      
      // Send the token to your backend
      try {
        const response = await axios.post(`${config.API_URL}/firebase-auth/`, {
          token: idToken
        });
        
        // Save the Django token
        const token = response.data.token;
        localStorage.setItem('token', token);
        setAuthToken(token);
        
        // Fetch user profile
        await fetchUserProfile(token);
        
        return true;
      } catch (backendError) {
        console.error('Backend authentication error:', backendError);
        setAuthError(backendError.response?.data?.error || 'Failed to authenticate with backend');
        return false;
      }
    } catch (error) {
      console.error('Google login error:', error);
      setAuthError(error.message || 'Google login failed');
      return false;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logoutUser(); // Firebase logout
      
      // Clear local storage and state
      localStorage.removeItem('token');
      setAuthToken(null);
      setCurrentUser(null);
      setUserProfile(null);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Get token function for API requests
  const getToken = () => {
    return localStorage.getItem('token');
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem('token');
  };

  // Context value
  const value = {
    currentUser,
    userProfile,
    loading,
    login,
    loginWithGoogle,
    logout,
    authError,
    getToken,
    isAuthenticated,
    refreshUserProfile: () => fetchUserProfile(getToken())
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;