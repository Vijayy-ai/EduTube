import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import EnrolledCourses from './EnrolledCourses';
import CertificateList from '../certificate/CertificateList';
import UserStats from './UserStats';
import { useAuth } from '../../contexts/AuthContext';
import { 
  AcademicCapIcon, 
  BookOpenIcon,
  DocumentTextIcon,
  ChartBarIcon,
  UserCircleIcon,
  ClockIcon,
  HeartIcon,
  CogIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  PlusCircleIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('watchlist');
  const [userCourses, setUserCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [inProgress, setInProgress] = useState([]);
  const [completed, setCompleted] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const userResponse = await axios.get(`${config.API_URL}/me/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setUser(userResponse.data);
        
        // Fetch user courses
        const coursesResponse = await axios.get(`${config.API_URL}/user-courses/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const userCoursesData = Array.isArray(coursesResponse.data) 
          ? coursesResponse.data 
          : coursesResponse.data.results || [];
        
        setUserCourses(userCoursesData);
        
        // Organize courses by progress
        const watchlistItems = userCoursesData.filter(course => course.progress === 0);
        const inProgressItems = userCoursesData.filter(course => course.progress > 0 && course.progress < 100);
        const completedItems = userCoursesData.filter(course => course.progress === 100);
        
        setWatchlist(watchlistItems);
        setInProgress(inProgressItems);
        setCompleted(completedItems);
        
        // Fetch certificates
        const certificatesResponse = await axios.get(`${config.API_URL}/certificates/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setCertificates(certificatesResponse.data);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };
    
    // Only fetch if user is authenticated
    if (isAuthenticated) {
      fetchUserData();
    }
    
  // Remove isAuthenticated from dependency array since it's a function
  }, []);

  const getActiveTabContent = () => {
    switch (activeTab) {
      case 'watchlist':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">My Watchlist</h2>
              <Link to="/courses" className="text-primary-600 hover:text-primary-700 flex items-center">
                <PlusCircleIcon className="h-5 w-5 mr-1" />
                <span>Add More</span>
              </Link>
            </div>
            <EnrolledCourses 
              courses={watchlist} 
              emptyMessage="Your watchlist is empty. Start by adding courses from the courses page."
              type="watchlist"
            />
          </div>
        );
      case 'in-progress':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">In Progress</h2>
            <EnrolledCourses 
              courses={inProgress} 
              emptyMessage="You don't have any courses in progress. Start learning from your watchlist!"
              type="in-progress"
            />
          </div>
        );
      case 'completed':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Completed Courses</h2>
            <EnrolledCourses 
              courses={completed} 
              emptyMessage="You haven't completed any courses yet. Keep learning!"
              type="completed"
            />
          </div>
        );
      case 'certificates':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Certificates</h2>
            <CertificateList certificates={certificates} />
          </div>
        );
      case 'stats':
        return (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Learning Statistics</h2>
            <UserStats userCourses={userCourses} />
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
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

  return (
    <div className="dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-24">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
                <UserCircleIcon className="h-10 w-10" />
              </div>
              <div className="ml-4">
                <h3 className="font-bold text-lg">{user?.username || 'User'}</h3>
                <p className="text-gray-600 text-sm">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            
            <nav className="mt-6">
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => setActiveTab('watchlist')}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                      activeTab === 'watchlist' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BookmarkIcon className="h-5 w-5 mr-3" />
                    <span>My Watchlist</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('in-progress')}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                      activeTab === 'in-progress' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ClockIcon className="h-5 w-5 mr-3" />
                    <span>In Progress</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('completed')}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                      activeTab === 'completed' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <BookOpenIcon className="h-5 w-5 mr-3" />
                    <span>Completed</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('certificates')}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                      activeTab === 'certificates' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <DocumentTextIcon className="h-5 w-5 mr-3" />
                    <span>Certificates</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center ${
                      activeTab === 'stats' 
                        ? 'bg-primary-50 text-primary-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChartBarIcon className="h-5 w-5 mr-3" />
                    <span>Statistics</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow p-6">
            {getActiveTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;