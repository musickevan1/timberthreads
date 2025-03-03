'use client';

const Contact = () => {
  return (
    <section id="contact" className="bg-white py-24 mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Get in Touch</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          <p className="text-lg text-stone-700 max-w-2xl mx-auto">
            Have questions about our workshops or accommodations? We'd love to hear from you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="bg-stone-50 rounded-lg p-8">
            <h3 className="text-xl font-serif text-stone-800 mb-4">Contact Information</h3>
            <div className="space-y-4 text-stone-700">
              <p className="flex items-center">
                <span className="w-20 font-medium">Email:</span>
                <a href="mailto:sandra.delapp@gmail.com" className="text-teal-600 hover:text-teal-800 hover:underline">
                  sandra.delapp@gmail.com
                </a>
              </p>
              <p className="flex items-center">
                <span className="w-20 font-medium">Phone:</span>
                <a href="tel:+14173431473" className="text-teal-600 hover:text-teal-800 hover:underline">
                  +1 (417) 343-1473
                </a>
              </p>
              <p className="flex items-start">
                <span className="w-20 font-medium">Address:</span>
                <a 
                  href="https://maps.google.com/?q=306+NW+300+Rd,+Clinton+MO" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-800 hover:underline"
                >
                  306 NW 300 Rd, Clinton MO
                </a>
              </p>
            </div>
          </div>

          <div className="bg-stone-50 rounded-lg p-8">
            <h3 className="text-xl font-serif text-stone-800 mb-4">Quick Inquiry</h3>
            <form className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-800 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded-md border-stone-200 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-stone-800 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-2 rounded-md border-stone-200 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Your email"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-stone-800 mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  className="w-full px-4 py-2 rounded-md border-stone-200 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Your message"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
