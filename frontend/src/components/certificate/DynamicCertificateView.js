import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import config from '../../config';
import { formatDate } from '../../utils/helpers';
import { 
  DocumentIcon, 
  AcademicCapIcon, 
  ClockIcon, 
  CheckCircleIcon,
  PlusCircleIcon,
  BookOpenIcon,
  ChartBarIcon,
  CubeTransparentIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const DynamicCertificateView = () => {
  const { certificateId } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingCourse, setAddingCourse] = useState(false);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [certificateId]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${config.API_URL}/certificates/${certificateId}/`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      setCertificate(response.data);
      
      // Fetch available courses that could be added to this certificate
      fetchAvailableCourses();
      
    } catch (err) {
      setError('Failed to load certificate');
      console.error('Error fetching certificate:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Get completed courses with passed quizzes
      const response = await axios.get(`${config.API_URL}/user-courses/?completed=true`, {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      
      if (certificate) {
        // Filter out courses that are already in the certificate
        const certificateCourseIds = certificate.certificate_courses.map(cc => cc.course);
        const filteredCourses = response.data.filter(uc => 
          !certificateCourseIds.includes(uc.course) && uc.completed
        );
        
        setAvailableCourses(filteredCourses);
      }
    } catch (err) {
      console.error('Error fetching available courses:', err);
    }
  };

  const handleAddCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setAddingCourse(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${config.API_URL}/certificates/${certificate.id}/add_course/`, 
        { course_id: selectedCourse },
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Update certificate data
      setCertificate(response.data.certificate);
      setSelectedCourse('');
      
      // Refresh available courses
      fetchAvailableCourses();
      
    } catch (err) {
      setError('Failed to add course to certificate');
      console.error('Error adding course:', err);
    } finally {
      setAddingCourse(false);
    }
  };

  const handleRefreshCertificate = async () => {
    setRefreshing(true);
    await fetchCertificate();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Not Found!</strong>
        <span className="block sm:inline"> Certificate not found</span>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      {/* Certificate Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <DocumentIcon className="h-6 w-6 mr-2" />
            {certificate.is_dynamic ? 'Dynamic Certificate' : 'Certificate'}
          </h1>
          <button 
            onClick={handleRefreshCertificate}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full p-2"
            disabled={refreshing}
          >
            <ArrowPathIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-blue-100 mt-1">ID: {certificate.certificate_id}</p>
      </div>

      {/* Certificate Details */}
      <div className="px-6 py-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-4">
          <div className="md:w-1/2">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <AcademicCapIcon className="h-5 w-5 mr-2 text-blue-500" />
              Certificate Information
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BookOpenIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Main Course</p>
                  <p className="text-sm text-gray-500">{certificate.course_details.title}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Last Updated</p>
                  <p className="text-sm text-gray-500">{formatDate(certificate.last_updated || certificate.created_at)}</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Courses Included</p>
                  <p className="text-sm text-gray-500">{certificate.course_count || 1}</p>
                </div>
              </div>

              {certificate.metadata && certificate.metadata.average_score && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ChartBarIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Average Score</p>
                    <p className="text-sm text-gray-500">{Math.round(certificate.metadata.average_score)}%</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Certificate Actions */}
            <div className="mt-6 space-y-3">
              {certificate.pdf_url && (
                <a 
                  href={certificate.pdf_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentIcon className="h-5 w-5 mr-2" />
                  View Certificate PDF
                </a>
              )}
              
              <div>
                <p className="text-sm text-gray-500 mt-2">
                  Verification Link: 
                  <a 
                    href={`${config.SITE_URL}/verify/${certificate.certificate_id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    {`${config.SITE_URL}/verify/${certificate.certificate_id}`}
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/2 mt-6 md:mt-0">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <BookOpenIcon className="h-5 w-5 mr-2 text-blue-500" />
              Included Courses
            </h2>
            
            <div className="bg-gray-50 rounded-lg p-4 max-h-[400px] overflow-y-auto">
              {certificate.certificate_courses && certificate.certificate_courses.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {certificate.certificate_courses.map((certCourse, index) => (
                    <li key={certCourse.id || index} className="py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{certCourse.course_details.title}</p>
                          <p className="text-xs text-gray-500">
                            Completed: {formatDate(certCourse.added_at)}
                          </p>
                        </div>
                        <div className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                          {certCourse.quiz_score ? `${Math.round(certCourse.quiz_score)}%` : 'Completed'}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-6">
                  <CubeTransparentIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-500">No additional courses added yet.</p>
                </div>
              )}
              
              {/* Add Course Form */}
              {availableCourses && availableCourses.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <PlusCircleIcon className="h-4 w-4 mr-1 text-blue-500" />
                    Add Course to Certificate
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <select 
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select a course...</option>
                      {availableCourses.map(course => (
                        <option key={course.id} value={course.course}>
                          {course.course_details.title}
                        </option>
                      ))}
                    </select>
                    
                    <button
                      onClick={handleAddCourse}
                      disabled={!selectedCourse || addingCourse}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                    >
                      {addingCourse ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </span>
                      ) : (
                        <span>Add Course</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Blockchain Status */}
            {certificate.blockchain_tx && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Blockchain Verification</h3>
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">
                        This certificate is verified on the blockchain
                      </p>
                      <p className="mt-1 text-xs text-green-600">
                        Transaction: 
                        <a 
                          href={`https://mumbai.polygonscan.com/tx/${certificate.blockchain_tx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 font-medium underline"
                        >
                          {certificate.blockchain_tx.substring(0, 10)}...
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* IPFS Status */}
            {certificate.ipfs_hash && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">IPFS Storage</h3>
                <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <DocumentIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-indigo-700">
                        Certificate is stored on IPFS
                      </p>
                      <p className="mt-1 text-xs text-indigo-600">
                        IPFS Hash: 
                        <a 
                          href={`https://ipfs.io/ipfs/${certificate.ipfs_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1 font-medium underline"
                        >
                          {certificate.ipfs_hash.substring(0, 10)}...
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <Link
            to="/certificates"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Back to Certificates
          </Link>
          
          {!certificate.blockchain_tx && certificate.ipfs_hash && (
            <button
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Mint as NFT
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DynamicCertificateView; 