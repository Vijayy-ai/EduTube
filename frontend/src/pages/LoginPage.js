import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  AcademicCapIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const { success, error } = await login(email, password);
      
      if (success) {
        // Check if there's a redirect path saved in localStorage
        const redirectPath = localStorage.getItem('redirectAfterLogin');
        
        if (redirectPath) {
          // Clear the saved path before redirecting
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath);
        } else {
          // Default redirect to dashboard
          navigate('/dashboard');
        }
      } else {
        setError(error || 'Failed to login. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    
    try {
      const success = await loginWithGoogle();
      if (success) {
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 500);
      } else {
        setError('Google login failed. Please try again.');
      }
    } catch (err) {
      setError('Google login failed. Please try again.');
      console.error('Google login error:', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/reset-password');
  };

  return (
    <div className="py-16 lg:py-24 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 blob-shape" style={{ background: 'radial-gradient(circle, rgba(113, 57, 247, 0.1) 0%, rgba(113, 57, 247, 0) 70%)' }}></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 blob-shape" style={{ background: 'radial-gradient(circle, rgba(26, 110, 244, 0.1) 0%, rgba(26, 110, 244, 0) 70%)' }}></div>
      
      <div className="container-custom">
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-card overflow-hidden grid md:grid-cols-2">
          {/* Image Section */}
          <div className="hidden md:block relative bg-gradient-to-br from-primary-600 to-secondary-600">
            <div className="absolute inset-0 opacity-20 bg-pattern-dots"></div>
            <div className="relative p-12 flex flex-col justify-between h-full text-white">
              <div>
                <AcademicCapIcon className="h-14 w-14 mb-6" />
                <h2 className="text-3xl font-bold mb-6">Welcome Back to EduTube</h2>
                <p className="text-lg">
                  Continue your learning journey and earn verifiable certificates from YouTube videos.
                </p>
              </div>
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <p>Watch educational videos</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <p>Take AI-generated quizzes</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                  <p>Earn blockchain-verified certificates</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-8 md:p-12">
            <div className="mb-10 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-3 gradient-heading">Login</h1>
              <p className="text-gray-600">
                Don't have an account? <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">Sign Up</Link>
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6">
                {error}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input pl-12"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="form-label">Password</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="form-input pl-12"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
                
                <div className="text-sm">
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 rounded-full flex justify-center items-center"
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
                    'Login'
                  )}
                </button>
              </div>
            </form>
            
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex justify-center items-center px-4 py-3 border border-gray-200 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50"
                >
                  {googleLoading ? (
                    <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                          <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/>
                          <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/>
                          <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/>
                          <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/>
                        </g>
                      </svg>
                      Sign in with Google
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;