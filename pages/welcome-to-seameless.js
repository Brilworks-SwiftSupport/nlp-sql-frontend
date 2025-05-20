import { useState, useEffect } from 'react';
import Head from 'next/head';

const features = [
  {
    title: 'Multiple Database Support',
    description: 'Connect to MySQL, PostgreSQL, SQL Server and more to query your data across different platforms.',
    icon: () => (
      <svg className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
      </svg>
    ),
  },
  {
    title: 'Natural Language Queries',
    description: 'Ask questions in plain English and get accurate SQL queries and results instantly.',
    icon: () => (
      <svg className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
  },
  {
    title: 'Secure Connections',
    description: 'Your database credentials are encrypted and stored securely, and all connections are made securely.',
    icon: () => (
      <svg className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
];

export default function WelcomePage() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((current - 1 + features.length) % features.length);
  };

  const nextSlide = () => {
    setCurrent((current + 1) % features.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((c) => (c + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Welcome to Seameless</title>
      </Head>
      <div className="w-full p-4 text-center">
        <h1 className="text-3xl md:text-5xl font-extrabold flex items-center justify-center gap-2">
          Experience the Demo. Win a Gift Worth AED 500!
          <span className="text-4xl" role="img" aria-label="gift">
            🎁
          </span>
        </h1>
      </div>
      <div className="flex flex-col md:flex-row flex-grow">
        <div className="md:w-1/2 w-full flex items-center justify-center p-8 bg-gray-50">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=https%3A%2F%2Fnlp-sql-frontend-six.vercel.app%2Fget-started"
            alt="Scan to get started"
            className="rounded-lg shadow-md"
          />
        </div>
        <div className="md:w-1/2 w-full relative flex flex-col items-center justify-center p-8 bg-white">
        <div className="overflow-hidden w-full">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="w-full flex-shrink-0 flex flex-col items-center text-center px-6"
              >
                {feature.icon()}
                <h3 className="mt-6 text-2xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 max-w-md">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full shadow hover:bg-gray-100"
        >
          <svg className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="mt-6 flex space-x-2">
          {features.map((_, idx) => (
            <span
              key={idx}
              className={`h-2 w-2 rounded-full ${idx === current ? 'bg-blue-600' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  </div>
  );
}
