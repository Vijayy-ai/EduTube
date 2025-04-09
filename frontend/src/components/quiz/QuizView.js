import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { CourseAPI, QuizAPI } from '../../utils/api';
import apiService from '../../utils/apiService';
import QuizQuestion from './QuizQuestion';
import QuizResult from './QuizResult';

const QuizView = () => {
  const { courseId, quizId } = useParams();
  const { getToken } = useAuth(); // Use auth context to get the token
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds
  const navigate = useNavigate();

  // Anti-cheat: Track if user leaves the page
  const [pageLeaves, setPageLeaves] = useState(0);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        console.log(`Fetching quiz with params - courseId: ${courseId}, quizId: ${quizId}`);
        
        // If we have a direct quizId in the URL (like /quiz/4)
        if (quizId) {
          try {
            const response = await QuizAPI.getQuiz(quizId);
            console.log('Quiz fetched by ID:', response.data);
            setQuiz(response.data);
            setLoading(false);
            return;
          } catch (error) {
            console.error('Error fetching quiz by ID:', error);
            setError('Failed to load quiz. Please try again.');
            setLoading(false);
            return;
          }
        }
        
        // If we have a courseId, try to get the quiz for that course
        if (courseId && courseId !== 'undefined') {
          try {
            // First try the course-specific quiz endpoint
            const quizResponse = await apiService.get(`courses/${courseId}/quiz/`);
            console.log('Quiz fetched from course endpoint:', quizResponse.data);
            setQuiz(quizResponse.data);
            setLoading(false);
            return;
          } catch (error1) {
            console.log('Course quiz endpoint failed, trying quizzes API');
            // If that fails, try the quizzes endpoint filtered by course
            try {
              const quizResponse = await apiService.get(`quizzes/?course=${courseId}`);
              console.log('Quiz fetched from quizzes endpoint:', quizResponse.data);
              
              // Check if we got an array of quizzes or a single quiz
              if (Array.isArray(quizResponse.data)) {
                if (quizResponse.data.length > 0) {
                  setQuiz(quizResponse.data[0]);
                } else {
                  throw new Error('No quizzes found for this course');
                }
              } else if (quizResponse.data.results && quizResponse.data.results.length > 0) {
                setQuiz(quizResponse.data.results[0]);
              } else {
                setQuiz(quizResponse.data);
              }
              
              setLoading(false);
              return;
            } catch (error2) {
              // If both endpoints fail and it's a 404, generate a new quiz
              if ((error1.response && error1.response.status === 404) || 
                  (error2.response && error2.response.status === 404)) {
                try {
                  const quizResponse = await CourseAPI.generateQuiz(courseId);
                  console.log('Generated new quiz:', quizResponse.data);
                  setQuiz(quizResponse.data);
                  setLoading(false);
                  return;
                } catch (genError) {
                  console.error('Error generating quiz:', genError);
                  throw genError;
                }
              } else {
                // Re-throw if it's not a 404 error
                throw error2;
              }
            }
          }
        } else {
          setError('Invalid course or quiz ID. Please go back and try again.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error in quiz fetching process:', err);
        setError('Failed to load quiz. Please try again later.');
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [courseId, quizId, getToken]);

  // Timer for quiz
  useEffect(() => {
    let timer;
    if (timeLeft > 0 && !quizSubmitted) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && !quizSubmitted) {
      // Auto-submit quiz when time is up
      handleSubmitQuiz();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [timeLeft, quizSubmitted]);

  // Anti-cheat: Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !quizSubmitted) {
        setPageLeaves(prev => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizSubmitted]);

  // Anti-cheat: Disable right-click
  useEffect(() => {
    const handleContextMenu = (e) => {
      if (!quizSubmitted) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [quizSubmitted]);

  const handleAnswerSelect = (questionId, optionId) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedAnswers || Object.keys(selectedAnswers).length === 0) {
      setError('Please answer at least one question before submitting');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format answers for submission - use option_id instead of selected_option_id
      // Convert string IDs to integers since that's what the backend expects
      const formattedAnswers = Object.keys(selectedAnswers).map(questionId => ({
        question_id: parseInt(questionId, 10),
        option_id: parseInt(selectedAnswers[questionId], 10)
      }));
      
      console.log('Submitting quiz with ID:', quiz.id, 'Answers:', formattedAnswers);
      
      // Ensure the formattedAnswers array is properly structured for the backend
      // The backend expects an array of objects with question_id and option_id
      const payload = { answers: formattedAnswers };
      console.log('Full submission payload:', payload);
      
      // Use QuizAPI instead of CourseAPI for quiz submission
      const response = await QuizAPI.submitQuiz(quiz.id, payload);
      console.log('Quiz submission response:', response.data);
      
      setQuizResult(response.data);
      setQuizSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to submit quiz. Please try again.');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (quizSubmitted && quizResult) {
    // Extract the course ID from either quiz data or URL params
    const resultCourseId = quiz?.course || courseId;
    
    return (
      <div className="quiz-result-container">
        <QuizResult 
          result={quizResult} 
          courseId={resultCourseId} 
        />
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return <div className="error-message">No questions available for this quiz</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <h1>Course Quiz</h1>
        <div className="quiz-meta">
          <div className="time-remaining">
            Time Remaining: <span className={timeLeft < 300 ? 'warning' : ''}>{formatTime(timeLeft)}</span>
          </div>
          <div className="question-progress">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div className="answered-count">
            Answered: {answeredCount} of {quiz.questions.length}
          </div>
        </div>
        
        {pageLeaves > 0 && (
          <div className="warning-message">
            Warning: You've left this page {pageLeaves} time(s). This may affect your score.
          </div>
        )}
      </div>
      
      <div className="quiz-content">
        <QuizQuestion 
          question={currentQuestion} 
          selectedOption={selectedAnswers[currentQuestion.id]} 
          onSelectOption={(optionId) => handleAnswerSelect(currentQuestion.id, optionId)} 
        />
        
        <div className="quiz-navigation">
          <button 
            onClick={handlePrevQuestion} 
            disabled={currentQuestionIndex === 0}
            className="btn secondary-btn"
          >
            Previous
          </button>
          
          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button 
              onClick={handleNextQuestion} 
              className="btn primary-btn"
            >
              Next
            </button>
          ) : (
            <button 
              onClick={handleSubmitQuiz} 
              className="btn submit-btn"
              disabled={answeredCount < quiz.questions.length}
            >
              Submit Quiz
            </button>
          )}
        </div>
      </div>
      
      <div className="question-navigator">
        {quiz.questions.map((q, index) => (
          <button 
            key={q.id}
            onClick={() => setCurrentQuestionIndex(index)}
            className={`question-dot ${index === currentQuestionIndex ? 'active' : ''} ${selectedAnswers[q.id] ? 'answered' : ''}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuizView; 