import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CourseAPI, QuizAPI } from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  AcademicCapIcon, 
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import apiService from '../utils/apiService';
import { useAuth } from '../contexts/AuthContext'; // Corrected import path

const QuizGeneratePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Using auth context to get current user
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [difficulty, setDifficulty] = useState('basic');
  const [questionCount, setQuestionCount] = useState(10);
  const [forceNew, setForceNew] = useState(false);
  
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      try {
        if (!currentUser) { // Check if user is logged in
          setError('You must be logged in to generate a quiz');
          setLoading(false);
          return;
        }
        
        let response;
        const isYoutubeID = courseId.length === 11 || courseId.includes('youtu');
        
        if (isYoutubeID) {
          let videoId = courseId;
          if (courseId.includes('youtu')) {
            const match = courseId.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
            if (match && match[1]) {
              videoId = match[1];
            }
          }
          
          console.log("Fetching YouTube video details for:", videoId);
          response = await CourseAPI.searchYouTube(videoId, 'video', true);
          
          if (response.data && response.data.length > 0) {
            const videoData = response.data[0];
            setCourse({
              id: null,
              title: videoData.title,
              description: videoData.description,
              youtube_id: videoData.id,
              is_playlist: false,
              thumbnail_url: videoData.thumbnail,
              difficulty: 'basic'
            });
          } else {
            setError('Video not found');
          }
        } else {
          response = await CourseAPI.getCourse(courseId);
          setCourse(response.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError('Failed to load course information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchCourseDetails();
  }, [courseId, currentUser]); // Added currentUser to dependencies
  
  const handleGenerateQuiz = async () => {
    setGenerating(true);
    setError('');
    
    try {
      let courseIdToUse = courseId;
      
      if (!course.id) {
        const createCourseResponse = await apiService.post('/courses/', {
          title: course.title,
          description: course.description || "No description available",
          youtube_id: course.youtube_id,
          is_playlist: course.is_playlist,
          thumbnail_url: course.thumbnail_url,
          difficulty: difficulty
        });
        
        courseIdToUse = createCourseResponse.data.id;
      }
      
      // Validate courseId before making the API call
      if (!courseIdToUse || courseIdToUse === 'undefined') {
        throw new Error('Invalid course ID. Please try again.');
      }
      
      const response = await CourseAPI.generateQuiz(courseIdToUse, {
        difficulty: difficulty,
        question_count: questionCount,
        force_new: forceNew
      });
      
      // Check if the response contains a quiz ID directly or in a nested object
      const quizId = response.data.id || response.data.quiz?.id;
      
      if (!quizId) {
        throw new Error('Quiz ID not found in response');
      }
      
      setSuccess(true);
      setQuizId(quizId);
      setGenerating(false);
    } catch (err) {
      console.error('Error generating quiz:', err);
      const errorMessage = err.response?.data?.error || 'Failed to generate quiz. Please try again later.';
      setError(errorMessage);
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <ExclamationCircleIcon className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
        <div className="mt-4">
          <Link to="/courses" className="text-primary-600 hover:underline flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg flex items-center mb-6">
          <CheckCircleIcon className="h-6 w-6 mr-3" />
          <div>
            <p className="font-medium">Quiz generated successfully!</p>
            <p className="text-sm mt-1">Your quiz is ready to take.</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{course.title}</h2>
          <p className="text-gray-600 mb-6">{course.description}</p>
          
          <div className="flex justify-center">
            <button
              onClick={() => {
                if (quizId && quizId !== 'undefined') {
                  navigate(`/quiz/${quizId}`);
                } else {
                  setError('Invalid quiz ID. Please try generating the quiz again.');
                  setSuccess(false);
                }
              }}
              className="bg-primary-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-primary-700 transition-colors flex items-center"
            >
              <AcademicCapIcon className="h-5 w-5 mr-2" />
              Take Quiz Now
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Link to="/courses" className="text-primary-600 hover:underline">
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center mb-6">
          <Link to="/courses" className="text-gray-500 hover:text-gray-700 mr-4">
            <ArrowLeftIcon className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Generate Quiz</h1>
        </div>
        
        {course && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="relative">
              <img 
                src={course.thumbnail_url} 
                alt={course.title} 
                className="w-full h-48 object-cover"
              />
              {course.is_playlist && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 text-xs font-medium rounded">
                  Playlist
                </div>
              )}
            </div>
            
            <div className="p-6">
              <h2 className="text-xl font-bold mb-2">{course.title}</h2>
              <p className="text-gray-600 mb-6 line-clamp-3">{course.description}</p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="basic">Basic</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Questions
                </label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                >
                  <option value="5">5 Questions</option>
                  <option value="10">10 Questions</option>
                  <option value="15">15 Questions</option>
                  <option value="20">20 Questions</option>
                </select>
              </div>

              <div className="mb-6">
                <div className="flex items-center">
                  <input
                    id="force-new"
                    name="force-new"
                    type="checkbox"
                    checked={forceNew}
                    onChange={(e) => setForceNew(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="force-new" className="ml-2 block text-sm text-gray-700">
                    Generate new quiz (delete previous attempts and create fresh questions)
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {forceNew 
                    ? "This will create a completely new quiz with different questions." 
                    : "If a quiz already exists for this course, it will be reused. Your previous score will be overwritten."}
                </p>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <LightBulbIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Our AI will analyze the content and generate a quiz based on your selected difficulty level.
                      This may take a minute or two.
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={handleGenerateQuiz}
                disabled={generating}
                className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? (
                  <>
                    <LoadingSpinner size="sm" color="white" />
                    <span className="ml-2">Generating Quiz...</span>
                  </>
                ) : (
                  <>
                    <AcademicCapIcon className="h-5 w-5 mr-2" />
                    Generate Quiz
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <BookOpenIcon className="h-5 w-5 mr-2 text-primary-600" />
            How Quiz Generation Works
          </h3>
          
          <ol className="list-decimal list-inside space-y-3 text-gray-700">
            <li>Our AI analyzes the video content and extracts key concepts</li>
            <li>Questions are generated based on your selected difficulty level</li>
            <li>Each question includes multiple choice options</li>
            <li>You'll need to score at least 70% to pass the quiz</li>
            <li>Upon passing, you'll receive a certificate that can be verified on the blockchain</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default QuizGeneratePage; 