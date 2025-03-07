'use client';

import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import About from '../components/About';
import Workshops from '../components/Workshops';
import Accommodations from '../components/Accommodations';
import Calendar from '../components/Calendar';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';
import Connect from '../components/Connect';
import Map from '../components/Map';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="flex-1">
      <NavBar />
      <Hero />
      <About />
      <Workshops />
      <Accommodations />
      <Calendar />
      <Gallery />
      <Contact />
      <Map />
      <Connect />
      <Footer />
    </main>
  );
}
