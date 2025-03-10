'use client';

import React, { useState, useEffect } from 'react';
import { Link } from 'react-scroll';

const NavBar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navItems = [
    { title: 'Home', to: 'hero' },
    { title: 'About', to: 'about' },
    { title: 'Retreats', to: 'workshops' },
    { title: 'Accommodations', to: 'accommodations' },
    { title: 'Calendar', to: 'calendar' },
    { title: 'Gallery', to: 'gallery' },
    { title: 'Contact', to: 'contact' },
    { title: 'Location', to: 'location' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-stone-100/95 backdrop-blur-md shadow-md z-[100]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex-shrink-0">
            <Link
              to="hero"
              smooth="easeInOutQuart"
              duration={1000}
              offset={-70}
              className="cursor-pointer group"
            >
              <span className="text-2xl font-serif text-stone-800 group-hover:text-teal-700 transition-colors">Timber & Threads</span>
              <div className="w-0 h-1 bg-teal-600 group-hover:w-full transition-all duration-300"></div>
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-10">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  smooth="easeInOutQuart"
                  duration={1000}
                  offset={-70}
                  className="text-stone-800 hover:text-teal-700 font-medium cursor-pointer transition-colors duration-300"
                  activeClass="text-teal-700"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
          <div className="md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-stone-800 hover:text-teal-700 transition-colors duration-300 p-2"
              aria-expanded={isOpen}
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobile && (
          <div 
            className={`fixed top-20 left-0 right-0 bg-stone-100/95 backdrop-blur-md transition-all duration-300 ease-in-out border-t border-stone-200 z-[90] ${
              isOpen 
                ? 'opacity-100 translate-y-0 shadow-lg visible' 
                : 'opacity-0 -translate-y-4 invisible pointer-events-none'
            }`}
          >
            <div className="space-y-2 px-4 py-4 max-w-7xl mx-auto">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  smooth="easeInOutQuart"
                  duration={1000}
                  offset={-70}
                  className="block w-full px-4 py-3 text-stone-800 hover:text-teal-700 font-medium cursor-pointer transition-all duration-300 hover:bg-stone-200/50 rounded-lg text-center"
                  activeClass="text-teal-700 bg-stone-50"
                  onClick={() => setIsOpen(false)}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
