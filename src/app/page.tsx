'use client';

import NavBar from '@/components/NavBar';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Workshops from '@/components/Workshops';
import Accommodations from '@/components/Accommodations';
import Contact from '@/components/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <Hero />
      <About />
      <Workshops />
      <Accommodations />
      <Contact />
    </main>
  );
}
