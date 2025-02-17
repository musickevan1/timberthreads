'use client';

import React from 'react';

const Workshops = () => {
  return (
    <section id="workshops" className="min-h-screen bg-white py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Our Workshops</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Join us for immersive crafting experiences designed to inspire creativity and foster community.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-stone-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1520865611508-91bc0ddcd321?q=80&w=800&auto=format&fit=crop"
                alt="Textile workshop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Textile Arts</h3>
              <p className="text-stone-700 mb-4">
                Explore the art of weaving, knitting, and fiber crafts in our well-equipped studio.
              </p>
              <span className="text-teal-700 font-medium">Starting at $75</span>
            </div>
          </div>
          
          <div className="bg-stone-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1611145434336-2c911e1949e9?q=80&w=800&auto=format&fit=crop"
                alt="Woodworking workshop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Woodworking</h3>
              <p className="text-stone-700 mb-4">
                Learn traditional woodworking techniques from experienced craftsmen.
              </p>
              <span className="text-teal-700 font-medium">Starting at $95</span>
            </div>
          </div>
          
          <div className="bg-stone-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="h-48 overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1596566833669-39d07c096259?q=80&w=800&auto=format&fit=crop"
                alt="Mixed media workshop"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-serif text-stone-800 mb-3">Mixed Media</h3>
              <p className="text-stone-700 mb-4">
                Combine different materials and techniques to create unique pieces.
              </p>
              <span className="text-teal-700 font-medium">Starting at $85</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Workshops;
