import React from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section id="hero" className={styles.hero}>
      <div className={styles.overlay}>
        <div className={styles.content}>
          <h1>Timber & Threads Retreat</h1>
          <p className={styles.subtitle}>A cozy escape for creativity and relaxation</p>
          <button
            onClick={() =>
              document.getElementById('contact') &&
              document.getElementById('contact').scrollIntoView({ behavior: 'smooth' })
            }
            className={styles.ctaButton}
          >
            Book Now
          </button>
        </div>
      </div>
    </section>
  );
}
