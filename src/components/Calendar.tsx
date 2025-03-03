'use client';

export default function Calendar() {
  return (
    <section id="calendar" className="py-24 bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Availability Calendar</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Plan your creative getaway at Timber & Threads Retreat
          </p>
        </div>
        
        {/* Google Calendar Embed */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-12">
          <div className="relative w-full overflow-hidden" style={{ paddingTop: '75%' }}>
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FChicago&title=Availability%20Calendar&showPrint=0&src=YzYwMDhmYTYwZDJhOTBkZTRjZDczYWJlNDEwYzc3ZWRkZWRkNjhmNTI5MmQ2YTY3OGE2MTQ1YTk1OTRhMDJmZkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&color=%23A79B8E"
              className="absolute top-0 left-0 w-full h-full border-0"
              frameBorder="0"
              scrolling="no"
            ></iframe>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Pricing Information */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-800 text-center mb-6">Pricing Information</h3>
            <div className="space-y-4 text-stone-700">
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium">March - April 2025</p>
                <p className="text-lg font-serif text-teal-700">$500 per night</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium">May 2025 onwards</p>
                <p className="text-lg font-serif text-teal-700">$600 per night</p>
              </div>
              <ul className="text-sm space-y-2 mt-4 text-stone-600">
                <li>• Minimum 2-night stay required</li>
                <li>• $250 refundable deposit (up to 10 days before arrival)</li>
                <li>• Entire center rental includes all amenities</li>
              </ul>
            </div>
          </div>

          {/* Meal Options */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13V6a2 2 0 112 2v5m-2-7V3m0 0a2 2 0 112 2v5M9 19h6m2 0a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h14z" />
              </svg>
            </div>
            <h3 className="text-xl font-serif text-stone-800 text-center mb-6">Meal Options</h3>
            <div className="space-y-4 text-stone-700">
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium">Continental Breakfast & Lunch</p>
                <p className="text-lg font-serif text-teal-700">$10 per person/day</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium">Brunch & Dinner</p>
                <p className="text-lg font-serif text-teal-700">$12.50 per person/day</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-lg">
                <p className="font-medium">All 3 Meals</p>
                <p className="text-lg font-serif text-teal-700">$15 per person/day</p>
              </div>
              <ul className="text-sm space-y-2 mt-4 text-stone-600">
                <li>• Dietary restrictions accommodated</li>
                <li>• Full kitchen available for self-catering</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Note */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-lg text-stone-700 mb-4">
            To check availability and make a reservation, please contact us directly.
            Our retreat center is located on an island surrounded by a small lake in Clinton, Missouri.
          </p>
          <p className="text-stone-600">
            Calendar is updated regularly to reflect current bookings.
          </p>
        </div>
      </div>
    </section>
  );
}
