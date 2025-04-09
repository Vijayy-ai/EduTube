import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import { CourseAPI } from '../../utils/api';
import { 
  PlayIcon, 
  AcademicCapIcon,
  FilmIcon,
  QueueListIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

/**
 * SearchResults component for displaying search results from YouTube
 * 
 * @param {Object} props
 * @param {Array} props.results - Array of search result items
 * @param {Array} props.userCourses - Array of user's enrolled courses
 * @param {boolean} props.compact - Whether to use compact mode for grid
 * @param {Function} props.onCourseAdded - Callback when course is added
 * @param {Function} props.onViewVideo - Callback to view a video (optional)
 * @returns {JSX.Element}
 */
const SearchResults = ({ 
  results, 
  userCourses = [],
  compact = false,
  onCourseAdded,
  onViewVideo
}) => {
  const navigate = useNavigate();
  const [addingState, setAddingState] = useState({});
  const [watchlistState, setWatchlistState] = useState({});
  
  // Add debugging to check response format in development
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [showDebug, setShowDebug] = useState(false);
  
  // Helper function to normalize item format between different API formats
  const normalizeItemFormat = (item) => {
    if (!item) return {};
    
    // Create a new normalized item object to avoid mutating the original
    const normalized = { ...item };
    
    // Handle video ID (with fallbacks)
    if (!normalized.videoId) {
      if (typeof normalized.id === 'string' && !normalized.playlistId) {
        // Production API format for a video
        normalized.videoId = normalized.id;
      } else if (normalized.id?.videoId) {
        // Legacy format where ID is nested
        normalized.videoId = normalized.id.videoId;
      }
    }
    
    // Handle playlist ID (with fallbacks)
    if (!normalized.playlistId) {
      if (typeof normalized.id === 'string' && 
         (normalized.search_type === 'playlist' || 
          normalized.itemCount || 
          normalized.videoCount)) {
        normalized.playlistId = normalized.id;
      } else if (normalized.id?.playlistId) {
        normalized.playlistId = normalized.id.playlistId;
      }
    }
    
    // Ensure thumbnail field exists
    if (!normalized.thumbnail) {
      if (normalized.thumbnails?.high?.url) {
        normalized.thumbnail = normalized.thumbnails.high.url;
      } else if (normalized.thumbnails?.default?.url) {
        normalized.thumbnail = normalized.thumbnails.default.url;
      } else if (normalized.snippet?.thumbnails?.high?.url) {
        normalized.thumbnail = normalized.snippet.thumbnails.high.url;
      } else if (normalized.snippet?.thumbnails?.default?.url) {
        normalized.thumbnail = normalized.snippet.thumbnails.default.url;
      } else {
        normalized.thumbnail = 'https://via.placeholder.com/480x360?text=No+Thumbnail';
      }
    }
    
    // Ensure other fields are normalized
    normalized.title = normalized.title || normalized.snippet?.title || '';
    normalized.description = normalized.description || normalized.snippet?.description || '';
    normalized.channelTitle = normalized.channelTitle || normalized.snippet?.channelTitle || '';
    
    return normalized;
  };
  
  // Log the initial results format for debugging
  useEffect(() => {
    if (results && results.length > 0) {
      console.log("Search results format:", {
        "First Item": results[0],
        "ID Format": results[0].id ? "Production API" : "Test API",
        "Has videoId": !!results[0].videoId,
        "Has playlistId": !!results[0].playlistId
      });
    }
  }, [results]);
  
  if (!results || results.length === 0) {
    return (
      <div className="col-span-full text-center py-8 text-gray-500">
        No results found
      </div>
    );
  }
  
  // Check if results are sample data (when API fails)
  const isSampleData = results.some(item => item.isSample === true);
  
  // Display warning if using sample data
  if (isSampleData) {
    return (
      <div className="search-results">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">YouTube API Unavailable</h3>
              <p className="mt-1 text-sm text-amber-700">
                The YouTube API is currently unavailable or its quota has been exceeded. 
                Sample results are shown below to allow you to explore the application's features.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Note: These are placeholder results and not actual YouTube content.
              </p>
            </div>
          </div>
        </div>
        
        {/* Display the sample results */}
        <div className={`grid ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'} gap-4`}>
          {results.map((item, index) => {
            const normalizedItem = normalizeItemFormat(item);
            return (
              <div key={index} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="relative pt-[56.25%] bg-gray-200">
                  <img 
                    src={normalizedItem.thumbnail} 
                    alt={normalizedItem.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://i.imgur.com/aG7xzFO.png';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                  <button 
                    onClick={() => viewVideo(normalizedItem)}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-3 hover:bg-opacity-100 transition-all"
                  >
                    <PlayIcon className="h-6 w-6 text-gray-800" />
                  </button>
                </div>
                <div className="p-4 flex-grow">
                  <div className="font-medium text-gray-900 mb-1">{normalizedItem.title}</div>
                  <p className="text-sm text-gray-600 line-clamp-2">{normalizedItem.description}</p>
                  <p className="text-xs text-gray-500 mt-2">{normalizedItem.channelTitle}</p>
                </div>
                <div className="px-4 py-3 bg-gray-50 flex justify-between items-center">
                  <button 
                    onClick={() => addToWatchlist(normalizedItem)}
                    className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    <BookmarkIcon className="h-4 w-4 mr-1" />
                    Add to Watchlist
                  </button>
                  <button 
                    onClick={() => viewVideo(normalizedItem)}
                    className="flex items-center text-xs font-medium text-emerald-600 hover:text-emerald-800"
                  >
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Start Learning
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Process results to mark already added courses
  const processedResults = results.map(item => {
    const isAdded = userCourses.some(course => {
      const courseId = item.playlistId || item.videoId;
      return course.youtube_id === courseId;
    });
    
    return {
      ...item,
      isAdded
    };
  });

  const addCourse = async (item) => {
    // TEMPORARILY DISABLED: Auto-adding to watchlist is disabled as requested
    toast.info("Adding to watchlist is temporarily disabled");
    return;
    
    // Original code (commented out)
    /*
    // Normalize item format to handle both endpoint formats
    const normalizedItem = normalizeItemFormat(item);
    const videoId = normalizedItem.videoId;
    const playlistId = normalizedItem.playlistId;
    const itemId = playlistId || videoId;
    
    try {
      setAddingState(prev => ({ ...prev, [itemId]: true }));
      
      const isPlaylist = !!playlistId;
      
      const courseData = {
        title: normalizedItem.title,
        description: normalizedItem.description || "No description available",
        youtube_id: itemId,
        is_playlist: isPlaylist,
        thumbnail_url: normalizedItem.thumbnail,
        difficulty: 'basic'
      };
      
      const response = await CourseAPI.createCourse(courseData);
      
      setAddingState(prev => ({ ...prev, [itemId]: false }));
      
      if (onCourseAdded) {
        onCourseAdded(response.data);
      }
      
      toast.success("Added to your watchlist!");
    } catch (error) {
      console.error("Error adding course:", error);
      setAddingState(prev => ({ ...prev, [itemId]: false }));
      toast.error("Failed to add to watchlist. Please try again.");
    }
    */
  };

  const addToWatchlist = async (item) => {
    // Normalize item format to handle both endpoint formats
    const normalizedItem = normalizeItemFormat(item);
    const videoId = normalizedItem.videoId;
    const playlistId = normalizedItem.playlistId;
    const itemId = playlistId || videoId;
    
    try {
      setWatchlistState(prev => ({ ...prev, [itemId]: true }));
      
      const isPlaylist = !!playlistId;
      
      const courseData = {
        title: normalizedItem.title,
        description: normalizedItem.description || "No description available",
        youtube_id: itemId,
        is_playlist: isPlaylist,
        thumbnail_url: normalizedItem.thumbnail,
        difficulty: 'basic'
      };
      
      const response = await CourseAPI.createCourse(courseData);
      
      setWatchlistState(prev => ({ ...prev, [itemId]: false }));
      
      if (onCourseAdded) {
        onCourseAdded(response.data);
      }
      
      toast.success("Added to your watchlist!");
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      setWatchlistState(prev => ({ ...prev, [itemId]: false }));
      toast.error("Failed to add to watchlist. Please try again.");
    }
  };

  const viewVideo = (item) => {
    // Use the normalized item format
    const normalizedItem = normalizeItemFormat(item);
    
    // Navigate directly to the content without auto-enrollment
    navigateToContent(normalizedItem);
  };
  
  const navigateToContent = (item) => {
    // Use the normalized item
    const normalizedItem = normalizeItemFormat(item);
    
    // Use the provided onViewVideo prop if available, otherwise use the default implementation
    if (onViewVideo) {
      onViewVideo(normalizedItem);
    } else {
      // Default implementation - direct navigation to video/playlist
      if (normalizedItem.playlistId) {
        navigate(`/courses/playlist/${normalizedItem.playlistId}`);
      } else if (normalizedItem.videoId) {
        navigate(`/courses/video/${normalizedItem.videoId}`);
      } else {
        console.error("Unable to navigate - no video or playlist ID");
      }
    }
  };

  const startQuizGeneration = (item) => {
    // Normalize the item format
    const normalizedItem = normalizeItemFormat(item);
    
    // First try to find if this is an added course
    const userCourse = userCourses.find(course => 
      course.youtube_id === (normalizedItem.videoId || normalizedItem.playlistId)
    );
    
    if (userCourse) {
      // If it's an added course, use the course ID
      navigate(`/quiz/generate/${userCourse.id}`);
    } else {
      // If not added, use the video or playlist ID directly
      const contentId = normalizedItem.videoId || normalizedItem.playlistId;
      if (contentId) {
        // Navigate directly to quiz generation with the video/playlist ID
        navigate(`/quiz/generate/${contentId}`);
      } else {
        toast.error('Unable to generate quiz - no valid content ID found.');
        console.error("No valid content ID found for quiz generation", normalizedItem);
      }
    }
  };

  return (
    <div className="search-results">
      {isDevelopment && (
        <div className="mb-4">
          <button 
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs font-mono bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </button>
          
          {showDebug && results && results.length > 0 && (
            <div className="mt-2 p-2 bg-gray-100 rounded-md overflow-auto text-xs font-mono">
              <p>API Format: {results[0].id ? "Production" : "Test"}</p>
              <p>First Result Keys: {Object.keys(results[0]).join(', ')}</p>
              <details>
                <summary>First Result Object</summary>
                <pre>{JSON.stringify(results[0], null, 2)}</pre>
              </details>
            </div>
          )}
        </div>
      )}
      
      {!results || results.length === 0 ? (
        <div className="col-span-full text-center py-8 text-gray-500">
          No results found
        </div>
      ) : (
        <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'} gap-4`}>
          {processedResults.map(item => {
            const itemId = item.playlistId || item.videoId;
            const isVideo = !item.playlistId;
            const isAdding = addingState[itemId];
            const isAddingToWatchlist = watchlistState[itemId];
            
            return (
              <div key={itemId} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                <div className="relative">
                  <div 
                    onClick={() => viewVideo(item)}
                    className="cursor-pointer block"
                  >
                    <img 
                      src={item.thumbnail} 
                      alt={item.title} 
                      className="w-full h-40 object-cover"
                    />
                    {!isVideo && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs font-medium rounded flex items-center">
                        <QueueListIcon className="h-3 w-3 mr-1" />
                        Playlist
                      </div>
                    )}
                    {isVideo && (
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs font-medium rounded flex items-center">
                        <FilmIcon className="h-3 w-3 mr-1" />
                        Video
                      </div>
                    )}
                    {item.isAdded && (
                      <div className="absolute top-2 left-2 bg-green-600 bg-opacity-90 text-white px-2 py-1 text-xs font-medium rounded flex items-center">
                        <CheckCircleIcon className="h-3 w-3 mr-1" />
                        Added
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="p-4">
                  <div 
                    onClick={() => viewVideo(item)}
                    className="cursor-pointer"
                  >
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 hover:text-primary-600">
                      {item.title}
                    </h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {item.channelTitle}
                  </p>
                  
                  <div className="flex space-x-2 flex-wrap gap-2">
                    <button
                      onClick={() => viewVideo(item)}
                      disabled={isAdding}
                      className="flex-1 min-w-[130px] bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200"
                    >
                      <PlayIcon className="h-4 w-4 mr-1" />
                      Start Learning
                    </button>
                    
                    <button
                      onClick={() => addToWatchlist(item)}
                      disabled={isAddingToWatchlist}
                      className={`flex-1 min-w-[130px] py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200 ${
                        item.isAdded 
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                          : 'bg-secondary-600 hover:bg-secondary-700 text-white'
                      }`}
                    >
                      {isAddingToWatchlist ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <BookmarkIcon className="h-4 w-4 mr-1" />
                          {item.isAdded ? 'Added to Watchlist' : 'Add to Watchlist'}
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => startQuizGeneration(item)}
                      disabled={isAdding}
                      className="flex-1 min-w-[130px] bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center transition-colors duration-200"
                    >
                      <AcademicCapIcon className="h-4 w-4 mr-1" />
                      Get Certified
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SearchResults; 