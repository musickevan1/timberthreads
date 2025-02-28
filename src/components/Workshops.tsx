'use client';

const Workshops = () => {
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
