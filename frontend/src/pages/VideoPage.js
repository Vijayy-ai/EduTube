import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/apiService';
import { CourseAPI } from '../utils/api';
import YouTubePlayer from '../components/courses/YouTubePlayer';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  PlayIcon,
  HandThumbUpIcon,
  ChevronDownIcon,
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const VideoPage = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // Get user from AuthContext
  const [videoInfo, setVideoInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [addingCourse, setAddingCourse] = useState(false);
  const searchBoxRef = useRef(null);
  
  useEffect(() => {
    const fetchVideoInfo = async () => {
      try {
        setLoading(true);
        
        // Fetch video details from YouTube API
        const response = await CourseAPI.searchYouTube(videoId, 'video', true);
        
        // Process the response data
        if (response.data && response.data.length > 0) {
          const videoData = response.data[0];
          
          // Normalize the data to handle different API formats
          const normalizedData = {
            ...videoData,
            videoId: videoData.videoId || videoData.id,
            thumbnail: videoData.thumbnail || 
                      (videoData.thumbnails?.high?.url || 
                      (videoData.thumbnails?.default?.url))
          };
          
          setVideoInfo(normalizedData);
          document.title = `${normalizedData.title} | EduTube`;
          
          // Commented out related videos fetching due to API credit limitations
          /*
          const relatedResponse = await CourseAPI.searchYouTube(
            normalizedData.title?.split(' ').slice(0, 3).join(' ') || '', 
            'video',
            false
          );
          
          if (relatedResponse.data && relatedResponse.data.length > 0) {
            setRelatedVideos(relatedResponse.data.filter(video => 
              (video.videoId || video.id) !== videoId
            ));
          }
          */
        } else {
          setError('Video not found');
        }
      } catch (err) {
        console.error('Error fetching video:', err);
        setError('Failed to load video information');
      } finally {
        setLoading(false);
      }
    };
    
    if (videoId) {
      fetchVideoInfo();
    }
  }, [videoId]);
  
  // Make sidebar sticky on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sidebar = document.getElementById('video-sidebar');
      if (sidebar) {
        if (window.scrollY > 100) {
          sidebar.classList.add('sticky-sidebar');
        } else {
          sidebar.classList.remove('sticky-sidebar');
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };
  
  const handleVideoComplete = () => {
    console.log('Video playback completed');
    updateProgress(100);
  };
  
  const handleVideoProgress = (progress) => {
    console.log(`Video progress: ${progress}%`);
    if (progress % 10 === 0) {
      updateProgress(progress);
    }
  };
  
  const updateProgress = async (progressPercent) => {
    if (!user) return; // Ensure user is authenticated
    try {
      // First check if we have a course with this YouTube ID
      const coursesResponse = await api.get('courses/', {
        params: {
          youtube_id: videoId
        }
      });
      
      const courses = Array.isArray(coursesResponse.data) 
        ? coursesResponse.data 
        : coursesResponse.data.results || [];
        
      // Find the course that matches this video
      const matchingCourse = courses.find(course => course.youtube_id === videoId);
      
      if (matchingCourse) {
        console.log(`Found existing course with ID ${matchingCourse.id} for video ${videoId}`);
        
        // Now check if user is enrolled in this course
        const userCoursesResponse = await api.get('user-courses/', {
          headers: {
            'Authorization': `Token ${user.token}`
          }
        });
        
        const userCourses = Array.isArray(userCoursesResponse.data) 
          ? userCoursesResponse.data 
          : userCoursesResponse.data.results || [];
        
        const existingEnrollment = userCourses.find(uc => uc.course === matchingCourse.id);
        
        if (existingEnrollment) {
          console.log(`Updating progress for course enrollment ${existingEnrollment.id}`);
          // Update existing enrollment
          await CourseAPI.updateProgress(existingEnrollment.id, {
            progress: progressPercent,
            completed: progressPercent >= 100
          });
        } else {
          console.log(`Enrolling user in course ${matchingCourse.id}`);
          // Enroll user and then update progress
          await CourseAPI.enrollCourse(matchingCourse.id);
          
          // Get the new enrollment ID
          const updatedUserCoursesResponse = await api.get('user-courses/');
          const newUserCourses = Array.isArray(updatedUserCoursesResponse.data) 
            ? updatedUserCoursesResponse.data 
            : updatedUserCoursesResponse.data.results || [];
          
          const newEnrollment = newUserCourses.find(uc => uc.course === matchingCourse.id);
          
          if (newEnrollment) {
            await CourseAPI.updateProgress(newEnrollment.id, {
              progress: progressPercent,
              completed: progressPercent >= 100
            });
          }
        }
      } else {
        console.log(`Creating new course for video ${videoId}`);
        // Create a new course for this video
        const courseData = {
          title: videoInfo.title,
          description: videoInfo.description || 'No description available',
          youtube_id: videoId,
          is_playlist: false,
          thumbnail_url: videoInfo.thumbnail,
          difficulty: 'basic'
        };
        
        const courseResponse = await CourseAPI.createCourse(courseData);
        console.log(`Created new course with ID ${courseResponse.data.id}`);
        
        // Enroll the user in the new course
        await CourseAPI.enrollCourse(courseResponse.data.id);
        
        // Now find the enrollment to update progress
        const latestUserCoursesResponse = await api.get('user-courses/');
        const latestUserCourses = Array.isArray(latestUserCoursesResponse.data) 
          ? latestUserCoursesResponse.data 
          : latestUserCoursesResponse.data.results || [];
        
        const newCourseEnrollment = latestUserCourses.find(uc => uc.course === courseResponse.data.id);
        
        if (newCourseEnrollment) {
          console.log(`Updating progress for new enrollment ${newCourseEnrollment.id}`);
          await CourseAPI.updateProgress(newCourseEnrollment.id, {
            progress: progressPercent,
            completed: progressPercent >= 100
          });
        }
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };
  
  const addCourse = async (video = videoInfo) => {
    // TEMPORARILY DISABLED: Auto-adding to watchlist is disabled as requested
    toast.info("Adding to watchlist is temporarily disabled");
    return;
    
    // Original code commented out
    /*
    if (!video || !user) return; // Ensure user is authenticated
    try {
      setAddingCourse(true);
      const isSampleData = video.isSample === true;
      const title = isSampleData ? video.title : video.snippet?.title;
      const description = isSampleData ? video.description : (video.snippet?.description || 'No description available');
      const thumbnailUrl = isSampleData ? video.thumbnail : 
                          (video.snippet?.thumbnails?.high?.url || video.snippet?.thumbnails?.default?.url);
      
      if (!title) {
        setError("Failed to add course: Invalid video data");
        setAddingCourse(false);
        return;
      }
      
      const courseData = {
        title: title,
        description: description,
        youtube_id: videoId,
        is_playlist: false,
        thumbnail_url: thumbnailUrl,
        difficulty: 'basic'
      };
      
      const response = await CourseAPI.createCourse(courseData);
      navigate(`/courses/${response.data.id}`);
    } catch (error) {
      console.error('Error adding course:', error);
      setError('Failed to add course. Please try again.');
    } finally {
      setAddingCourse(false);
    }
    */
  };
  
  const formatViewCount = (count) => {
    if (!count) return 'N/A';
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    } else {
      return count.toString();
    }
  };
  
  const handleBackNavigation = () => {
    const fromSearch = location.state?.from === 'search';
    if (fromSearch) {
      navigate('/courses', { state: { from: 'content' } });
    } else {
      navigate('/courses');
    }
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
  
  if (!videoInfo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p>Video information could not be loaded</p>
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
  
  return (
    <div className="container mx-auto px-4 py-6">
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
        <div className="lg:col-span-2">
          <div className="aspect-w-16 aspect-h-9 bg-black rounded-lg overflow-hidden">
            <YouTubePlayer 
              videoId={videoId} 
              onVideoComplete={handleVideoComplete}
              onVideoProgress={handleVideoProgress}
            />
          </div>
          
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {videoInfo.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between mt-2 pb-3 border-b border-gray-200">
              <div className="flex items-center text-sm text-gray-600 my-1">
                <span className="mr-3">
                  {videoInfo.channelTitle}
                </span>
                {videoInfo.statistics && (
                  <>
                    <span className="mx-3 flex items-center">
                      <HandThumbUpIcon className="h-5 w-5 mr-1" />
                      {formatViewCount(videoInfo.statistics.likeCount || 0)}
                    </span>
                    <span className="mx-3">
                      {formatViewCount(videoInfo.statistics.viewCount || 0)} views
                    </span>
                  </>
                )}
              </div>
              
              <div className="flex space-x-2 my-1">
                <button
                  onClick={() => addCourse()}
                  disabled={addingCourse}
                  className="bg-primary-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center"
                >
                  {addingCourse ? (
                    <span className="animate-pulse">Adding...</span>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4 mr-1" />
                      Start Learning
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => navigate(`/quiz/generate/${videoId}`)}
                  className="bg-secondary-600 text-white py-2 px-3 rounded-lg text-sm font-medium hover:bg-secondary-700 flex items-center"
                >
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  Get Certified
                </button>
              </div>
            </div>
            
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
                  {videoInfo.description}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div id="video-sidebar" className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Related Videos</h2>
          
          <div className="space-y-4">
            {/* Related videos section is currently disabled */}
            <div className="text-center text-gray-500 py-4">
              No related videos available at this time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage; 