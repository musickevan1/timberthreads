'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function Map() {
  const [activeTab, setActiveTab] = useState<'map' | 'directions'>('map');

  return (
    <section id="location" className="bg-stone-50 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Find Us</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Discover the tranquil location of Timber & Threads Retreat
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Map and Directions Tabs */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="flex border-b border-stone-200">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'map' 
                    ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Google Maps
              </button>
              <button
                onClick={() => setActiveTab('directions')}
                className={`flex-1 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'directions' 
                    ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' 
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Driving Directions
              </button>
            </div>

            {activeTab === 'map' && (
              <div className="p-6">
                <div className="aspect-video bg-stone-200 flex items-center justify-center">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3096.2619813937!2d-93.73333482388574!3d38.35667797966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x87c0a4a27a7f5e9d%3A0x5c7c6a35c3a3e3!2s306%20NW%20300%20Rd%2C%20Clinton%2C%20MO%2064735!5e0!3m2!1sen!2sus!4v1709769600000!5m2!1sen!2sus"
                    width="600"
                    height="450"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                  ></iframe>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm text-stone-600">
                    306 NW 300 Rd, Clinton, MO 64735
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'directions' && (
              <div className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-stone-800 mb-4">Detailed Directions</h3>
                <ol className="space-y-3 text-stone-700 list-decimal list-inside">
                  <li>
                    From Highway 7, turn North onto NW 221 Road 
                    <span className="block text-sm text-stone-500">
                      Located near Golden Valley Fireworks and Breaktime Convenience Store
                    </span>
                  </li>
                  <li>Follow the Blacktop Road to the "T" intersection</li>
                  <li>Turn left at the intersection</li>
                  <li>
                    On the first curve, look for a large fence and gate
                    <span className="block text-sm text-stone-500">
                      You can't miss the gate entrance
                    </span>
                  </li>
                  <li>Go through the gate</li>
                  <li>
                    Follow the road to the right
                    <span className="block text-sm text-stone-500">
                      Continue until you see the Timber & Threads Retreat center
                    </span>
                  </li>
                </ol>
                <div className="mt-6 bg-teal-50 border-l-4 border-teal-500 p-4 text-sm text-stone-700">
                  <p>
                    <strong>Tip:</strong> GPS coordinates can sometimes be unreliable in rural areas. 
                    Follow these directions carefully or call ahead if you're unsure.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Route Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="aspect-video relative">
              <Image
                src="/assets/gallery/entrance-driveway.jpeg"
                alt="Entrance to Timber & Threads Retreat"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-stone-800 mb-2">Approach to the Retreat</h3>
              <p className="text-stone-600 text-sm">
                A scenic view of the entrance and driveway leading to Timber & Threads Retreat.
                Notice the welcoming gate and the natural surroundings that await you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
