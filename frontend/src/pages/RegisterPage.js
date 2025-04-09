import React from 'react';
import { Link } from 'react-router-dom';
import { AcademicCapIcon } from '@heroicons/react/24/outline';
import Register from '../components/auth/Register';

const RegisterPage = () => {
  return (
    <div className="py-12 lg:py-20">
      <div className="container-custom">
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2">
          {/* Image Section */}
          <div className="hidden md:block relative bg-gradient-to-br from-primary-600 to-secondary-600">
            <div className="absolute inset-0 opacity-20 bg-pattern-dots"></div>
            <div className="relative p-12 flex flex-col justify-between h-full text-white">
              <div>
                <AcademicCapIcon className="h-12 w-12 mb-4" />
                <h2 className="text-3xl font-bold mb-6">Join EduTube Today</h2>
                <p className="text-lg">
                  Create an account to start your learning journey and earn verifiable certificates.
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  <p>Access exclusive courses</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  <p>Track your progress</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                  <p>Earn blockchain certificates</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Form Section */}
          <div className="p-8 md:p-12">
            <div className="mb-8 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Create an Account</h1>
              <p className="text-gray-600">
                Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Login here</Link>
              </p>
            </div>
            
            <Register />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 