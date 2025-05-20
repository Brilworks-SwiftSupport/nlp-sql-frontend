import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

const features = [
  {
  title: 'Text Queries',
  icon: '💬',
  bgColor: 'bg-teal-50',
},
{
  title: 'Voice Queries',
  icon: '🎤',
  bgColor: 'bg-red-50',
},


  
  {
    title: 'Seamless Integration',
    icon: '🔄',
    bgColor: 'bg-purple-50',
  },
  {
    title: 'Secure & Scalable',
    icon: '🔒',
    bgColor: 'bg-orange-50',
  },
 
  {
    title: 'Data Analytics',
    icon: '📊',
    bgColor: 'bg-indigo-50',
  },
  {
    title: 'Multiple DB Support',
    icon: '🗄️',
    bgColor: 'bg-cyan-50',
  }
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50">
     
      
     
      
      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 min-h-[60vh]">
        <div className="max-w-7xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Left side - QR Code */}
            <div className="md:w-2/5 bg-gradient-to-br from-blue-500 to-indigo-600 p-10 flex flex-col items-center justify-center text-white">
              <h2 className="text-2xl font-bold mb-6">Scan & Try Now</h2>
              <div className="bg-white p-4 rounded-2xl shadow-lg mb-6">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fnlp-sql-frontend-six.vercel.app%2Fget-started"
                  alt="Scan to get started"
                  className="w-72 h-72"
                />
              </div>
              
            </div>
            
            {/* Right side - Content */}
            <div className="md:w-3/5 p-8">
              <div className="flex items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">Try Our Solution – Win a Gift Worth 🎁 500 AED!</h1>
              </div>
              
              <p className="text-gray-600 text-lg mb-8">
                Experience our digital product instantly—no signup required. Scan or tap below to launch the demo and enter for a chance to win!
              </p>
              
              {/* Features Grid */}
              <div className="grid grid-cols-3 md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, idx) => (
                  <div 
                    key={idx} 
                    className={`${feature.bgColor} rounded-xl p-4 flex items-center shadow-sm hover:shadow-md transition-shadow duration-200`}
                  >
                    <span className="mr-3 text-2xl">{feature.icon}</span>
                    <span className="font-medium">{feature.title}</span>
                  </div>
                ))}
              </div>
              
              {/* Try Now Button */}
              <Link 
                href="/get-started"
                className="block w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md text-lg"
              >
                <span className="flex items-center justify-center">
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  Try Now
                </span>
              </Link>
             
              
              
            </div>
          </div>
        </div>
      </main>
      
    
    </div>
  );

}
