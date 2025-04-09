import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import { 
  UserCircleIcon, 
  PencilIcon, 
  KeyIcon, 
  WalletIcon, 
  TrashIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${config.API_URL}/me/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setUser(response.data);
        setFormData({
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          username: response.data.username || ''
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load profile');
        setLoading(false);
        console.error('Error fetching profile:', error);
        
        // If authentication error, redirect to login
        if (error.response && error.response.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setSuccess('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${config.API_URL}/me/`, formData, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setUser(response.data);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 mx-auto max-w-3xl mt-8">
        <p className="font-medium">User not found</p>
        <p className="mt-2">Please try logging in again.</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md font-medium hover:bg-yellow-200"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      {/* Page Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your account information and settings</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Profile Header */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 p-8 text-white">
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-primary-600">
                  {user.first_name ? user.first_name.charAt(0) : user.username.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{user.first_name || ''} {user.last_name || ''}</h2>
                  <p className="text-primary-100">{user.email || ''}</p>
                </div>
                <button 
                  onClick={toggleEdit} 
                  className="ml-auto flex items-center gap-2 bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                >
                  {isEditing ? (
                    <>
                      <XMarkIcon className="h-5 w-5" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <PencilIcon className="h-5 w-5" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Success/Error Messages */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 m-6">
                <div className="flex items-center">
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {success}
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 m-6">
                <div className="flex items-center">
                  <XMarkIcon className="h-5 w-5 mr-2" />
                  {error}
                </div>
              </div>
            )}
            
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={formData.first_name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        value={formData.last_name}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      value={formData.username}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-4">
                    <button
                      type="button"
                      onClick={toggleEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-5 w-5" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Username</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">First Name</p>
                      <p className="font-medium">{user.first_name || 'Not set'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Last Name</p>
                      <p className="font-medium">{user.last_name || 'Not set'}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Account Created</p>
                      <p className="font-medium">
                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'Unknown'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Account Settings */}
        <div className="col-span-1">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Account Settings</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              <div className="p-6">
                <div className="flex items-start">
                  <KeyIcon className="h-8 w-8 text-gray-400 mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Change Password</h4>
                    <p className="text-gray-600 text-sm mb-3">Update your account password for security</p>
                    <button className="btn-secondary text-sm">Change Password</button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start">
                  <WalletIcon className="h-8 w-8 text-gray-400 mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Connect Wallet</h4>
                    <p className="text-gray-600 text-sm mb-3">Connect your blockchain wallet for NFT certificates</p>
                    <button className="btn-secondary text-sm">Connect Wallet</button>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-start">
                  <TrashIcon className="h-8 w-8 text-red-500 mr-4" />
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Delete Account</h4>
                    <p className="text-gray-600 text-sm mb-3">Permanently delete your account and all data</p>
                    <button className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg text-sm font-medium">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 