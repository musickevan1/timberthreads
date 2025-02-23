'use client';

import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import About from '../components/About';
import Accommodations from '../components/Accommodations';
import Calendar from '../components/Calendar';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <main className="min-h-screen">
      <NavBar />
      <Hero />
      <About />
      <Accommodations />
      <Calendar />
      <Gallery />
      <Contact />
    </main>
  );
}
