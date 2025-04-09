import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  UserPlusIcon, 
  BookOpenIcon,
  PlayIcon,
  ExclamationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const CourseDetail = () => {
  const { currentUser } = useAuth();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    isEnrolled: false,
    isEnrolling: false,
    progress: 0,
    error: ''
  });
  
  // Fetch course details and check enrollment status
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view course details');
          setLoading(false);
          return;
        }
        
        // Fetch course details
        const courseResponse = await axios.get(`${config.API_URL}/courses/${courseId}/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setCourse(courseResponse.data);
        
        // Check if user is enrolled
        if (currentUser) {
          const enrollmentResponse = await axios.get(`${config.API_URL}/user-courses/`, {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          
          const enrolledCourses = Array.isArray(enrollmentResponse.data) 
            ? enrollmentResponse.data 
            : (enrollmentResponse.data.results || []);
          
          const enrollment = enrolledCourses.find(
            uc => uc.course.toString() === courseId || 
                 (uc.course_details && uc.course_details.id.toString() === courseId)
          );
          
          if (enrollment) {
            setEnrollmentStatus({
              isEnrolled: true,
              isEnrolling: false,
              progress: enrollment.progress,
              error: ''
            });
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId, currentUser]);
  
  // Handle course enrollment
  const handleEnroll = async () => {
    if (!currentUser) {
      navigate('/login', { state: { from: `/courses/${courseId}` } });
      return;
    }
    
    setEnrollmentStatus(prev => ({ ...prev, isEnrolling: true, error: '' }));
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${config.API_URL}/courses/${courseId}/enroll/`, {}, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setEnrollmentStatus({
        isEnrolled: true,
        isEnrolling: false,
        progress: 0,
        error: ''
      });
      
      // Show success message or redirect to first lesson
      if (course.lessons && course.lessons.length > 0) {
        navigate(`/courses/${courseId}/lessons/${course.lessons[0].id}`);
      } else {
        // For single videos without lessons
        navigate(`/courses/${courseId}/watch`);
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.detail || 
                          'Failed to enroll in this course. Please try again.';
      
      setEnrollmentStatus(prev => ({
        ...prev,
        isEnrolling: false,
        error: errorMessage
      }));
      
      // If already enrolled, just navigate to the course
      if (err.response?.status === 400 && 
          err.response?.data?.detail?.includes('Already enrolled')) {
        setEnrollmentStatus({
          isEnrolled: true,
          isEnrolling: false,
          progress: 0,
          error: ''
        });
        
        if (course.lessons && course.lessons.length > 0) {
          navigate(`/courses/${courseId}/lessons/${course.lessons[0].id}`);
        } else {
          navigate(`/courses/${courseId}/watch`);
        }
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ArrowPathIcon className="h-10 w-10 text-primary-600 animate-spin" />
        <span className="ml-2 text-gray-600">Loading course details...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
          <span>{error}</span>
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
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Course Header */}
          <div className="relative">
            <img 
              src={course.thumbnail_url || '/course-placeholder.jpg'} 
              alt={course.title} 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-center p-6">
                <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
                <div className="flex items-center justify-center space-x-4 text-white">
                  {course.is_playlist ? (
                    <span className="flex items-center">
                      <BookOpenIcon className="h-5 w-5 mr-1" />
                      {course.lessons?.length || 0} lessons
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <PlayIcon className="h-5 w-5 mr-1" />
                      Single Video
                    </span>
                  )}
                  <span className="flex items-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.difficulty === 'basic' 
                        ? 'bg-green-500 text-white' 
                        : course.difficulty === 'intermediate' 
                          ? 'bg-yellow-500 text-white' 
                          : 'bg-red-500 text-white'
                    }`}>
                      {course.difficulty?.charAt(0).toUpperCase() + course.difficulty?.slice(1) || 'Basic'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Course Content */}
          <div className="p-6">
            {/* Enrollment Status */}
            {enrollmentStatus.isEnrolled ? (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
                  <span className="text-green-700 font-medium">You're enrolled in this course</span>
                </div>
                <Link
                  to={course.lessons && course.lessons.length > 0
                    ? `/courses/${courseId}/lessons/${course.lessons[0].id}`
                    : `/courses/${courseId}/watch`}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center"
                >
                  <PlayIcon className="h-5 w-5 mr-1" />
                  {enrollmentStatus.progress > 0 ? 'Continue Learning' : 'Start Learning'}
                </Link>
              </div>
            ) : (
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex flex-wrap items-center justify-between">
                  <span className="text-blue-700">Enroll in this course to track your progress and earn a certificate.</span>
                  <button
                    onClick={handleEnroll}
                    disabled={enrollmentStatus.isEnrolling}
                    className={`mt-3 sm:mt-0 px-4 py-2 rounded-lg flex items-center ${
                      enrollmentStatus.isEnrolling
                        ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                        : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {enrollmentStatus.isEnrolling ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 mr-1 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="h-5 w-5 mr-1" />
                        Enroll Now
                      </>
                    )}
                  </button>
                </div>
                {enrollmentStatus.error && (
                  <div className="mt-2 text-red-600 text-sm flex items-center">
                    <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                    {enrollmentStatus.error}
                  </div>
                )}
              </div>
            )}
            
            {/* Course Description */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-3">About this course</h2>
              <p className="text-gray-700 whitespace-pre-line">{course.description}</p>
            </div>
            
            {/* Lessons List */}
            {course.is_playlist && course.lessons && course.lessons.length > 0 && (
              <div>
                <h2 className="text-xl font-bold mb-3">Course Content</h2>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <span className="font-medium">{course.lessons.length} Lessons</span>
                    {enrollmentStatus.isEnrolled && (
                      <span className="text-sm text-gray-500">
                        {Math.round(enrollmentStatus.progress * 100)}% Complete
                      </span>
                    )}
                  </div>
                  <ul className="divide-y divide-gray-200">
                    {course.lessons.map((lesson, index) => (
                      <li key={lesson.id} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 mr-3">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {lesson.title}
                            </p>
                            {lesson.duration && (
                              <p className="text-sm text-gray-500 flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {lesson.duration}
                              </p>
                            )}
                          </div>
                          {enrollmentStatus.isEnrolled ? (
                            <Link
                              to={`/courses/${courseId}/lessons/${lesson.id}`}
                              className="ml-4 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                              {lesson.completed ? 'Review' : 'Start'}
                            </Link>
                          ) : (
                            <button
                              onClick={handleEnroll}
                              className="ml-4 px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                            >
                              Enroll to Access
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/courses"
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center"
              >
                <BookOpenIcon className="h-5 w-5 mr-1" />
                Browse More Courses
              </Link>
              {!enrollmentStatus.isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrollmentStatus.isEnrolling}
                  className={`px-4 py-2 rounded-lg flex items-center ${
                    enrollmentStatus.isEnrolling
                      ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {enrollmentStatus.isEnrolling ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 mr-1 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <UserPlusIcon className="h-5 w-5 mr-1" />
                      Enroll Now
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail; 