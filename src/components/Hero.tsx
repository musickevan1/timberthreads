'use client';

import { Link } from 'react-scroll';

const Hero = () => {
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1499696010180-025ef6e1a8f9?q=80&w=1920&auto=format&fit=crop")',
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"></div>
      </div>
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium mb-6">
          Timber & Threads Retreat
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl mb-10 font-light">
          Relax, create, and connect in nature&apos;s embrace
        </p>
        <Link
          to="about"
          smooth="easeInOutQuart"
          duration={1000}
          offset={-70}
          className="inline-block bg-teal-50/90 text-stone-900 px-10 py-4 rounded-lg font-medium hover:bg-teal-50 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm"
          activeClass="bg-white shadow-lg"
        >
          Learn More
        </Link>
      </div>
    </section>
  );
};

export default Hero;
