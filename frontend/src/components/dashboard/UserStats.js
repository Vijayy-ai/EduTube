import React, { useState, useEffect } from 'react';
import axios from 'axios';
import config from '../../config';

const UserStats = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalCertificates: 0,
    verifiedCertificates: 0,
    quizAttempts: 0,
    quizPassed: 0,
    averageScore: 0,
    ranking: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch enrolled courses
        const coursesResponse = await axios.get(`${config.API_URL}/user-courses/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const userCourses = coursesResponse.data;
        const completedCourses = userCourses.filter(uc => uc.completed);
        
        // Fetch certificates
        const certificatesResponse = await axios.get(`${config.API_URL}/certificates/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const certificates = certificatesResponse.data;
        const verifiedCertificates = certificates.filter(cert => cert.blockchain_tx);
        
        // Fetch quiz attempts
        const quizAttemptsResponse = await axios.get(`${config.API_URL}/quiz-attempts/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        const quizAttempts = quizAttemptsResponse.data;
        const passedQuizzes = quizAttempts.filter(qa => qa.passed);
        const averageScore = quizAttempts.length > 0 
          ? quizAttempts.reduce((sum, qa) => sum + qa.score, 0) / quizAttempts.length 
          : 0;
        
        // Fetch user ranking
        const rankingResponse = await axios.get(`${config.API_URL}/users/ranking/`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        
        setStats({
          totalCourses: userCourses.length,
          completedCourses: completedCourses.length,
          inProgressCourses: userCourses.length - completedCourses.length,
          totalCertificates: certificates.length,
          verifiedCertificates: verifiedCertificates.length,
          quizAttempts: quizAttempts.length,
          quizPassed: passedQuizzes.length,
          averageScore,
          ranking: rankingResponse.data
        });
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load user statistics');
        setLoading(false);
        console.error('Error fetching user statistics:', err);
      }
    };

    fetchUserStats();
  }, []);

  if (loading) {
    return <div className="loading">Loading user statistics...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="user-stats">
      <h2>My Learning Statistics</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{stats.totalCourses}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{stats.completedCourses}</div>
          <div className="stat-label">Completed Courses</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{stats.inProgressCourses}</div>
          <div className="stat-label">In Progress</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">{stats.totalCertificates}</div>
          <div className="stat-label">Certificates Earned</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⛓️</div>
          <div className="stat-value">{stats.verifiedCertificates}</div>
          <div className="stat-label">Blockchain Verified</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.quizAttempts}</div>
          <div className="stat-label">Quiz Attempts</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.quizPassed}</div>
          <div className="stat-label">Quizzes Passed</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value">{Math.round(stats.averageScore)}%</div>
          <div className="stat-label">Average Score</div>
        </div>
      </div>
      
      {stats.ranking && (
        <div className="user-ranking">
          <h3>Your Ranking</h3>
          
          <div className="ranking-info">
            <div className="rank-position">
              <span className="rank-number">{stats.ranking.position}</span>
              <span className="rank-label">out of {stats.ranking.total_users} users</span>
            </div>
            
            <div className="rank-percentile">
              Top {Math.round((stats.ranking.position / stats.ranking.total_users) * 100)}%
            </div>
          </div>
          
          <div className="ranking-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(stats.ranking.position / stats.ranking.total_users) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="ranking-details">
            <div className="ranking-detail">
              <span className="detail-label">Points:</span>
              <span className="detail-value">{stats.ranking.points}</span>
            </div>
            
            <div className="ranking-detail">
              <span className="detail-label">Level:</span>
              <span className="detail-value">{stats.ranking.level}</span>
            </div>
            
            <div className="ranking-detail">
              <span className="detail-label">Next Level:</span>
              <span className="detail-value">{stats.ranking.points_to_next_level} points needed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStats; 