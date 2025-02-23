'use client';

export default function Calendar() {
  return (
    <section id="calendar" className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Availability Calendar</h2>
        
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

        {/* Contact Note */}
        <div className="mt-6 text-center text-gray-600">
          <p>To check availability and make a reservation, please contact us directly.</p>
          <p>Calendar is updated regularly to reflect current bookings.</p>
        </div>
      </div>
    </section>
  );
}
