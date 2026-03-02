import React from 'react';
import styles from './HeroOverlay.module.css';

export function HeroOverlay() {
  return (
    <div className={styles.overlay}>
      <div className={styles.badge}>Ascentra · Operis</div>
      <h1 className={styles.headline}>
        Warehouse Control Room Capacity,{' '}
        <span className={styles.accent}>On Demand.</span>
      </h1>
      <p className={styles.subline}>
        Senior operators and incident leaders for mechanized environments
        — measurable stability, predictable performance.
      </p>
    </div>
  );
}
