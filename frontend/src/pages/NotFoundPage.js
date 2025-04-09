import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-code">404</div>
        <h1>Page Not Found</h1>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <div className="not-found-actions">
          <Link to="/" className="btn primary-btn">
            Go to Home
          </Link>
          <Link to="/courses" className="btn secondary-btn">
            Browse Courses
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 