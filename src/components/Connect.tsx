'use client';

import React from 'react';

export default function Connect() {
  return (
    <section id="connect" className="min-h-screen bg-stone-50 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Connect With Us</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto"></div>
          <p className="mt-4 text-lg text-stone-700">Stay updated with our latest news and events</p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="shadow-lg rounded-lg overflow-hidden bg-white p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Facebook Icon and Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex justify-center md:justify-start mb-4">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24"
                    className="w-16 h-16 text-blue-600 fill-current"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-serif text-stone-800 mb-3">Follow Us on Facebook</h3>
                <p className="text-stone-600 mb-6">
                  Stay connected with Timber & Threads Retreat Center on Facebook for the latest updates, 
                  events, and quilting inspiration.
                </p>
                <a 
                  href="https://www.facebook.com/people/Timber-and-Threads-Retreat-Center/61571800331062/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 rounded-lg transition duration-300"
                >
                  Visit Our Facebook Page
                </a>
              </div>
              
              {/* Facebook Preview Image */}
              <div className="flex-1 mt-6 md:mt-0">
                <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
                  <a 
                    href="https://www.facebook.com/people/Timber-and-Threads-Retreat-Center/61571800331062/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <div className="bg-blue-600 text-white p-4 flex items-center">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        viewBox="0 0 24 24"
                        className="w-6 h-6 fill-current mr-2"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      <span className="font-medium">Timber and Threads Retreat Center</span>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="text-gray-700 mb-3">
                        Join our community of quilters and crafters! Follow our page for:
                      </p>
                      <ul className="text-gray-700 space-y-2 list-disc pl-5">
                        <li>Upcoming retreat dates</li>
                        <li>Special events and workshops</li>
                        <li>Photos of recent quilting projects</li>
                        <li>Retreat center updates</li>
                      </ul>
                      <div className="mt-4 text-sm text-gray-500">
                        Last updated: March 2025
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
