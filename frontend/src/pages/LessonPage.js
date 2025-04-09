import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../config';
import YouTubePlayer from '../components/courses/YouTubePlayer';
import QuizView from '../components/quiz/QuizView';
import QuizResult from '../components/quiz/QuizResult';
import { 
  ArrowLeftIcon, 
  ArrowRightIcon, 
  BookOpenIcon, 
  AcademicCapIcon, 
  CheckCircleIcon,
  ChevronRightIcon,
  PlayIcon,
  ClockIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ArrowUturnLeftIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const LessonPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProgress, setUserProgress] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [showLessonList, setShowLessonList] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  
  // Get the course and lesson data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        
        // Get course data
        const courseResponse = await axios.get(`${config.API_URL}/courses/${courseId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        setCourse(courseResponse.data);
        
        // Get user's progress in the course
        const progressResponse = await axios.get(`${config.API_URL}/user-courses/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const userCourse = progressResponse.data.find(
          uc => uc.course.toString() === courseId || uc.course_details?.id.toString() === courseId
        );
        
        if (userCourse) {
          setUserProgress(userCourse);
        }
        
        // If we have a lessonId, get that specific lesson
        if (lessonId) {
          const lessonResponse = await axios.get(`${config.API_URL}/lessons/${lessonId}/`, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          setLesson(lessonResponse.data);
        } else if (courseResponse.data.lessons && courseResponse.data.lessons.length > 0) {
          // If no lessonId is provided, navigate to the first lesson
          navigate(`/courses/${courseId}/lessons/${courseResponse.data.lessons[0].id}`);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course or lesson:', err);
        setError('Failed to load course content. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [courseId, lessonId, navigate]);
  
  // Update lesson progress when the video is played
  const handleProgress = async (progress) => {
    try {
      if (!lesson || !course) return;
      
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/lessons/${lesson.id}/progress/`, {
        progress: progress
      }, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // If the user completes the lesson (progress >= 0.9), show the quiz if available
      if (progress >= 0.9 && lesson.has_quiz) {
        setShowQuiz(true);
      }
    } catch (err) {
      console.error('Error updating lesson progress:', err);
    }
  };
  
  // Handle quiz completion
  const handleQuizComplete = (result) => {
    setQuizScore(result.score);
    setQuizResult(result);
    setQuizCompleted(true);
    
    // Update lesson completion status
    if (result.passed) {
      updateLessonCompletion();
    }
  };
  
  // Update lesson completion status
  const updateLessonCompletion = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/lessons/${lesson.id}/complete/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      // Refresh user progress
      const progressResponse = await axios.get(`${config.API_URL}/user-courses/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      const userCourse = progressResponse.data.find(
        uc => uc.course.toString() === courseId || uc.course_details?.id.toString() === courseId
      );
      
      if (userCourse) {
        setUserProgress(userCourse);
      }
    } catch (err) {
      console.error('Error updating lesson completion:', err);
    }
  };
  
  // Navigate to the next or previous lesson
  const navigateLesson = (direction) => {
    if (!course || !course.lessons || course.lessons.length === 0) return;
    
    const currentIndex = course.lessons.findIndex(l => l.id.toString() === lessonId);
    if (currentIndex === -1) return;
    
    if (direction === 'next' && currentIndex < course.lessons.length - 1) {
      navigate(`/courses/${courseId}/lessons/${course.lessons[currentIndex + 1].id}`);
    } else if (direction === 'prev' && currentIndex > 0) {
      navigate(`/courses/${courseId}/lessons/${course.lessons[currentIndex - 1].id}`);
    }
  };
  
  // Get the current lesson index and count
  const getLessonPosition = () => {
    if (!course || !course.lessons || !lessonId) return { current: 0, total: 0 };
    
    const currentIndex = course.lessons.findIndex(l => l.id.toString() === lessonId);
    return {
      current: currentIndex + 1,
      total: course.lessons.length
    };
  };
  
  const { current, total } = getLessonPosition();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
          <Link to="/courses" className="text-primary-600 hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
          <p>Course not found.</p>
        </div>
        <div className="mt-4">
          <Link to="/courses" className="text-primary-600 hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Course Header - Fixed at top */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Mobile menu toggle */}
            <button 
              className="md:hidden p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={() => setShowMobileNav(!showMobileNav)}
            >
              {showMobileNav ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            
            {/* Course info */}
            <div className="flex-1 mx-2">
              <Link to={`/courses/${courseId}`} className="text-gray-600 hover:text-gray-900 text-sm flex items-center">
                <ArrowUturnLeftIcon className="h-4 w-4 mr-1" />
                Back to course
              </Link>
              <h1 className="text-xl font-bold line-clamp-1">{course.title}</h1>
            </div>
            
            {/* Lesson navigation controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateLesson('prev')}
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
                onClick={() => navigateLesson('next')}
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
                className="ml-2 p-2 text-gray-600 hover:bg-gray-100 rounded-full hidden md:block"
              >
                {showLessonList ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile navigation drawer */}
      {showMobileNav && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-900 bg-opacity-50">
          <div className="h-full w-3/4 max-w-xs bg-white overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold text-lg">{course.title}</h2>
              <p className="text-sm text-gray-500">{total} lessons</p>
            </div>
            
            <div className="p-4">
              <h3 className="font-medium text-gray-700 mb-2">Lessons</h3>
              <ul className="space-y-1">
                {course.lessons && course.lessons.map((lessonItem, index) => (
                  <li key={lessonItem.id}>
                    <Link
                      to={`/courses/${courseId}/lessons/${lessonItem.id}`}
                      className={`flex items-center p-2 rounded-lg ${
                        lessonItem.id.toString() === lessonId
                          ? 'bg-primary-50 text-primary-700 font-medium'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => setShowMobileNav(false)}
                    >
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-xs mr-2">
                        {index + 1}
                      </span>
                      <span className="flex-1 line-clamp-1">{lessonItem.title}</span>
                      {lessonItem.completed && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500 ml-2" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div 
            className="h-full w-1/4 min-w-[25%]" 
            onClick={() => setShowMobileNav(false)}
          ></div>
        </div>
      )}
      
      <div className={`container mx-auto px-4 py-6 ${showLessonList ? 'pb-0' : ''}`}>
        {/* Lesson List - Expandable/Collapsible */}
        {showLessonList && (
          <div className="bg-white rounded-t-lg border border-gray-200 mb-4 hidden md:block">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-bold">Course Content</h2>
              <p className="text-sm text-gray-500">{total} lessons</p>
            </div>
            <div className="max-h-60 overflow-y-auto p-2">
              <ul className="divide-y divide-gray-100">
                {course.lessons && course.lessons.map((lessonItem, index) => (
                  <li key={lessonItem.id}>
                    <Link
                      to={`/courses/${courseId}/lessons/${lessonItem.id}`}
                      className={`flex items-center p-2 rounded-md ${
                        lessonItem.id.toString() === lessonId
                          ? 'bg-primary-50 text-primary-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="mr-3 flex-shrink-0">
                        {lessonItem.id.toString() === lessonId ? (
                          <PlayIcon className="h-5 w-5 text-primary-600" />
                        ) : lessonItem.completed ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        ) : (
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${
                          lessonItem.id.toString() === lessonId
                            ? 'text-primary-700'
                            : lessonItem.completed
                              ? 'text-gray-900'
                              : 'text-gray-700'
                        }`}>
                          {index + 1}. {lessonItem.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {lessonItem.duration || '5:00'} • {lessonItem.completed ? 'Completed' : 'Not completed'}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        
        <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${showLessonList ? 'mt-4' : ''}`}>
          {/* Main Content */}
          <div className="lg:col-span-3">
            {lesson ? (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {/* Video Player */}
                <div className="aspect-w-16 aspect-h-9">
                  <YouTubePlayer
                    videoId={lesson.youtube_id}
                    onProgress={handleProgress}
                  />
                </div>
                
                {/* Lesson Content */}
                <div className="p-6">
                  <h1 className="text-2xl font-bold mb-2">{lesson.title}</h1>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1" />
                      {lesson.duration || '5:00'}
                    </span>
                    
                    {lesson.completed && (
                      <span className="px-3 py-1 bg-green-100 rounded-full text-sm text-green-700 flex items-center">
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Completed
                      </span>
                    )}
                    
                    {lesson.has_quiz && (
                      <span className="px-3 py-1 bg-blue-100 rounded-full text-sm text-blue-700 flex items-center">
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        Includes Quiz
                      </span>
                    )}
                  </div>
                  
                  {lesson.description && (
                    <div className="prose max-w-none">
                      <p>{lesson.description}</p>
                    </div>
                  )}
                  
                  {/* Quiz Section */}
                  {lesson.has_quiz && !quizCompleted && showQuiz && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-bold mb-4">Lesson Quiz</h2>
                      <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="text-blue-700">
                          Complete this quiz to test your understanding of the lesson content.
                        </p>
                      </div>
                      <QuizView 
                        lessonId={lesson.id} 
                        onComplete={handleQuizComplete} 
                      />
                    </div>
                  )}
                  
                  {/* Quiz Results */}
                  {quizCompleted && quizResult && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-bold mb-4">Quiz Results</h2>
                      <QuizResult 
                        result={quizResult}
                        lessonId={lesson.id}
                        courseId={courseId}
                      />
                    </div>
                  )}
                  
                  {/* Navigation Buttons */}
                  <div className="mt-8 flex justify-between items-center pt-6 border-t border-gray-200">
                    <button
                      onClick={() => navigateLesson('prev')}
                      disabled={current <= 1}
                      className={`flex items-center px-4 py-2 rounded-lg ${
                        current <= 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ArrowLeftIcon className="h-5 w-5 mr-1" />
                      Previous Lesson
                    </button>
                    
                    {current < total ? (
                      <button
                        onClick={() => navigateLesson('next')}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        Next Lesson
                        <ArrowRightIcon className="h-5 w-5 ml-1" />
                      </button>
                    ) : (
                      <Link
                        to={`/courses/${courseId}`}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Complete Course
                        <CheckCircleIcon className="h-5 w-5 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-500">No lesson selected. Please choose a lesson from the list.</p>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="hidden lg:block">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-24">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-bold">Course Progress</h3>
              </div>
              
              <div className="p-4">
                {userProgress ? (
                  <div>
                    <div className="mb-2 flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {Math.round(userProgress.progress * 100)}% Complete
                      </span>
                      <span className="text-sm text-gray-600">
                        {course.lessons?.filter(l => l.completed).length || 0} / {total} lessons
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-primary-600 h-2.5 rounded-full" 
                        style={{ width: `${userProgress.progress * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No progress recorded yet</p>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-200">
                <h3 className="font-bold mb-2">Lessons</h3>
                <ul className="space-y-1 max-h-[350px] overflow-y-auto">
                  {course.lessons && course.lessons.map((lessonItem, index) => (
                    <li key={lessonItem.id}>
                      <Link
                        to={`/courses/${courseId}/lessons/${lessonItem.id}`}
                        className={`flex items-start p-2 rounded-md ${
                          lessonItem.id.toString() === lessonId
                            ? 'bg-primary-50 text-primary-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="mr-2 flex-shrink-0 mt-0.5">
                          {lessonItem.completed ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <span className="w-4 h-4 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 text-[10px]">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        <span className={`text-sm ${
                          lessonItem.id.toString() === lessonId
                            ? 'font-medium'
                            : ''
                        } line-clamp-2`}>
                          {lessonItem.title}
                        </span>
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
                  Back to Course
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPage; 