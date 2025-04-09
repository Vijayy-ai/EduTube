import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon 
} from '@heroicons/react/24/outline';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Form validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      const success = await register(formData);
      
      if (success) {
        navigate('/login', { 
          state: { message: 'Registration successful! Please log in with your new account.' } 
        });
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="form-label">First Name</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className="form-input pl-10"
                placeholder="First name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="last_name" className="form-label">Last Name</label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className="form-input pl-10"
                placeholder="Last name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="username" className="form-label">Username</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <UserIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="form-input pl-10"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="email" className="form-label">Email Address</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input pl-10"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="password" className="form-label">Password</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="form-input pl-10"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <div className="relative mt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockClosedIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="form-input pl-10"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex justify-center items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </div>
      </form>
      
      <p className="mt-6 text-center text-gray-600 text-sm">
        By creating an account, you agree to our <Link to="/terms" className="text-primary-600 hover:text-primary-700">Terms of Service</Link> and <Link to="/privacy" className="text-primary-600 hover:text-primary-700">Privacy Policy</Link>.
      </p>
    </>
  );
};

export default Register;