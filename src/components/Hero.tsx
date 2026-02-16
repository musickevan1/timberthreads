'use client';

import { Link } from 'react-scroll';
import Image from 'next/image';

const Hero = () => {
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/assets/gallery/hero-front-view.jpeg"
          alt="Timber & Threads Retreat Center"
          fill
          priority
          quality={80}
          sizes="100vw"
          className="object-cover"
          style={{
            objectPosition: 'center 15%',
            transform: 'scale(1.01)' // Slight scale to prevent edge artifacts
          }}
        />
        <div className="absolute inset-0 bg-black/50"></div>
      </div>
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
        <div className="relative w-40 h-40 mx-auto mb-6">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl"></div>
          <Image
            src="/assets/gallery/logo.png"
            alt="Timber & Threads Logo"
            fill
            priority
            className="object-contain drop-shadow-lg"
            sizes="(max-width: 768px) 160px, 160px"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium mb-6">
          Timber & Threads Retreat
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl mb-10 font-light">
          Relax, create, and connect in nature&apos;s embrace
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
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
          <Link
            to="contact"
            smooth="easeInOutQuart"
            duration={1000}
            offset={-70}
            className="inline-block bg-teal-600/90 text-white px-10 py-4 rounded-lg font-medium hover:bg-teal-600 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm"
            activeClass="bg-teal-700 shadow-lg"
          >
            Contact Us to Book
          </Link>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
        <div className="flex justify-center">
          <Link
            to="about"
            smooth="easeInOutQuart"
            duration={1000}
            offset={-70}
            className="inline-block text-white/70 hover:text-white cursor-pointer transition-all hover:scale-105 pointer-events-auto pb-4"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6"
              style={{ animation: 'subtleBounce 3s ease-in-out infinite' }}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M19 14l-7 7m0 0l-7-7m7 7V3" 
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
