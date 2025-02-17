import Head from 'next/head';
import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import About from '../components/About';
import Workshops from '../components/Workshops';
import Accommodations from '../components/Accommodations';
import Contact from '../components/Contact';

export default function Home() {
  return (
    <>
      <Head>
        <title>Timber & Threads Retreat</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <NavBar />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <section id="about">
          <About />
        </section>
        <section id="workshops">
          <Workshops />
        </section>
        <section id="accommodations">
          <Accommodations />
        </section>
        <section id="contact">
          <Contact />
        </section>
      </main>
    </>
  );
}
