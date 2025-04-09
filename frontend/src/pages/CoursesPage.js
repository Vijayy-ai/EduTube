import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/apiService';
import { CourseAPI } from '../utils/api';
import SearchResults from '../components/courses/SearchResults';
import { 
  MagnifyingGlassIcon, 
  PlayIcon,
  BookOpenIcon,
  XMarkIcon,
  AcademicCapIcon,
  CodeBracketIcon, 
  ServerStackIcon,
  BeakerIcon,
  CubeIcon,
  AdjustmentsHorizontalIcon,
  HomeIcon,
  TrophyIcon,
  Cog6ToothIcon,
  ArrowRightCircleIcon,
  QuestionMarkCircleIcon,
  FireIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';

const CATEGORIES = [
  { 
    id: 'dsa', 
    name: 'Data Structures & Algorithms',
    icon: <CodeBracketIcon className="h-5 w-5" />,
    channels: ['Love Babbar', 'Striver', 'Apna College', 'TakeuForward'],
  },
  { 
    id: 'webdev', 
    name: 'Web Development',
    icon: <BookOpenIcon className="h-5 w-5" />,
    channels: ['Traversy Media', 'Web Dev Simplified', 'freeCodeCamp', 'The Net Ninja'],
  },
  { 
    id: 'system-design', 
    name: 'System Design',
    icon: <ServerStackIcon className="h-5 w-5" />,
    channels: ['ByteByteGo', 'CodeKarle', 'Gaurav Sen', 'Tech Dummies'],
  },
  { 
    id: 'ai-ml', 
    name: 'AI & Machine Learning',
    icon: <BeakerIcon className="h-5 w-5" />,
    channels: ['Andrew Ng', 'Krish Naik', '3Blue1Brown', 'StatQuest'],
  },
  { 
    id: 'web3', 
    name: 'Web3 & Blockchain',
    icon: <CubeIcon className="h-5 w-5" />,
    channels: ['Dapp University', 'Moralis', 'HashLips', 'Patrick Collins'],
  }
];

// Featured categories with corresponding search queries
const featuredCategories = [
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    icon: <ComputerDesktopIcon className="h-5 w-5" />,
    channels: [
      { name: 'Love Babbar', query: 'Love Babbar DSA Playlist' },
      { name: 'Striver', query: 'Striver DSA Sheet' },
      { name: 'Apna College', query: 'Apna College DSA Playlist' },
      { name: 'Tech Dose', query: 'Tech Dose Algorithms' },
    ]
  },
  {
    id: 'system-design',
    title: 'System Design',
    icon: <CubeIcon className="h-5 w-5" />,
    channels: [
      { name: 'Gaurav Sen', query: 'Gaurav Sen System Design' },
      { name: 'codeKarle', query: 'codeKarle System Design' },
      { name: 'ByteByteGo', query: 'ByteByteGo System Design' },
      { name: 'TechDummies', query: 'TechDummies System Design' },
    ]
  },
  {
    id: 'ai-ml',
    title: 'AI & Machine Learning',
    icon: <BeakerIcon className="h-5 w-5" />,
    channels: [
      { name: 'Andrew Ng', query: 'Andrew Ng machine learning' },
      { name: 'Sentdex', query: 'Sentdex Python Machine Learning' },
      { name: 'CodeEmporium', query: 'CodeEmporium ML' },
      { name: 'Stanford CS229', query: 'Stanford CS229 Machine Learning' },
    ]
  },
  {
    id: 'web3',
    title: 'Web3 & Blockchain',
    icon: <FireIcon className="h-5 w-5" />,
    channels: [
      { name: 'Dapp University', query: 'Dapp University Blockchain' },
      { name: 'EatTheBlocks', query: 'EatTheBlocks Smart Contracts' },
      { name: 'Nader Dabit', query: 'Nader Dabit Web3' },
      { name: 'Moralis Web3', query: 'Moralis Web3 Development' },
    ]
  }
];

