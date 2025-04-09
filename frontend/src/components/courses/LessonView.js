import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import YouTubePlayer from './YouTubePlayer';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  CheckCircleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  PlayIcon,
  ClockIcon,
  BookOpenIcon,
  XMarkIcon,
  MenuIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const LessonView = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [userCourse, setUserCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [showLessonList, setShowLessonList] = useState(true);
  
  useEffect(() => {
    const fetchLessonData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        
        // Fetch course details
        const courseResponse = await axios.get(`${config.API_URL}/courses/${courseId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setCourse(courseResponse.data);
        
        // Get all lessons for this course
        setLessons(courseResponse.data.lessons || []);
        
        // Find the current lesson
        const currentLesson = courseResponse.data.lessons?.find(
          l => l.id.toString() === lessonId
        );
        
        if (currentLesson) {
          setLesson(currentLesson);
        } else {
          // If lesson not found in course data, fetch it directly
          const lessonResponse = await axios.get(`${config.API_URL}/lessons/${lessonId}/`, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          setLesson(lessonResponse.data);
        }
        
        // Get user course progress
        const userCourseResponse = await axios.get(`${config.API_URL}/user-courses/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const userCourseData = userCourseResponse.data.find(
          uc => uc.course.toString() === courseId || 
               (uc.course_details && uc.course_details.id.toString() === courseId)
        );
        
        if (userCourseData) {
          setUserCourse(userCourseData);
          
          // Check if this lesson is already completed
          const completedLessons = userCourseData.completed_lessons || [];
          setIsVideoCompleted(completedLessons.includes(parseInt(lessonId)));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson data:', err);
        setError('Failed to load lesson. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchLessonData();
  }, [courseId, lessonId]);
  
  // Handle video completion
  const handleVideoComplete = async () => {
    if (isVideoCompleted) return; // Skip if already completed
    
    try {
      const token = localStorage.getItem('token');
      
      // Mark lesson as completed
      await axios.post(`${config.API_URL}/lessons/${lessonId}/complete/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setIsVideoCompleted(true);
      
      // Update user course data
      const userCourseResponse = await axios.get(`${config.API_URL}/user-courses/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      const updatedUserCourse = userCourseResponse.data.find(
        uc => uc.course.toString() === courseId || 
             (uc.course_details && uc.course_details.id.toString() === courseId)
      );
      
      if (updatedUserCourse) {
        setUserCourse(updatedUserCourse);
      }
    } catch (err) {
      console.error('Error completing lesson:', err);
    }
  };
  
  // Navigate to next/previous lesson
  const navigateToLesson = (direction) => {
    if (!lessons || lessons.length === 0) return;
    
    const currentIndex = lessons.findIndex(l => l.id.toString() === lessonId);
    if (currentIndex === -1) return;
    
    if (direction === 'next' && currentIndex < lessons.length - 1) {
      navigate(`/courses/${courseId}/lessons/${lessons[currentIndex + 1].id}`);
    } else if (direction === 'prev' && currentIndex > 0) {
      navigate(`/courses/${courseId}/lessons/${lessons[currentIndex - 1].id}`);
    }
  };
  
  // Get lesson position
  const getLessonPosition = () => {
    if (!lessons || !lessonId) return { current: 0, total: 0 };
    
    const currentIndex = lessons.findIndex(l => l.id.toString() === lessonId);
    return {
      current: currentIndex + 1,
      total: lessons.length
    };
  };
  
  const { current, total } = getLessonPosition();
  
  // Handle automatic play next lesson
  const handleContinue = () => {
    navigateToLesson('next');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
        <p className="font-medium">{error}</p>
        <Link to={`/courses/${courseId}`} className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Course
        </Link>
      </div>
    );
  }
  
  if (!lesson) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
        <p className="font-medium">Lesson not found</p>
        <Link to={`/courses/${courseId}`} className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Course
        </Link>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header - Fixed at top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex-1 ml-2">
              <Link to={`/courses/${courseId}`} className="text-gray-600 hover:text-gray-900 text-sm flex items-center">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to course
              </Link>
              <h1 className="text-xl font-bold truncate">{course?.title}</h1>
            </div>
            
            {/* Lesson navigation controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateToLesson('prev')}
                disabled={current <= 1}
                className={`p-2 rounded-full ${
                  current <= 1 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              
              <span className="text-sm font-medium">
                {current} / {total}
              </span>
              
              <button
                onClick={() => navigateToLesson('next')}
                disabled={current >= total}
                className={`p-2 rounded-full ${
                  current >= total 
                    ? 'text-gray-300 cursor-not-allowed' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ArrowRightIcon className="h-5 w-5" />
              </button>
              
              {/* Toggle lesson list */}
              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-full"
              >
                {showLessonList ? 
                  <ChevronUpIcon className="h-5 w-5" /> : 
                  <ChevronDownIcon className="h-5 w-5" />
                }
              </button>
              
              {/* Toggle sidebar (mobile only) */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <MenuIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Lesson List - Expanded/Collapsed */}
      {showLessonList && (
        <div className="container mx-auto px-4 border-b border-gray-200 bg-white">
          <div className="py-3 overflow-x-auto">
            <div className="flex space-x-2">
              {lessons.map((item, index) => (
                <Link
                  key={item.id}
                  to={`/courses/${courseId}/lessons/${item.id}`}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center ${
                    item.id.toString() === lessonId
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.id.toString() === lessonId ? (
                    <PlayIcon className="h-4 w-4 mr-1" />
                  ) : item.completed ? (
                    <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                  ) : (
                    <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-gray-800 text-xs mr-1">
                      {index + 1}
                    </span>
                  )}
                  <span className="text-sm truncate max-w-[150px]">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main video player */}
          <div className="md:flex-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Video Player */}
              <div className="aspect-w-16 aspect-h-9">
                <YouTubePlayer 
                  videoId={lesson.youtube_id} 
                  onComplete={handleVideoComplete}
                />
              </div>
              
              {/* Lesson Details */}
              <div className="p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h2 className="text-xl font-bold">{lesson.title}</h2>
                  
                  <div className="flex items-center space-x-2">
                    {isVideoCompleted && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    )}
                    
                    {lesson.duration && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        {lesson.duration}
                      </span>
                    )}
                  </div>
                </div>
                
                {lesson.description && (
                  <div className="prose max-w-none mb-6">
                    <p>{lesson.description}</p>
                  </div>
                )}
                
                {/* Lesson Navigation */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigateToLesson('prev')}
                    disabled={current <= 1}
                    className={`flex items-center px-3 py-1.5 rounded-lg ${
                      current <= 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <ArrowLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <Link
                    to={`/courses/${courseId}`}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Back to Course
                  </Link>
                  
                  {current < total ? (
                    <button
                      onClick={() => navigateToLesson('next')}
                      disabled={!isVideoCompleted}
                      className={`flex items-center px-3 py-1.5 rounded-lg ${
                        !isVideoCompleted
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                    >
                      Next
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  ) : (
                    <Link
                      to={`/courses/${courseId}/quiz`}
                      className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Take Quiz
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Sidebar - Course Progress and Lessons List (desktop) */}
          <div className="hidden md:block md:w-80">
            <div className="bg-white rounded-lg shadow-sm sticky top-24">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold">Course Progress</h3>
                
                {userCourse && (
                  <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>{Math.round(userCourse.progress * 100)}% complete</span>
                      <span>
                        {lessons.filter(l => l.completed).length || 0} / {lessons.length} lessons
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${userCourse.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="font-bold mb-3">Lessons</h3>
                <ul className="space-y-1 max-h-[400px] overflow-y-auto">
                  {lessons.map((item, index) => (
                    <li key={item.id}>
                      <Link
                        to={`/courses/${courseId}/lessons/${item.id}`}
                        className={`flex items-start px-3 py-2 rounded-lg ${
                          item.id.toString() === lessonId
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5 mr-2">
                          {item.completed ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[10px]">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${item.id.toString() === lessonId ? 'font-medium' : ''}`}>
                            {item.title}
                          </p>
                          {item.duration && (
                            <p className="text-xs text-gray-500">{item.duration}</p>
                          )}
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <Link
                  to={`/courses/${courseId}`}
                  className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Course Overview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-xs bg-white overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold">Course Content</h3>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {userCourse && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-medium mb-2">Your Progress</h3>
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>{Math.round(userCourse.progress * 100)}% complete</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${userCourse.progress * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <ul className="py-2">
              {lessons.map((item, index) => (
                <li key={item.id} className="px-4">
                  <Link
                    to={`/courses/${courseId}/lessons/${item.id}`}
                    className={`flex items-center py-3 ${
                      item.id.toString() === lessonId ? 'text-primary-600 font-medium' : ''
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="mr-3 flex-shrink-0">
                      {item.completed ? (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      ) : (
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs">
                          {index + 1}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm">{item.title}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            
            <div className="p-4 mt-4">
              <Link
                to={`/courses/${courseId}`}
                className="flex items-center justify-center w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                onClick={() => setSidebarOpen(false)}
              >
                <BookOpenIcon className="h-5 w-5 mr-2" />
                Back to Course
              </Link>
            </div>
          </div>
          
          <div 
            className="absolute left-0 top-0 bottom-0 w-1/4"
            onClick={() => setSidebarOpen(false)}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LessonView; 