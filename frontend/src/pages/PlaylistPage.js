import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import api from '../utils/apiService';
import { CourseAPI } from '../utils/api';
import YouTubePlayer from '../components/courses/YouTubePlayer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  ListBulletIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

const PlaylistPage = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [playlistItems, setPlaylistItems] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  
  const { user } = useAuth(); // Get user from AuthContext

  useEffect(() => {
    const fetchPlaylistInfo = async () => {
      setLoading(true);
      try {
        console.log("Fetching playlist info for ID:", playlistId);
        const playlistResponse = await CourseAPI.searchYouTube(playlistId, 'playlist', true);
        
        console.log("Playlist response:", playlistResponse.data);
        
        if (Array.isArray(playlistResponse.data) && playlistResponse.data.length > 0) {
          const playlistData = playlistResponse.data[0];
          console.log("Processing playlist data:", playlistData);
          
          if (playlistData.id || playlistData.playlistId) {
            const normalizedData = {
              id: playlistData.id || playlistData.playlistId,
              title: playlistData.title,
              description: playlistData.description || "No description available",
              thumbnail: playlistData.thumbnail,
              channelTitle: playlistData.channelTitle,
              itemCount: playlistData.videoCount || playlistData.itemCount || 0
            };
            
            setPlaylistInfo(normalizedData);
            
            // Fetch playlist items
            try {
              const itemsResponse = await api.get(`youtube/playlist-items/${normalizedData.id}/`);
              if (itemsResponse.data?.items) {
                setPlaylistItems(itemsResponse.data.items);
              }
            } catch (itemsErr) {
              console.error("Error fetching playlist items:", itemsErr);
              setPlaylistItems([]);
            }
          } else {
            setError('Invalid playlist data received');
          }
        } else {
          setError('Playlist not found or invalid data format');
        }
      } catch (err) {
        console.error('Error fetching playlist info:', err);
        setError('Failed to load playlist information');
      } finally {
        setLoading(false);
      }
    };
    
    if (playlistId) {
      fetchPlaylistInfo();
    }
  }, [playlistId]);
  
  const handleBackNavigation = () => {
    navigate('/courses');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <button
            onClick={handleBackNavigation}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Back to Courses
          </button>
        </div>
      </div>
    );
  }
  
  if (!playlistInfo || !currentVideo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p>Playlist information could not be loaded</p>
        </div>
        <div className="mt-4">
          <button
            onClick={handleBackNavigation}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Go Back to Courses
          </button>
        </div>
      </div>
    );
  }
  
  const videoId = currentVideo.snippet?.resourceId?.videoId || currentVideo.id?.videoId;

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={handleBackNavigation}
          className="flex items-center text-primary-600 hover:text-primary-800 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-1" />
          Back to Courses
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Video and details */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
            {videoId && (
              <YouTubePlayer 
                videoId={videoId} 
              />
            )}
          </div>
          
          {/* Video details */}
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900 pr-4">
                {currentVideo?.snippet?.title || 'Loading video...'}
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center justify-between mt-2 pb-3 border-b border-gray-200">
              <div className="flex items-center text-sm text-gray-600 my-1">
                <span className="mr-3">
                  {playlistInfo.channelTitle || playlistInfo.snippet?.channelTitle}
                </span>
                
                <span className="flex items-center">
                  <ListBulletIcon className="h-4 w-4 mr-1" />
                  {playlistInfo.itemCount || playlistItems.length} videos
                </span>
              </div>
            </div>
            
            {/* Video description */}
            <div className="mt-4">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center text-gray-700 font-medium mb-2"
              >
                Description
                <ChevronDownIcon 
                  className={`h-5 w-5 ml-1 transition-transform ${showDescription ? 'transform rotate-180' : ''}`} 
                />
              </button>
              
              {showDescription && (
                <div className="bg-gray-50 p-4 rounded-lg text-sm whitespace-pre-line">
                  {currentVideo.snippet.description}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Sidebar - Playlist videos */}
        <div id="playlist-sidebar" className="lg:col-span-1">
          <div className="mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <ListBulletIcon className="h-5 w-5 mr-2" />
              Playlist: {playlistInfo.title}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {playlistItems.length} videos
            </p>
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
            {playlistItems.map((item, index) => (
              <div 
                key={item.id}
                className={`flex p-2 rounded-lg hover:bg-gray-50 cursor-pointer`}
              >
                <div className="flex-shrink-0 w-24 h-16 relative mr-3">
                  <img 
                    src={item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url} 
                    alt={item.snippet.title} 
                    className="w-full h-full object-cover rounded"
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                    {index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-medium text-gray-900 line-clamp-2`}>
                    {item.snippet.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistPage; 