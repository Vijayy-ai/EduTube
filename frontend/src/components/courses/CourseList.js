import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/apiService';
import { 
  ArrowPathIcon, 
  ExclamationCircleIcon, 
  BookOpenIcon,
  PlusCircleIcon, 
  FunnelIcon 
} from '@heroicons/react/24/outline';

const CourseList = ({ limit, difficulty, userCourses = [], isHomePage = false }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredDifficulty, setFilteredDifficulty] = useState(difficulty || 'all');
  const fetchedRef = useRef(false);
  const userCoursesRef = useRef(null);
  
  // Update userCoursesRef when userCourses changes
  useEffect(() => {
    userCoursesRef.current = userCourses;
  }, [userCourses]);
  
  useEffect(() => {
    if (difficulty) {
      setFilteredDifficulty(difficulty);
    }
  }, [difficulty]);
  
  useEffect(() => {
    // Prevent duplicate fetches
    if (fetchedRef.current && isHomePage) return;
    
    let isMounted = true;
    
    const fetchCourses = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Form the URL with query parameters
        let url = `/courses/`;
        if (filteredDifficulty !== 'all') {
          url += `?difficulty=${filteredDifficulty}`;
        }
        
        // Use our API service instead of direct axios call
        const coursesData = await api.get(url, {
          useCache: true,
          cacheDuration: isHomePage ? 600000 : 300000 // Cache longer for homepage (10 min vs 5 min)
        });
        
        if (!isMounted) return;
        
        // Check if the data is an array
        const validData = Array.isArray(coursesData) ? coursesData : [];
        
        // If we have userCourses, we need to enhance the course data with enrollment status
        if (userCoursesRef.current && userCoursesRef.current.length > 0) {
          const enhancedCourses = validData.map(course => {
            const userCourse = userCoursesRef.current.find(uc => 
              uc.course === course.id || 
              (uc.course_details && uc.course_details.id === course.id)
            );
            
            return {
              ...course,
              isEnrolled: !!userCourse,
              progress: userCourse ? userCourse.progress : 0,
              completed: userCourse ? userCourse.completed : false
            };
          });
          
          setCourses(enhancedCourses);
        } else {
          setCourses(validData);
        }
        
        if (isHomePage) {
          fetchedRef.current = true;
        }
        
        setLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching courses:', err);
          setError('Failed to load courses. Please try again later.');
          setLoading(false);
        }
      }
    };
    
    fetchCourses();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  // Only include dependencies that should trigger a refetch
  }, [filteredDifficulty, isHomePage]);
  
  const handleDifficultyChange = (e) => {
    setFilteredDifficulty(e.target.value);
  };
  
  // Group courses by enrollment status
  const enrolledCourses = courses.filter(course => course.isEnrolled);
  const unenrolledCourses = courses.filter(course => !course.isEnrolled);
  
  // Only show a subset of courses if limit is specified
  const displayCourses = limit ? courses.slice(0, limit) : courses;
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Loading courses..." />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
        <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
        <span>{error}</span>
      </div>
    );
  }
  
  if (!isHomePage && courses.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-card">
        <BookOpenIcon className="h-16 w-16 mx-auto text-primary-400" />
        <h3 className="mt-4 text-xl font-semibold gradient-heading">No courses available</h3>
        <p className="mt-2 text-gray-500 mb-6">Try a different filter or search for new content</p>
        <Link to="/courses" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full hover:brightness-105 shadow-button inline-flex items-center">
          <PlusCircleIcon className="h-5 w-5 mr-2" />
          Browse Courses
        </Link>
      </div>
    );
  }
  
  return (
    <div>
      {!difficulty && !isHomePage && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2 text-primary-500" />
            <label htmlFor="difficulty-filter" className="mr-2 text-sm font-medium text-gray-700">
              Filter by difficulty:
            </label>
            <select
              id="difficulty-filter"
              value={filteredDifficulty}
              onChange={handleDifficultyChange}
              className="rounded-full border-gray-200 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
            >
              <option value="all">All Levels</option>
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Showing {displayCourses.length} of {courses.length} courses
          </div>
        </div>
      )}
      
      {/* Enrolled Courses Section */}
      {enrolledCourses.length > 0 && !limit && !isHomePage && (
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary-100 to-secondary-100 mr-3">
              <BookOpenIcon className="h-6 w-6 text-primary-600" />
            </div>
            <span className="gradient-heading">My Enrolled Courses</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.map(course => (
              <CourseCard key={course.id} course={course} isEnrolled={true} />
            ))}
          </div>
        </div>
      )}
      
      {/* Available Courses Section */}
      {unenrolledCourses.length > 0 && !limit && enrolledCourses.length > 0 && !isHomePage && (
        <div>
          <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800">
            <div className="p-2 rounded-lg bg-gradient-to-r from-primary-100 to-secondary-100 mr-3">
              <PlusCircleIcon className="h-6 w-6 text-primary-600" />
            </div>
            <span className="gradient-heading">More Courses to Explore</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {unenrolledCourses.map(course => (
              <CourseCard key={course.id} course={course} isEnrolled={false} />
            ))}
          </div>
        </div>
      )}
      
      {/* Just show all courses if no enrolled courses or if limit is specified */}
      {(enrolledCourses.length === 0 || limit || isHomePage) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {displayCourses.map(course => (
            <CourseCard key={course.id} course={course} isEnrolled={course.isEnrolled} />
          ))}
        </div>
      )}
      
      {/* Show more link if limit is specified */}
      {limit && courses.length > limit && (
        <div className="text-center mt-8">
          <Link to="/courses" className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full hover:brightness-105 shadow-button inline-flex items-center">
            View All Courses
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      )}
    </div>
  );
};

export default CourseList; 