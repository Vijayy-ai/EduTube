import React from 'react';

/**
 * LoadingSpinner Component
 * 
 * @param {Object} props
 * @param {string} props.size - Size of the spinner ('sm', 'md', 'lg', 'xl')
 * @param {string} props.color - Color of the spinner ('primary', 'secondary', 'white', etc.)
 * @param {string} props.text - Optional text to display below spinner
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ size = 'md', color = 'primary', text }) => {
  // Determine the size of the spinner
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  // Determine the color of the spinner
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    gray: 'text-gray-600',
    black: 'text-black'
  };
  
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.primary;
  
  return (
    <div className="flex flex-col items-center justify-center">
      <svg 
        className={`animate-spin ${spinnerSize} ${spinnerColor}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        ></circle>
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
      
      {text && (
        <p className={`mt-2 text-sm font-medium ${spinnerColor}`}>{text}</p>
      )}
    </div>
  );
};

export default LoadingSpinner; 