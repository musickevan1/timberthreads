'use client';

import React from 'react';

const Accommodations = () => {
  return (
    <section id="accommodations" className="min-h-screen bg-stone-100 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Stay With Us</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Experience comfort and tranquility in our purpose-built quilting retreat facility.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="/assets/hero-front-view.jpeg"
                alt="Retreat front view"
                className="w-full h-full object-cover object-center"
                style={{ objectPosition: '0 30%' }}
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Comfortable Accommodations</h3>
              <p className="text-stone-700 mb-4">
                Our retreat center is all on one level with comfortable accommodations for your quilting 
                or crafting group, featuring peaceful lake views.
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• 4 bedrooms with comfortable beds</li>
                <li>• 2 bathrooms (one with tub/shower, one with walk-in shower)</li>
                <li>• Bedding and towels provided</li>
                <li>• Full kitchen with dishwasher</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="/assets/quilt-workspace.jpeg"
                alt="Quilting workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Creative Workspaces</h3>
              <p className="text-stone-700 mb-4">
                Our workroom doubles as a living room for family rentals, but is perfectly equipped 
                for quilting and crafting retreats.
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• 30 x 60 tables with comfortable leather chairs</li>
                <li>• 2 cutting tables and 2 ironing stations</li>
                <li>• Starlink Internet access</li>
                <li>• Outdoor picnic table for meals or quiet time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Accommodations;
