'use client';

export default function Calendar() {
  return (
    <section id="calendar" className="py-24 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Availability Calendar</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
        </div>
        
        {/* Google Calendar Embed */}
        <div className="relative w-full overflow-hidden" style={{ paddingTop: '75%' }}>
          <iframe
            src="https://calendar.google.com/calendar/embed?height=600&wkst=1&bgcolor=%23ffffff&ctz=America%2FChicago&showTitle=0&showNav=1&showPrint=0&showTabs=1&showCalendars=0"
            className="absolute top-0 left-0 w-full h-full border-0"
            frameBorder="0"
            scrolling="no"
          ></iframe>
        </div>

        {/* Pricing Information */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Pricing Information</h3>
          <div className="space-y-2">
            <p>March - April 2025: $500 per night for the entire center</p>
            <p>May 2025 onwards: $600 per night for the entire center</p>
            <p className="text-sm text-gray-600 mt-4">
              * Minimum 2-night stay required<br />
              * $250 refundable deposit (up to 10 days before arrival)
            </p>
          </div>
        </div>

        {/* Meal Options */}
        <div className="mt-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Meal Options</h3>
          <div className="space-y-2">
            <p>Continental Breakfast & Lunch: $10 per person per day</p>
            <p>Brunch & Dinner: $12.50 per person per day</p>
            <p>All 3 Meals: $15 per person per day</p>
            <p className="text-sm text-gray-600 mt-4">
              * We can accommodate dietary restrictions and allergies<br />
              * Full kitchen available if you prefer to bring your own groceries
            </p>
          </div>
        </div>

        {/* Contact Note */}
        <div className="mt-6 text-center text-gray-600">
          <p>To check availability and make a reservation, please contact us directly.</p>
          <p>Calendar is updated regularly to reflect current bookings.</p>
          <p className="mt-2">Our retreat center is located on an island surrounded by a small lake in Clinton, Missouri.</p>
        </div>
      </div>
    </section>
  );
}