// Use a debounce function to limit API calls
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const CoursesPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchBoxRef = useRef(null);
  const categoryRequestsInProgress = useRef({});
  
  // Parse search query from URL if present
  const searchParams = new URLSearchParams(location.search);
  const initialSearchQuery = searchParams.get('search') || '';
  
  // State variables
  const [difficulty, setDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userCourses, setUserCourses] = useState([]);
  const [hasSearched, setHasSearched] = useState(!!initialSearchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryResults, setCategoryResults] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});
  const [initialCategoriesLoaded, setInitialCategoriesLoaded] = useState(false);
  
  // Track if we're coming back from a video/playlist page to clear search
  useEffect(() => {
    // Use the 'key' property in location.state to detect navigating back
    const isReturningFromContent = location.state?.from === 'content';
    
    if (isReturningFromContent) {
      // Clear search results and URL parameters when returning from content pages
      clearSearch();
      // Clear the location state to prevent repeated clearing
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);
  
  // Add the from state when navigating to video or playlist
  const navigateToContent = (path) => {
    navigate(path, { state: { from: 'search' } });
  };
  
  // Fetch user courses for comparison with search results
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (currentUser) {
        try {
          // Add caching parameters
          const cacheParams = {
            useCache: true,
            cacheDuration: 600000  // Cache for 10 minutes (600000ms)
          };
          
          const response = await api.get('user-courses/', { params: cacheParams });
          if (response.data && response.data.results) {
            setUserCourses(response.data.results);
          } else if (Array.isArray(response.data)) {
            setUserCourses(response.data);
          }
        } catch (err) {
          console.error("Error fetching user courses:", err);
          toast.error("Failed to load your courses. Please try again.");
        }
      }
    };
    
    fetchUserCourses();
  }, [currentUser]);
  
  // Make search box sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (searchBoxRef.current) {
        if (window.scrollY > 10) {
          searchBoxRef.current.classList.add('sticky-search-box');
        } else {
          searchBoxRef.current.classList.remove('sticky-search-box');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Define clearSearch function
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
    setError('');
    
    // Remove search param from URL
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('search');
    window.history.pushState({}, '', newUrl);
  }, []);
  
  // View video function
  const viewVideo = (video) => {
    // Direct navigation to video/playlist for immediate viewing without enrollment
    if (video.playlistId) {
      navigateToContent(`/courses/playlist/${video.playlistId}`);
    } else if (video.videoId) {
      navigateToContent(`/courses/video/${video.videoId}`);
    } else {
      console.error("No video or playlist ID found:", video);
    }
  };
  
  // Define handleSearch function that uses clearSearch
  const handleSearch = useCallback((e, query = searchQuery, options = {}) => {
    if (e) e.preventDefault();
    
    if (!query.trim()) {
      clearSearch();
      return;
    }
    
    setLoading(true);
    setError('');
    setHasSearched(true);
    
    // Update URL with search query for sharing/bookmarking
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('search', query);
    window.history.pushState({}, '', newUrl);
    
    // Create a cache key for the local component state
    const searchCacheKey = `course_search_${query.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Check localStorage first for component-level caching
    try {
      const cachedSearch = localStorage.getItem(searchCacheKey);
      if (cachedSearch) {
        const { data, timestamp } = JSON.parse(cachedSearch);
        // Use cache if it's less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          console.log(`Using cached search results for "${query}"`);
          setSearchResults(data);
          setLoading(false);
          return;
        } else {
          // Remove expired cache
          localStorage.removeItem(searchCacheKey);
        }
      }
    } catch (err) {
      console.error('Error reading from search cache:', err);
      // Continue with API call if cache read fails
    }
    
    // Make the API request with retry logic
    const performSearch = async (retryCount = 0) => {
      try {
        const response = await CourseAPI.searchYouTube(query, 'all');
        
        // Log cache status if available
        if (response.headers && response.headers['X-Cache']) {
          console.log(`Cache status: ${response.headers['X-Cache']} from ${response.headers['X-Cache-Source'] || 'unknown'}`);
        }
        
        // Ensure we always have an array of results
        const results = Array.isArray(response.data) ? response.data : [];
        
        // Cache the results locally
        try {
          localStorage.setItem(searchCacheKey, JSON.stringify({
            data: results,
            timestamp: Date.now()
          }));
        } catch (cacheErr) {
          console.error('Error writing to search cache:', cacheErr);
        }
        
        setSearchResults(results);
        setLoading(false);
        
        // If no results found, show a message
        if (results.length === 0) {
          toast.info(`No results found for "${query}". Try a different search term.`);
        }
      } catch (err) {
        console.error('Error searching YouTube:', err);
        
        // Implement retry logic (max 2 retries)
        if (retryCount < 2) {
          console.log(`Retrying search (attempt ${retryCount + 1})...`);
          setTimeout(() => performSearch(retryCount + 1), 1000 * (retryCount + 1));
          return;
        }
        
        // Handle specific errors
        if (err.response && err.response.status === 429) {
          setError('Too many search requests. Please try again in a few minutes.');
          toast.error('Search limit reached. Please try again later.');
        } else {
          setError('Failed to search. Please try again later.');
          toast.error(err.displayMessage || 'Search failed. Please try again.');
        }
        
        setLoading(false);
      }
    };
    
    performSearch();
  }, [searchQuery, clearSearch]);
  
  // If there's an initial search query in the URL, run the search
  useEffect(() => {
    if (initialSearchQuery && !hasSearched) {
      handleSearch(null, initialSearchQuery);
    }
  }, [initialSearchQuery, hasSearched, handleSearch]);
  
  // Handle category search - DISABLED TO PREVENT EXCESS API CALLS
  const handleCategorySearch = useCallback((category, channelQuery) => {
    console.log('Category searches disabled to preserve YouTube API quota');
    // Return empty content - we're explicitly disabling this functionality
    return;
    
    /* Original implementation disabled
    const categoryId = category.id;
    const query = channelQuery;
    const requestKey = `${categoryId}-${query}`;
    
    // Skip if this exact request is already in progress or if we already have results
    if (categoryRequestsInProgress.current[requestKey] || 
        (categoryResults[categoryId] && categoryResults[categoryId][query])) {
      return;
    }
    
    categoryRequestsInProgress.current[requestKey] = true;
    setCategoryLoading(prev => ({ ...prev, [categoryId]: true }));
    
    CourseAPI.searchYouTube(query, 'all')
      .then(response => {
        setCategoryResults(prev => ({
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            [query]: response.data
          }
        }));
        setCategoryLoading(prev => ({ ...prev, [categoryId]: false }));
      })
      .catch(err => {
        console.error('Error fetching category results:', err);
        setCategoryLoading(prev => ({ ...prev, [categoryId]: false }));
      })
      .finally(() => {
        categoryRequestsInProgress.current[requestKey] = false;
      });
    */
  }, []);
  
  // Load initial category content - with optimization to only load once
  useEffect(() => {
    // Disable automatic loading of categories to prevent exceeding YouTube API quota
    if (false && !hasSearched && !selectedCategory && !initialCategoriesLoaded) {
      // Only load the first channel from each category, and only the first category initially
      const firstCategory = featuredCategories[0];
      const firstChannelQuery = firstCategory.channels[0].query;
      
      handleCategorySearch(firstCategory, firstChannelQuery);
      setInitialCategoriesLoaded(true);
      
      // Load the remaining categories after a delay to prevent too many simultaneous requests
      const loadRemainingCategories = () => {
        featuredCategories.slice(1).forEach((category, index) => {
          setTimeout(() => {
            handleCategorySearch(category, category.channels[0].query);
          }, index * 1000); // Add a 1-second delay between each category
        });
      };
      
      // Wait 2 seconds before loading the remaining categories
      setTimeout(loadRemainingCategories, 2000);
    }
  }, [hasSearched, selectedCategory, handleCategorySearch, initialCategoriesLoaded]);
  
  // Load category content when a category is selected - with rate limiting
  useEffect(() => {
    // Disable automatic loading of category content to prevent exceeding YouTube API quota
    if (false && selectedCategory) {
      const category = featuredCategories.find(c => c.id === selectedCategory);
      if (category) {
        // Load only the first channel initially
        const firstChannel = category.channels[0];
        if (!categoryResults[selectedCategory]?.[firstChannel.query]) {
          handleCategorySearch(category, firstChannel.query);
        }
        
        // Load the remaining channels with a delay
        category.channels.slice(1).forEach((channel, index) => {
          if (!categoryResults[selectedCategory]?.[channel.query]) {
            setTimeout(() => {
              handleCategorySearch(category, channel.query);
            }, (index + 1) * 1000); // Stagger requests with 1-second intervals
          }
        });
      }
    }
  }, [selectedCategory, categoryResults, handleCategorySearch]);
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    setDifficulty(e.target.value);
  };
  
  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    // Close mobile sidebar when a category is selected
    document.body.classList.remove('sidebar-open');
  };
  
  // Add course function
  const addCourse = async (video) => {
    // TEMPORARILY DISABLED: Auto-adding to watchlist is disabled as requested
    toast.info("Adding to watchlist is temporarily disabled");
    return null;
    
    // Original code commented out
    /*
    try {
      const isPlaylist = !!video.playlistId;
      const youtubeId = isPlaylist ? video.playlistId : video.videoId;
      
      const courseResponse = await api.post('courses/', {
        title: video.title,
        description: video.description || 'No description available',
        youtube_id: youtubeId,
        is_playlist: isPlaylist,
        thumbnail_url: video.thumbnail,
        difficulty: 'basic' // Default difficulty level
      });
      
      // Refresh user courses list
      const updatedCoursesResponse = await api.get('user-courses/');
      if (Array.isArray(updatedCoursesResponse.data)) {
        setUserCourses(updatedCoursesResponse.data);
      } else if (updatedCoursesResponse.data?.results) {
        setUserCourses(updatedCoursesResponse.data.results);
      }
      
      // Navigate to the video or playlist page
      if (isPlaylist) {
        navigateToContent(`/courses/playlist/${youtubeId}`);
      } else {
        navigateToContent(`/courses/video/${youtubeId}`);
      }
      
      return courseResponse.data;
    } catch (error) {
      console.error('Error adding course:', error);
      if (error.response?.data) {
        console.error('Server response:', error.response.data);
      }
    */
    // Return null to prevent errors in calling code
    return null;
  };
  
  return (
    <div className="courses-page min-h-screen">
      {/* Page header */}
      <div className="bg-white pt-4 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
              <p className="text-gray-600">
                Search YouTube videos and playlists, watch them, and earn certificates
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-4 pb-12">
        <div className="flex flex-col lg:flex-row">
          {/* Left sidebar - Categories */}
          <div className="w-full lg:w-64 lg:pr-8 mb-8 lg:mb-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <ul className="space-y-2">
                {featuredCategories.map(category => (
                  <li key={category.id}>
                    <button
                      onClick={() => handleCategorySelect(category.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center ${
                        selectedCategory === category.id 
                          ? 'bg-primary-50 text-primary-700' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className={`${selectedCategory === category.id ? 'text-primary-600' : 'text-gray-500'} mr-3`}>
                        {category.icon}
                      </span>
                      <span className="font-medium">{category.title}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            {!hasSearched && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="text-lg font-semibold mb-4">Filters</h3>
                <div>
                  <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    id="difficulty"
                    value={difficulty}
                    onChange={handleFilterChange}
                    className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="basic">Basic</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Main content area */}
          <div className="flex-1">
            {/* Search box - Sticky on scroll */}
            <div 
              ref={searchBoxRef}
              className="bg-white rounded-xl shadow-sm p-4 mb-6"
            >
              <form onSubmit={handleSearch} className="flex items-center">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for YouTube videos and playlists..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 block w-full border border-gray-300 rounded-lg py-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        if (hasSearched) clearSearch();
                      }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="ml-2 bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700"
                >
                  Search
                </button>
              </form>
              
              {/* Mobile filters toggle */}
              <div className="mt-4 flex justify-between items-center lg:hidden">
                <button
                  onClick={() => document.body.classList.toggle('sidebar-open')}
                  className="text-gray-600 flex items-center text-sm font-medium"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
                  Categories
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="text-gray-600 flex items-center text-sm font-medium"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
                  Filters
                </button>
              </div>
              
              {/* Mobile filters dropdown */}
              {showFilters && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg lg:hidden">
                  <div>
                    <label htmlFor="mobile-difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty Level
                    </label>
                    <select
                      id="mobile-difficulty"
                      value={difficulty}
                      onChange={handleFilterChange}
                      className="block w-full border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="all">All Levels</option>
                      <option value="basic">Basic</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            {/* Search results or category content */}
            <div>
              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="lg" />
                </div>
              ) : error ? (
                <div className="bg-red-50 p-4 rounded-lg text-red-700 mb-6">
                  <p className="font-medium">{error}</p>
                  <p className="mt-2 text-sm">
                    Note: YouTube API may be unavailable due to quota limits. Please try again later or try a different search query.
                  </p>
                </div>
              ) : hasSearched ? (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Search Results: {searchResults.length} items
                    </h2>
                    <button
                      onClick={clearSearch}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Clear Results
                    </button>
                  </div>
                  <SearchResults 
                    results={searchResults} 
                    userCourses={userCourses}
                    onCourseAdded={(course) => {
                      // Update the user courses list after adding
                      setUserCourses(prev => [...prev, course]);
                    }}
                    onViewVideo={viewVideo}
                  />
                </div>
              ) : selectedCategory ? (
                <CategoryContent 
                  category={featuredCategories.find(c => c.id === selectedCategory)}
                  results={categoryResults[selectedCategory] || {}}
                  loading={categoryLoading[selectedCategory]}
                  userCourses={userCourses}
                  onCourseAdded={addCourse}
                  onViewVideo={viewVideo}
                />
              ) : (
                <FeaturedContent 
                  categories={featuredCategories}
                  results={categoryResults}
                  loading={categoryLoading}
                  userCourses={userCourses}
                  onCourseAdded={addCourse}
                  onViewVideo={viewVideo}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile sidebar */}
      <style jsx="true">{`
        @media (max-width: 1023px) {
          body.sidebar-open::after {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            z-index: 30;
          }
          
          body.sidebar-open .lg\\:block {
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 250px;
            background: white;
            z-index: 40;
            padding: 1rem;
            box-shadow: 4px 0 10px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  );
};

// CategoryContent component
const CategoryContent = ({ category, results, loading, userCourses, onCourseAdded, onViewVideo }) => {
  if (!category) return null;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {category.title}
        </h2>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : (
        <div className="space-y-8">
          {category.channels.map(channel => {
            const channelResults = results[channel.query];
            
            if (!channelResults || channelResults.length === 0) {
              return null;
            }
            
            return (
              <div key={channel.name} className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-3">{channel.name}</h3>
                <SearchResults 
                  results={channelResults}
                  userCourses={userCourses}
                  compact={true}
                  onCourseAdded={onCourseAdded}
                  onViewVideo={onViewVideo}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// FeaturedContent component
const FeaturedContent = ({ categories, results, loading, userCourses, onCourseAdded, onViewVideo }) => {
  // Check if we have any results at all
  const hasAnyResults = categories.some(category => 
    results[category.id] && 
    Object.keys(results[category.id]).length && 
    results[category.id][category.channels[0].query] &&
    results[category.id][category.channels[0].query].length
  );
  
  return (
    <div className="space-y-12">
      {/* Welcome message and API notice */}
      <div className="bg-blue-50 p-6 rounded-lg mb-8">
        <h3 className="text-xl font-semibold text-blue-800 mb-2">Welcome to EduTube!</h3>
        <p className="mb-4 text-blue-700">
          Search for any topic or course above to find YouTube content that you can save, track progress on, and get certificates for.
        </p>
        <p className="text-blue-600 text-sm">
          <strong>Note:</strong> Automatic loading of featured content has been disabled to conserve YouTube API quota.
          Please use the search function above to find courses of interest.
        </p>
      </div>
      
      {/* Display any loaded categories */}
      {categories.map(category => {
        // Skip categories with no results
        if (!results[category.id] || 
            !Object.keys(results[category.id]).length || 
            !results[category.id][category.channels[0].query] ||
            !results[category.id][category.channels[0].query].length) {
          return null;
        }
        
        const categoryLoading = loading && loading[category.id];
        const channelResults = results[category.id][category.channels[0].query];
        
        return (
          <div key={category.id} className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">{category.icon}</span>
                {category.title}
              </h2>
              <Link 
                to={`/courses?category=${category.id}`}
                className="text-primary-600 text-sm font-medium hover:text-primary-700"
              >
                View all
              </Link>
            </div>
            
            {categoryLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : (
              <SearchResults 
                results={channelResults.slice(0, 4)} 
                userCourses={userCourses}
                onCourseAdded={onCourseAdded}
                onViewVideo={onViewVideo}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CoursesPage; 