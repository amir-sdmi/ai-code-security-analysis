'use client';

import { useState } from 'react';
import axios from 'axios';
import Header from '@/components/Header';
import Question from '@/components/Question';

export default function Home() {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (questions.length > 0) {
      setQuestions([]);
    }
    setIsLoading(true);
    try {
      const response = await axios.post('/api/create-questions');
      const data = response.data;
      setQuestions(data[0].questions);
      console.log(data[1])
    } catch (error) {
      console.error('Error creating questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Make the page fill at least the full screen
    <div className='min-h-screen flex flex-col bg-white'>
      <Header />

      {/* Make the main content area take all remaining vertical space */}
      <div className='flex-1 py-10 bg-gray-100 w-full max-w-7xl mx-auto'>
        <header className='px-4 sm:px-6 lg:px-8 mb-4'>
          {/* Make the header a flex container */}
          <div className='flex items-center justify-between'>
            <h1 className='text-3xl font-bold leading-tight tracking-tight text-gray-900'>
              Generate Questions Using ChatGPT
            </h1>
            {/* Button goes here so it sits in the same row */}
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className={`
                px-6 py-2 bg-indigo-500 text-white text-xl font-semibold rounded-md 
                hover:bg-indigo-700 
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? (
                <div className='flex items-center'>
                  <svg
                    className='animate-spin h-5 w-5 mr-3 text-white'
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                  >
                    <circle
                      className='opacity-25'
                      cx='12'
                      cy='12'
                      r='10'
                      stroke='currentColor'
                      strokeWidth='4'
                    ></circle>
                    <path
                      className='opacity-75'
                      fill='currentColor'
                      d='M4 12a8 8 0 018-8v8z'
                    ></path>
                  </svg>
                  Generating Questions... <br />
                </div>
              ) : (
                'Create 5 New Questions'
              )}
            </button>
          </div>
        </header>
        <main>
          <div className='mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8'>
            {questions.map((questionData, index) => (
              <Question
                key={index}
                questionData={questionData}
                questionNumber={index + 1}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
