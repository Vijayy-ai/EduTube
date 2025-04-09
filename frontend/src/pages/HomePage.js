import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon, ArrowRightIcon, VideoCameraIcon, DocumentCheckIcon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import CourseList from '../components/courses/CourseList';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  
  // Use useMemo to prevent unnecessary re-renders of CourseList
  const courseListProps = useMemo(() => ({
    limit: 8,
    isHomePage: true
  }), []);
  
  return (
    <div className="homepage bg-white">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden">
        {/* Background blobs */}
        <div 
          className="absolute top-20 right-0 w-96 h-96 z-deepest"
          style={{ 
            background: 'radial-gradient(circle, rgba(113, 57, 247, 0.1) 0%, rgba(113, 57, 247, 0) 70%)'
          }}
        >
        </div>
        <div 
          className="absolute bottom-20 left-0 w-96 h-96 z-deepest"
          style={{ 
            background: 'radial-gradient(circle, rgba(26, 110, 244, 0.1) 0%, rgba(26, 110, 244, 0) 70%)'
          }}
        >
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-200 opacity-10 blur-3xl z-deeper"></div>
        <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-secondary-200 opacity-10 blur-3xl z-deeper"></div>
        
        <div className="container-custom">
          <div className="flex flex-col items-center text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="gradient-heading gradient-animate">Learn from YouTube,</span><br />
              <span className="text-gray-800">Earn Certificates</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mb-10">
              Transform your YouTube learning experience with EduTube. Watch videos, take quizzes, and earn blockchain-verified certificates.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/courses" className="btn-primary text-center px-8 py-3 rounded-full">
                Browse Courses
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="btn-secondary text-center px-8 py-3 rounded-full">
                  Sign Up Free
                </Link>
              )}
              {isAuthenticated && (
                <Link to="/dashboard" className="btn-secondary text-center px-8 py-3 rounded-full">
                  My Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Featured Image */}
          <div className="relative mx-auto max-w-5xl">
            <div className="relative bg-white rounded-3xl overflow-hidden hero-shadow">
              <img 
                src="/images/edutube-dashboard.jpg" 
                alt="EduTube Learning Dashboard" 
                className="w-full h-auto object-cover rounded-2xl"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://placehold.co/1200x670/e0e7ff/818cf8?text=EduTube+Learning';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-heading">How It Works</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform makes learning from YouTube videos effective and rewarding
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="card card-hover-effect group hover:border-primary-500">
              <div className="mb-6 text-primary-600">
                <VideoCameraIcon className="h-14 w-14 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary-600">Learn from YouTube</h3>
              <p className="text-gray-600 text-center">
                Watch educational videos and playlists directly on our platform.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card card-hover-effect group hover:border-primary-500">
              <div className="mb-6 text-primary-600">
                <PuzzlePieceIcon className="h-14 w-14 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary-600">Test Your Knowledge</h3>
              <p className="text-gray-600 text-center">
                Take AI-generated quizzes based on the video content.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card card-hover-effect group hover:border-primary-500">
              <div className="mb-6 text-primary-600">
                <DocumentCheckIcon className="h-14 w-14 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary-600">Earn Certificates</h3>
              <p className="text-gray-600 text-center">
                Receive digital certificates for completed courses.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card card-hover-effect group hover:border-primary-500">
              <div className="mb-6 text-primary-600">
                <AcademicCapIcon className="h-14 w-14 mx-auto" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-center group-hover:text-primary-600">Blockchain Verification</h3>
              <p className="text-gray-600 text-center">
                Store your certificates on the blockchain for tamper-proof verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section className="py-16">
        <div className="container-custom text-center">
          <div className="flex justify-center space-x-16 mb-16">
            <img 
              src="/images/educhain-logo.png" 
              alt="EduChain" 
              className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://placehold.co/200x50/ffffff/818cf8?text=EDUCHAIN';
              }}
            />
            <img 
              src="/images/blockchain-hub-logo.png" 
              alt="Blockchain Innovation Hub" 
              className="h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
              onError={(e) => {
                e.target.onerror = null; 
                e.target.src = 'https://placehold.co/200x50/ffffff/818cf8?text=BLOCKCHAIN+HUB';
              }}
            />
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="py-20 bg-gray-50 relative overflow-hidden">
        {/* Background gradient blobs */}
        <div 
          className="absolute bottom-0 left-0 w-96 h-96 z-behind"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(113, 57, 247, 0.1) 0%, rgba(113, 57, 247, 0) 70%)',
            transform: 'translate(-30%, 30%)'
          }}
        ></div>
        <div 
          className="absolute top-0 right-0 w-96 h-96 z-behind"
          style={{ 
            background: 'radial-gradient(circle at center, rgba(26, 110, 244, 0.1) 0%, rgba(26, 110, 244, 0) 70%)',
            transform: 'translate(30%, -30%)'
          }}
        ></div>

        {/* Additional decorative elements */}
        <div className="absolute top-1/3 left-1/3 w-40 h-40 rounded-full bg-primary-300 opacity-5 blur-2xl animate-pulse z-behind"></div>
        <div 
          className="absolute bottom-1/3 right-1/2 w-32 h-32 rounded-full bg-secondary-300 opacity-5 blur-2xl animate-pulse z-behind"
          style={{ animationDelay: '1s' }}
        ></div>

        <div className="container-custom relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 gradient-heading gradient-animate">Popular Courses</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our most popular educational content from YouTube
            </p>
          </div>

          {/* Use the memoized props to avoid re-renders */}
          <CourseList {...courseListProps} />

          <div className="text-center mt-12">
            <Link to="/courses" className="btn-secondary inline-block px-8 py-3 rounded-full">
              View All Courses
            </Link>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-primary-50/30 to-white z-behind"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full bg-primary-200 opacity-10 blur-3xl z-behind"></div>
        <div className="absolute bottom-1/4 left-1/5 w-64 h-64 rounded-full bg-secondary-200 opacity-10 blur-3xl z-behind"></div>

        <div className="container-custom relative z-10">
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary-300/30 to-secondary-300/30 rounded-3xl blur-md"></div>
                <img 
                  src="/images/certificate-preview.jpg" 
                  alt="Certificate Preview" 
                  className="relative z-10 rounded-3xl shadow-xl"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://placehold.co/600x400/e0e7ff/818cf8?text=Blockchain+Certificate';
                  }}
                />
                {/* Floating animation elements */}
                <div className="absolute top-5 right-5 w-16 h-16 rounded-full bg-primary-500/20 animate-float" 
                  style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute bottom-8 left-8 w-12 h-12 rounded-full bg-secondary-500/20 animate-float" 
                  style={{ animationDelay: '1.2s' }}></div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-5xl font-bold mb-4 gradient-heading gradient-animate">Discover</h2>
              <p className="text-xl text-gray-700 mb-8">EduTube's Unique Features</p>
              
              <div className="bg-white rounded-xl shadow-md p-8 mb-10 card-hover-effect relative overflow-hidden">
                {/* Card background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 to-secondary-50/40 z-0"></div>
                
                <div className="relative z-10 flex justify-between items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Blockchain Verified Certificates</h3>
                    <p className="text-gray-600">Our certificates are stored on the blockchain, providing tamper-proof verification of your achievements.</p>
                  </div>
                  <div className="bg-gradient-to-r from-primary-500/10 to-secondary-500/10 p-5 rounded-xl">
                    <span className="text-3xl font-bold gradient-heading">500+</span>
                    <div className="text-sm text-primary-600">Certificates Issued</div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center mb-4">
                <div className="flex -space-x-3 mr-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500 border-2 border-white flex items-center justify-center text-white text-sm">JD</div>
                  <div className="w-10 h-10 rounded-full bg-secondary-500 border-2 border-white flex items-center justify-center text-white text-sm">KM</div>
                  <div className="w-10 h-10 rounded-full bg-accent-500 border-2 border-white flex items-center justify-center text-white text-sm">AL</div>
                </div>
                <div>
                  <span className="font-bold">300+ satisfied</span>
                  <div className="text-sm text-gray-600">Learners & Educators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-secondary-600"></div>
        
        {/* Animated background shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-white opacity-10 blur-3xl"></div>
        
        {/* Floating shapes */}
        <div className="absolute top-1/3 left-1/4 w-8 h-8 rounded-full bg-white opacity-20 animate-float"
          style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 rounded-full bg-white opacity-15 animate-float"
          style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute top-2/3 right-1/3 w-6 h-6 rounded-full bg-white opacity-25 animate-float"
          style={{ animationDelay: '0.8s' }}></div>

        <div className="container-custom relative z-10 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Start Learning?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90">
            Join thousands of learners who are enhancing their skills and earning verifiable certificates on EduTube.
          </p>
          {!isAuthenticated ? (
            <Link to="/register" className="bg-white text-primary-600 hover:bg-white/90 px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-lg inline-flex items-center">
              Get Started Now
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          ) : (
            <Link to="/courses" className="bg-white text-primary-600 hover:bg-white/90 px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all text-lg inline-flex items-center">
              Explore More Courses
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage; 