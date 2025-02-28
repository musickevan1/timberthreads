'use client';
import React from 'react';

const Workshops: React.FC = () => {
  return (
    <section id="workshops" className="min-h-screen bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Quilting Retreats</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Our retreat center is perfect for quilting groups, crafting weekends, and creative gatherings.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-stone-50 rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-4">Group Retreats</h3>
            <p className="text-stone-700 mb-6">
              Bring your quilting or crafting group for a dedicated creative getaway. Our space is perfect for groups 
              looking to work on projects together in a peaceful setting.
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>• Accommodates multiple workstations</li>
              <li>• Dedicated cutting and ironing stations</li>
              <li>• Comfortable seating for long creative sessions</li>
              <li>• Flexible space for group activities</li>
            </ul>
          </div>

          <div className="bg-stone-50 rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-4">Family Gatherings</h3>
            <p className="text-stone-700 mb-6">
              Our retreat center is also perfect for family gatherings. The workroom doubles as a comfortable living 
              space when not being used for crafting activities.
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>• Comfortable accommodations for families</li>
              <li>• Full kitchen for meal preparation</li>
              <li>• Peaceful lake setting</li>
              <li>• All-on-one-level accessibility</li>
            </ul>
          </div>

          <div className="bg-stone-50 rounded-lg p-6 shadow-sm">
            <div className="flex justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-800 mb-4">Amenities</h3>
            <p className="text-stone-700 mb-6">
              We provide everything you need for a comfortable and productive stay at our retreat center.
            </p>
            <ul className="space-y-2 text-stone-700">
              <li>• Starlink Internet access</li>
              <li>• Full kitchen with dishwasher</li>
              <li>• Coffee, tea, and basic beverages provided</li>
              <li>• Optional meal service available</li>
              <li>• Outdoor picnic area</li>
              <li>• Peaceful lake views</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-lg text-stone-700 max-w-2xl mx-auto mb-8">
            Whether you're planning a quilting retreat, crafting weekend, or family gathering, 
            Timber & Threads Retreat provides the perfect setting for your group.
          </p>
          <a 
            href="#contact" 
            className="inline-block bg-teal-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
          >
            Contact Us to Book
          </a>
        </div>
      </div>
    </section>
  );
};

export default Workshops;
