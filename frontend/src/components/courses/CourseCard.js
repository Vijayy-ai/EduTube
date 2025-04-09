import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlayIcon, 
  UserPlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  BookOpenIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const CourseCard = ({ course, isEnrolled = false }) => {
  // Helper function to get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800';
      case 'intermediate':
        return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800';
      case 'advanced':
        return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden card-hover-effect flex flex-col enhanced-card">
      <div className="relative group">
        <img 
          src={course.thumbnail_url || '/placeholder-course.jpg'} 
          alt={course.title} 
          className="w-full h-52 object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/640x360?text=Course+Thumbnail';
          }}
        />
        
        {/* Overlay gradient for image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300"></div>
        
        {/* Course type indicator */}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 rounded-full px-3 py-1 text-xs text-white font-medium flex items-center shadow-lg transform transition-all duration-300 group-hover:translate-y-[-3px] group-hover:bg-primary-600">
          {course.is_playlist ? (
            <>
              <BookOpenIcon className="h-3.5 w-3.5 mr-1.5" />
              Playlist
            </>
          ) : (
            <>
              <PlayIcon className="h-3.5 w-3.5 mr-1.5" />
              Video
            </>
          )}
        </div>
        
        {/* Difficulty badge */}
        <div className={`absolute top-3 right-3 text-xs font-medium px-3 py-1 rounded-full shadow-sm ${getDifficultyColor(course.difficulty)} transform transition-all duration-300 group-hover:scale-105`}>
          {course.difficulty?.charAt(0).toUpperCase() + course.difficulty?.slice(1) || 'Basic'}
        </div>
        
        {/* Progress bar if enrolled */}
        {isEnrolled && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 relative group-hover:brightness-110 transition-all duration-300"
              style={{ width: `${Math.round(course.progress * 100)}%` }}
            >
              {/* Animated glow effect for progress bar */}
              <div className="absolute top-0 right-0 bottom-0 w-4 bg-white opacity-30 animate-pulse"></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-lg group-hover:text-primary-600 transition-colors duration-300">
          {course.title}
        </h3>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description || 'No description available.'}
        </p>
        
        {/* Status information */}
        {isEnrolled && (
          <div className="text-sm flex items-center mb-3 text-gray-500">
            {course.completed ? (
              <span className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                <CheckCircleIcon className="h-4 w-4 mr-1.5" />
                Completed
              </span>
            ) : (
              <span className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                <ClockIcon className="h-4 w-4 mr-1.5" />
                {Math.round(course.progress * 100)}% complete
              </span>
            )}
          </div>
        )}
        
        {/* Action button */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          {isEnrolled ? (
            <Link 
              to={`/courses/${course.id}`} 
              className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full shadow-button transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {course.completed ? 'Review Course' : 'Continue Learning'}
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link 
                to={`/courses/${course.id}`} 
                className="flex-1 inline-flex items-center justify-center py-2.5 px-3 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transform transition-all duration-300 hover:shadow hover:translate-y-[-1px]"
              >
                <PlayIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Preview</span>
              </Link>
              <Link 
                to={`/courses/${course.id}`}
                className="flex-1 inline-flex items-center justify-center py-2.5 px-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-full shadow-button transform transition-all duration-300 hover:shadow-lg hover:translate-y-[-2px]"
              >
                <UserPlusIcon className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Enroll</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard; 