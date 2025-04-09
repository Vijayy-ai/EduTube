import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/apiService';
import {
  UserCircleIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  HomeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  WalletIcon,
  DocumentDuplicateIcon,
  ChevronRightIcon,
  ClockIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const Navbar = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  useEffect(() => {
    // Close the menu when the route changes
    setIsMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  // Check saved wallet address in localStorage
  const checkIfWalletIsConnected = async () => {
    try {
      const savedAddress = localStorage.getItem('walletAddress');
      if (savedAddress) {
        setWalletAddress(savedAddress);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };
  
  // Connect to MetaMask wallet
  const connectWallet = async () => {
    setIsWalletConnecting(true);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        toast.error('MetaMask not detected! Please install MetaMask to continue.');
        return;
      }
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        localStorage.setItem('walletAddress', accounts[0]);
        
        // Subscribe to account changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setWalletAddress(newAccounts[0]);
            localStorage.setItem('walletAddress', newAccounts[0]);
          } else {
            // User disconnected wallet
            disconnectWallet();
          }
        });
        
        toast.success('Wallet connected successfully!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Failed to connect wallet. Please try again.');
    } finally {
      setIsWalletConnecting(false);
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    localStorage.removeItem('walletAddress');
    toast.success('Wallet disconnected');
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
        return;
      }
      
      try {
        const response = await api.get('me/');
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, [currentUser]);
  
  // Load search history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing search history:', e);
        setSearchHistory([]);
      }
    }
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to search history (avoid duplicates and limit to 5 entries)
      const updatedHistory = [
        searchQuery.trim(),
        ...searchHistory.filter(item => item !== searchQuery.trim())
      ].slice(0, 5);
      
      setSearchHistory(updatedHistory);
      localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
      
      // Navigate to courses page with search query
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };
  
  const handleSearchHistoryClick = (query) => {
    navigate(`/courses?search=${encodeURIComponent(query)}`);
    setIsSearchFocused(false);
  };
  
  const clearSearchHistory = (e) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };
  
  return (
    <nav className="bg-white border-b border-gray-100 py-1 sticky top-0 z-nav h-[64px] min-h-[64px]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Main Navigation */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="/edutube.png" 
                  alt="EduTube Logo" 
                  className="h-9 w-9 object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/36x36?text=ET';
                  }}
                />
                <span className="ml-2 text-xl font-bold gradient-heading whitespace-nowrap">EduTube</span>
              </Link>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-6">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap w-[100px] text-center ${
                  location.pathname === '/' 
                    ? 'text-primary-600' 
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <span className="flex items-center justify-center">
                  <HomeIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Home</span>
                </span>
              </Link>
              <Link 
                to="/courses" 
                className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap w-[100px] text-center ${
                  location.pathname.includes('/courses') && !location.pathname.includes('/dashboard') 
                    ? 'text-primary-600' 
                    : 'text-gray-600 hover:text-primary-600'
                }`}
              >
                <span className="flex items-center justify-center">
                  <BookOpenIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">Courses</span>
                </span>
              </Link>
              {currentUser && (
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap w-[100px] text-center ${
                    location.pathname.includes('/dashboard') 
                      ? 'text-primary-600' 
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  <span className="flex items-center justify-center">
                    <AcademicCapIcon className="h-5 w-5 mr-1.5 flex-shrink-0" />
                    <span className="whitespace-nowrap">Dashboard</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
          
          {/* Right side - Search, Profile, etc. */}
          <div className="flex items-center space-x-2">
            {/* Search Button / Form */}
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search videos & playlists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                    className="w-56 pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="ml-2 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                </button>
              </form>
              
              {isSearchFocused && (
                <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-30">
                  {searchHistory.length > 0 ? (
                    <div>
                      <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100">
                        <h4 className="text-xs font-medium text-gray-500">Recent Searches</h4>
                        <button
                          onClick={clearSearchHistory}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="max-h-60 overflow-y-auto">
                        {searchHistory.map((query, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center text-sm"
                            onClick={() => handleSearchHistoryClick(query)}
                          >
                            <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {query}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-gray-500">
                      <p>Search for YouTube videos and playlists</p>
                    </div>
                  )}
                  <div className="p-2 text-xs text-gray-400 border-t border-gray-100 flex items-center">
                    <LightBulbIcon className="h-4 w-4 mr-1 text-primary-500" />
                    Press Enter to search
                  </div>
                </div>
              )}
            </div>
            
            {/* User Menu - Desktop */}
            {currentUser ? (
              <div className="hidden md:block relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none p-1 rounded-full hover:bg-gray-50"
                >
                  <div className="relative">
                    <UserCircleIcon className="h-8 w-8 text-primary-600" />
                  </div>
                  <span className="ml-2 text-sm font-medium hidden lg:block">
                    {userData?.first_name || userData?.username || 'User'}
                  </span>
                  <ChevronDownIcon className="ml-1 h-4 w-4" />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.first_name} {userData?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {userData?.email}
                      </p>
                    </div>
                    
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left flex items-center"
                      >
                        <AcademicCapIcon className="h-5 w-5 mr-3 text-primary-500" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left flex items-center"
                      >
                        <UserCircleIcon className="h-5 w-5 mr-3 text-primary-500" />
                        Profile
                      </Link>
                      <Link
                        to="/certificates"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left flex items-center"
                      >
                        <DocumentTextIcon className="h-5 w-5 mr-3 text-primary-500" />
                        Certificates
                      </Link>
                      
                      <hr className="my-1 border-gray-100" />
                      
                      {/* Wallet Connection */}
                      {walletAddress ? (
                        <div className="px-4 py-2">
                          <div className="flex items-center mb-2">
                            <WalletIcon className="h-5 w-5 mr-3 text-green-500" />
                            <span className="text-sm font-medium text-gray-900">Wallet Connected</span>
                            <span className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-xs text-gray-700 font-mono">
                                  {`${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`}
                                </div>
                                <div className="text-xs text-green-600 mt-1 flex items-center">
                                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
                                  Polygon Mumbai
                                </div>
                              </div>
                              
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(walletAddress);
                                  toast.success('Address copied to clipboard');
                                }}
                                className="text-primary-500 hover:text-primary-600 p-1 rounded hover:bg-gray-100"
                                title="Copy address"
                              >
                                <DocumentDuplicateIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <div className="mt-2 flex justify-between">
                            <a 
                              href={`https://mumbai.polygonscan.com/address/${walletAddress}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                            >
                              View on Explorer
                              <ChevronRightIcon className="h-3 w-3 ml-1" />
                            </a>
                            <button
                              onClick={disconnectWallet}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Disconnect
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={connectWallet}
                          disabled={isWalletConnecting}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left flex items-center"
                        >
                          <WalletIcon className="h-5 w-5 mr-3 text-primary-500" />
                          {isWalletConnecting ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Connecting...
                            </>
                          ) : 'Connect Wallet'}
                        </button>
                      )}
                      
                      <hr className="my-1 border-gray-100" />
                      
                      <button
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left flex items-center"
                      >
                        <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3 text-gray-500" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            {/* Mobile menu button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-100">
              <Link
                to="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <HomeIcon className="h-5 w-5 mr-2" />
                  Home
                </div>
              </Link>
              <Link
                to="/courses"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
              >
                <div className="flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Courses
                </div>
              </Link>
              {currentUser && (
                <Link
                  to="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Dashboard
                  </div>
                </Link>
              )}
            </div>
            
            {currentUser ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-10 w-10 text-primary-600" />
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {userData?.first_name} {userData?.last_name}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {userData?.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link
                    to="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 border-t border-gray-200 flex flex-col space-y-2">
                <Link
                  to="/login"
                  className="w-full px-4 py-2 text-center text-base font-medium text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="w-full px-4 py-2 text-center text-base font-medium text-white bg-primary-600 rounded-md shadow-sm hover:bg-primary-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 