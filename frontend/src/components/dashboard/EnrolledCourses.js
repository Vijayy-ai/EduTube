import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import { 
  BookOpenIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  ArrowRightIcon, 
  PlayIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  ChevronRightIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

/**
 * EnrolledCourses component for displaying user's courses
 * 
 * @param {Object} props
 * @param {Array} props.courses - Array of user courses
 * @param {string} props.emptyMessage - Message to display when no courses are found
 * @param {string} props.type - Type of courses to display (watchlist, in-progress, completed)
 * @returns {JSX.Element}
 */
const EnrolledCourses = ({ courses = [], emptyMessage = "No courses found", type = "watchlist" }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700">
        <p>{error}</p>
      </div>
    );
  }
  
  if (courses.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        {type === "watchlist" && <BookmarkIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />}
        {type === "in-progress" && <ClockIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />}
        {type === "completed" && <CheckCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />}
        <p className="text-gray-600 font-medium">{emptyMessage}</p>
        <Link to="/courses" className="mt-4 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
          Browse Courses
        </Link>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map(course => {
        const courseDetails = course.course_details || {};
        const progress = course.progress || 0;
        const isCompleted = progress >= 100;
        const isStarted = progress > 0;
        
        // Determine the appropriate link based on course type
        let courseLink = `/courses/${course.course}`;
        if (courseDetails.is_playlist) {
          courseLink = `/courses/playlist/${courseDetails.youtube_id}`;
        } else {
          courseLink = `/courses/video/${courseDetails.youtube_id}`;
        }
        
        return (
          <div 
            key={course.id} 
            className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="relative">
              <img 
                src={courseDetails.thumbnail_url || '/placeholder-thumbnail.jpg'} 
                alt={courseDetails.title || 'Course'} 
                className="w-full h-40 object-cover"
              />
              
              {/* Course type badge */}
              <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs font-medium rounded flex items-center">
                {courseDetails.is_playlist ? (
                  <>
                    <BookOpenIcon className="h-3 w-3 mr-1" />
                    Playlist
                  </>
                ) : (
                  <>
                    <PlayIcon className="h-3 w-3 mr-1" />
                    Video
                  </>
                )}
              </div>
              
              {/* Progress badge */}
              {isStarted && (
                <div className="absolute top-2 left-2 bg-primary-600 text-white px-2 py-1 text-xs font-medium rounded flex items-center">
                  {isCompleted ? (
                    <>
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Completed
                    </>
                  ) : (
                    <>
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {progress}% Complete
                    </>
                  )}
                </div>
              )}
              
              {/* Progress bar */}
              {isStarted && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className="h-full bg-primary-600" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                {courseDetails.title || 'Untitled Course'}
              </h3>
              
              <div className="mt-auto pt-3 flex space-x-2">
                <Link 
                  to={courseLink} 
                  className="flex-1 inline-flex items-center justify-center py-2 px-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  <PlayIcon className="h-4 w-4 mr-1" />
                  {isStarted ? 'Continue' : 'Start Learning'}
                </Link>
                
                {isCompleted && (
                  <Link 
                    to={`/quiz/generate/${course.id}`} 
                    className="flex-1 inline-flex items-center justify-center py-2 px-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700"
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    Get Certified
                  </Link>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EnrolledCourses; 