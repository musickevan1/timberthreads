'use client';

import { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    success: false,
    error: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.email || !formData.message) {
      setStatus({
        submitting: false,
        submitted: true,
        success: false,
        error: 'Please fill out all fields'
      });
      return;
    }
    
    setStatus({
      submitting: true,
      submitted: false,
      success: false,
      error: ''
    });
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      // Success
      setStatus({
        submitting: false,
        submitted: true,
        success: true,
        error: ''
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      
    } catch (error) {
      setStatus({
        submitting: false,
        submitted: true,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      });
    }
  };

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
                <a href="mailto:timberandthreads24@gmail.com" className="text-teal-600 hover:text-teal-800 hover:underline">
                  timberandthreads24@gmail.com
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
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-stone-800 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full px-4 py-2 rounded-md border-stone-200 focus:border-teal-500 focus:ring-teal-500"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={handleChange}
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
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.message}
                  onChange={handleChange}
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-teal-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors"
                disabled={status.submitting}
              >
                {status.submitting ? 'Sending...' : 'Send Message'}
              </button>
              
              {status.submitted && (
                <div className={`mt-4 p-3 rounded-md ${status.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {status.success 
                    ? 'Your message has been sent successfully! We will get back to you soon.' 
                    : `Error: ${status.error}`
                  }
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
