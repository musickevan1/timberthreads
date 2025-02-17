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
            Experience comfort and tranquility in our purpose-built retreat facility.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=800&auto=format&fit=crop"
                alt="Cozy cabin exterior"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Cozy Cabins</h3>
              <p className="text-stone-700 mb-4">
                Our private cabins offer a perfect blend of rustic charm and modern comfort, 
                featuring handcrafted furniture and peaceful forest views.
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• Queen-sized beds with premium linens</li>
                <li>• Private bathroom with organic amenities</li>
                <li>• Covered porch with seating area</li>
                <li>• Mini kitchenette</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="h-64 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=800&auto=format&fit=crop"
                alt="Creative workspace"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Creative Spaces</h3>
              <p className="text-stone-700 mb-4">
                Dedicated workspaces designed for both individual projects and collaborative 
                creativity, equipped with everything you need.
              </p>
              <ul className="space-y-2 text-stone-700">
                <li>• Well-lit workstations</li>
                <li>• Professional-grade tools</li>
                <li>• Storage for materials</li>
                <li>• 24/7 access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Accommodations;
