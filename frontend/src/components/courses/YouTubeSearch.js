import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import config from '../../config';
import { parseIsoDuration } from '../../utils/helpers';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../utils/apiService';
import { CourseAPI } from '../../utils/api';
import { 
  MagnifyingGlassIcon, 
  FilmIcon, 
  QueueListIcon, 
  PlusCircleIcon,
  UserPlusIcon,
  PlayIcon,
  XMarkIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeIcon,
  UserCircleIcon,
  HeartIcon,
  InformationCircleIcon,
  CheckIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const YouTubeSearch = ({ onSearch, searchResults, loading, error }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState('video');
  const [searchHistory, setSearchHistory] = useState([]);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [addingState, setAddingState] = useState({});
  const [enrollingState, setEnrollingState] = useState({});
  const [hoveredVideo, setHoveredVideo] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const searchBoxRef = useRef(null);
  
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'programming', name: 'Programming' },
    { id: 'datascience', name: 'Data Science' },
    { id: 'machinelearning', name: 'Machine Learning' },
    { id: 'webdevelopment', name: 'Web Development' },
    { id: 'uiux', name: 'UI/UX Design' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'science', name: 'Science' }
  ];
  
  // Handle scrolling in search results
  const handleScroll = () => {
    const isSticky = window.scrollY > (searchBoxRef.current?.offsetTop || 0);
    if (searchBoxRef.current) {
      if (isSticky) {
        searchBoxRef.current.classList.add('sticky-search');
      } else {
        searchBoxRef.current.classList.remove('sticky-search');
      }
    }
  };
  
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Load search history on component mount
  useEffect(() => {
    // Load search history from local storage
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setSearchHistory(history);
  }, []);
  
  // Save search history to local storage
  useEffect(() => {
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);
  
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      fetchSearchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };
  
  // Filter results by category
  const filteredResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) {
      return [];
    }
    
    if (selectedCategory === 'all') {
      return searchResults;
    }
    
    // This is a simplified filter that would normally use tags or categories from the API
    return searchResults.filter(result => {
      const title = result.title?.toLowerCase() || '';
      const description = result.description?.toLowerCase() || '';
      const categoryTerm = selectedCategory.toLowerCase();
      
      return title.includes(categoryTerm) || description.includes(categoryTerm);
    });
  }, [searchResults, selectedCategory]);
  
  const fetchSearchSuggestions = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    
    try {
      const response = await api.get(`youtube/suggestions?query=${encodeURIComponent(searchQuery)}`);
      if (response.data && Array.isArray(response.data)) {
        setSuggestions(response.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
    }
  };
  
  const handleSelectSuggestion = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSubmit({ preventDefault: () => {} }, suggestion);
  };
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSubmit = (e, selectedQuery = null) => {
    e?.preventDefault();
    const searchQuery = selectedQuery || query;
    
    if (!searchQuery.trim()) return;
    
    // Close suggestions
    setSuggestions([]);
    setShowSuggestions(false);
    
    // Remove special chars from query for security
    const sanitizedQuery = searchQuery.replace(/[^\w\s-]/g, '');
    setQuery(sanitizedQuery);
    
    // Add timestamp to prevent caching issues
    const timestamp = new Date().getTime();
    
    // Call parent's onSearch handler with the query
    if (onSearch) {
      try {
        onSearch(sanitizedQuery, searchType, { timestamp, useCache: true })
          .catch(error => {
            console.error('YouTube search error:', error);
            if (error.response && error.response.status === 403) {
              toast.error('YouTube API quota exceeded. Please try again later.');
            } else if (error.response && error.response.data && error.response.data.error) {
              toast.error(`Search error: ${error.response.data.error}`);
            } else {
              toast.error('Failed to search YouTube. Please try again later.');
            }
          });
      } catch (err) {
        console.error('Error in search handler:', err);
        toast.error('Failed to process search request.');
      }
    }
  };
  
  const handlePlayVideo = (result) => {
    // Instead of redirecting to YouTube, let's set up a local preview
    setPreviewVideo({
      videoId: result.videoId,
      title: result.title,
      channelTitle: result.channelTitle,
      description: result.description,
      viewCount: result.viewCount,
      publishedAt: result.publishedAt,
      result: result
    });
  };
  
  const handleViewPlaylist = async (playlist) => {
    try {
      // Navigate directly to the playlist page
      navigate(`/courses/playlist/${playlist.playlistId}`);
    } catch (error) {
      console.error('Error navigating to playlist:', error);
    }
  };
  
  const handleAddCourse = async (result) => {
    setAddingState(prev => ({ ...prev, [result.videoId || result.playlistId]: true }));
    
    try {
      const isPlaylist = !!result.playlistId;
      const courseData = {
        title: result.title,
        description: result.description || "No description available",
        youtube_id: isPlaylist ? result.playlistId : result.videoId,
        is_playlist: isPlaylist,
        thumbnail_url: result.thumbnail,
        difficulty: 'basic'
      };
      
      const response = await CourseAPI.createCourse(courseData);
      
      setAddingState(prev => ({ ...prev, [result.videoId || result.playlistId]: false }));
      
      // Navigate to the course page
      if (isPlaylist) {
        navigate(`/courses/playlist/${result.playlistId}`);
      } else {
        navigate(`/courses/video/${result.videoId}`);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error adding course:', error);
      setAddingState(prev => ({ ...prev, [result.videoId || result.playlistId]: false }));
      return null;
    }
  };
  
  const handleEnrollCourse = async (result) => {
    try {
      // First add the course
      let courseId;
      if (addingState[result.id] !== 'completed') {
        try {
          const courseData = await handleAddCourse(result);
          courseId = courseData.id;
        } catch (error) {
          // If the course already exists, try to find it
          const token = localStorage.getItem('token');
          const coursesResponse = await axios.get(`${config.API_URL}/courses/`, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          const existingCourse = coursesResponse.data.find(course => 
            course.youtube_id === (result.playlistId || result.videoId)
          );
          
          if (!existingCourse) {
            throw error;
          }
          
          courseId = existingCourse.id;
        }
      }
      
      // Now enroll in the course
      setEnrollingState(prev => ({ ...prev, [result.id]: true }));
      
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/courses/${courseId}/enroll/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // Navigate to the course
      navigate(`/courses/${courseId}`);
      
    } catch (error) {
      console.error("Error enrolling in course:", error);
      setEnrollingState(prev => ({ ...prev, [result.id]: 'error' }));
      
      // Reset the error state after 3 seconds
      setTimeout(() => {
        setEnrollingState(prev => {
          const newState = { ...prev };
          delete newState[result.id];
          return newState;
        });
      }, 3000);
    }
  };
  
  const formatYouTubeDuration = (duration) => {
    if (!duration) return '';
    
    const seconds = parseIsoDuration(duration);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const formatViewCount = (count) => {
    if (!count) return '';
    
    if (count < 1000) {
      return count.toString();
    }
    
    if (count < 1000000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    
    return `${(count / 1000000).toFixed(1)}M`;
  };
  
  // Close the preview
  const handleClosePreview = () => {
    setPreviewVideo(null);
  };
  
  return (
    <div className="w-full bg-gray-50 min-h-screen">
      {/* Search Bar - Sticky */}
      <div ref={searchBoxRef} className="bg-white shadow-sm z-20 transition-all duration-300">
        <div className="container mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="relative mb-4">
            <div className="flex items-center relative">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={query}
                  onChange={handleSearchInput}
                  placeholder="Search for videos, courses, tutorials..."
                  className="w-full px-4 py-3 pl-12 pr-16 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  ref={searchInputRef}
                />
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                className="ml-2 px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto"
              >
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>
                      <button
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center"
                      >
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {suggestion}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </form>
          
          {/* Search Type Tabs */}
          <div className="flex flex-wrap items-center justify-between">
            <div className="flex space-x-4">
              <button
                onClick={() => setSearchType('video')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  searchType === 'video' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <FilmIcon className="h-4 w-4 mr-1" />
                  Videos
                </div>
              </button>
              <button
                onClick={() => setSearchType('playlist')}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  searchType === 'playlist' 
                    ? 'bg-primary-100 text-primary-800' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <QueueListIcon className="h-4 w-4 mr-1" />
                  Playlists
                </div>
              </button>
            </div>
            
            {/* Category Filter - Desktop */}
            <div className="hidden md:flex overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Filters - Mobile only */}
      <div className="md:hidden container mx-auto px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* Video Preview */}
      {previewVideo && (
        <div className="container mx-auto px-4 py-4">
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="relative">
              <button 
                onClick={handleClosePreview}
                className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full z-10 hover:bg-opacity-70"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
              <div className="aspect-w-16 aspect-h-9">
                <iframe 
                  src={`https://www.youtube.com/embed/${previewVideo.videoId}?autoplay=1`}
                  title={previewVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                ></iframe>
              </div>
            </div>
            <div className="p-4">
              <h2 className="text-xl font-bold mb-2">{previewVideo.title}</h2>
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <span className="mr-3">{previewVideo.channelTitle}</span>
                {previewVideo.viewCount && (
                  <span className="flex items-center mr-3">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {formatViewCount(previewVideo.viewCount)} views
                  </span>
                )}
                {previewVideo.publishedAt && (
                  <span>
                    {new Date(previewVideo.publishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 mb-6">{previewVideo.description}</p>
              
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleAddCourse(previewVideo.result)}
                  disabled={addingState[previewVideo.result.id] === true}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    addingState[previewVideo.result.id] === true
                      ? 'bg-gray-300 text-gray-600 cursor-wait'
                      : addingState[previewVideo.result.id] === 'completed'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : addingState[previewVideo.result.id] === 'error'
                          ? 'bg-red-100 text-red-700 border border-red-300'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {addingState[previewVideo.result.id] === true ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Adding to Library...
                    </>
                  ) : addingState[previewVideo.result.id] === 'completed' ? (
                    <>
                      <CheckIcon className="h-5 w-5 mr-2" />
                      Added to Library
                    </>
                  ) : addingState[previewVideo.result.id] === 'error' ? (
                    <>
                      <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                      Failed to Add
                    </>
                  ) : (
                    <>
                      <PlusCircleIcon className="h-5 w-5 mr-2" />
                      Add to My Courses
                    </>
                  )}
                </button>
                
                <button 
                  onClick={() => handleEnrollCourse(previewVideo.result)}
                  disabled={enrollingState[previewVideo.result.id] === true}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    enrollingState[previewVideo.result.id] === true
                      ? 'bg-gray-300 text-gray-600 cursor-wait'
                      : enrollingState[previewVideo.result.id] === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {enrollingState[previewVideo.result.id] === true ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : enrollingState[previewVideo.result.id] === 'error' ? (
                    <>
                      <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                      Enrollment Failed
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-2" />
                      Enroll Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Search Results */}
      <div className="container mx-auto px-4 py-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <ArrowPathIcon className="h-10 w-10 text-primary-600 animate-spin" />
            <span className="ml-3 text-gray-600">Searching...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
            <span>{error}</span>
          </div>
        ) : filteredResults && filteredResults.length > 0 ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResults.map((result) => (
                <div 
                  key={result.id} 
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  onMouseEnter={() => setHoveredVideo(result.id)}
                  onMouseLeave={() => setHoveredVideo(null)}
                >
                  {/* Thumbnail */}
                  <div className="relative">
                    <img 
                      src={result.thumbnail} 
                      alt={result.title} 
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Duration Badge */}
                    {result.duration && (
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                        {formatYouTubeDuration(result.duration)}
                      </div>
                    )}
                    
                    {/* Playlist Count */}
                    {result.videoCount && (
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center">
                        <QueueListIcon className="h-3 w-3 mr-1" />
                        {result.videoCount} videos
                      </div>
                    )}
                    
                    {/* Play Button Overlay on Hover */}
                    {hoveredVideo === result.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <button
                          onClick={() => handlePlayVideo(result)}
                          className="bg-white bg-opacity-90 rounded-full p-3 hover:bg-opacity-100 transition-all transform hover:scale-110"
                        >
                          <PlayIcon className="h-8 w-8 text-primary-600" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">
                      {result.title}
                    </h3>
                    
                    {/* Channel */}
                    <div className="text-sm text-gray-600 mb-2">
                      {result.channelTitle}
                    </div>
                    
                    {/* Meta info */}
                    <div className="flex items-center text-xs text-gray-500 mb-3">
                      {result.viewCount && (
                        <span className="flex items-center mr-3">
                          <EyeIcon className="h-3 w-3 mr-1" />
                          {formatViewCount(result.viewCount)} views
                        </span>
                      )}
                      
                      {result.publishedAt && (
                        <span className="flex items-center">
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {new Date(result.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-auto flex space-x-2">
                      <button
                        onClick={() => handlePlayVideo(result)}
                        className="flex-1 bg-gray-100 text-gray-800 py-2 px-2 rounded-lg text-sm font-medium hover:bg-gray-200 flex items-center justify-center"
                      >
                        <PlayIcon className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                      
                      <button
                        onClick={() => handleAddCourse(result)}
                        className={`flex-1 py-2 px-2 rounded-lg text-sm font-medium flex items-center justify-center ${
                          addingState[result.id] === true
                            ? 'bg-gray-200 text-gray-500 cursor-wait'
                            : addingState[result.id] === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : addingState[result.id] === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={addingState[result.id] === true}
                      >
                        {addingState[result.id] === true ? (
                          <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        ) : addingState[result.id] === 'completed' ? (
                          <CheckIcon className="h-4 w-4" />
                        ) : addingState[result.id] === 'error' ? (
                          <XMarkIcon className="h-4 w-4" />
                        ) : (
                          <PlusCircleIcon className="h-4 w-4 mr-1" />
                        )}
                        <span className="ml-1 hidden sm:inline">
                          {addingState[result.id] === 'completed' ? 'Added' : 'Add'}
                        </span>
                      </button>
                      
                      <button
                        onClick={() => handleEnrollCourse(result)}
                        className="flex-1 bg-primary-600 text-white py-2 px-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center justify-center"
                      >
                        <UserPlusIcon className="h-4 w-4 mr-1" />
                        <span className="ml-1 hidden sm:inline">Enroll</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <FilmIcon className="h-16 w-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-xl font-semibold text-gray-600">No results found</h3>
            <p className="mt-2 text-gray-500">Try different keywords or filters</p>
          </div>
        ) : (
          <div>
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Recent Searches</h2>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSuggestion(term)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-full text-sm hover:bg-gray-200 flex items-center"
                    >
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Popular Topics */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Popular Topics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categories.filter(c => c.id !== 'all').map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      handleSubmit({ preventDefault: () => {} }, category.name);
                    }}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-sm"
                  >
                    <div className="bg-primary-100 rounded-full p-3 mb-3">
                      <InformationCircleIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    <p className="font-medium text-gray-800">{category.name}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* CSS for sticky search box */}
      <style jsx="true">{`
        .sticky-search {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default YouTubeSearch; 