import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const QuizQuestion = ({ question, selectedOption, onSelectOption }) => {
  if (!question) return null;

  return (
    <div className="quiz-question">
      <div className="mb-6">
        <h3 className="text-xl font-medium text-gray-900 mb-1">{question.text}</h3>
      </div>
      
      <div className="space-y-3">
        {question.options.map(option => (
          <div
            key={option.id}
            onClick={() => onSelectOption(option.id)}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedOption === option.id
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`flex-shrink-0 h-5 w-5 mr-3 rounded-full border ${
              selectedOption === option.id
                ? 'border-primary-500 bg-primary-500 flex items-center justify-center'
                : 'border-gray-300'
            }`}>
              {selectedOption === option.id && (
                <CheckCircleIcon className="h-5 w-5 text-white" />
              )}
            </div>
            <span className="flex-1">{option.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuizQuestion; 