import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';
import { ControlRoomDiorama } from './scene/ControlRoomDiorama';
import { SystemsPanel } from './components/ui/SystemsPanel';
import { OperationsPanel } from './components/ui/OperationsPanel';
import { HeroOverlay } from './components/ui/HeroOverlay';
import { RequestModal } from './components/ui/RequestModal';
import { useStore } from './state/store';

/* Lazy-load ScrollContent — it's below the fold, no need to block first paint */
const ScrollContent = lazy(() =>
  import('./components/ui/ScrollContent').then(m => ({ default: m.ScrollContent }))
);

function LoadingScreen() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      zIndex: 999,
    }}>
      <div style={{
        width: 40,
        height: 40,
        border: '2px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <span style={{
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        Initialising Control Room
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const { setCameraTarget, toggleConveyor, acknowledgeAlarm, cameraTarget } = useStore();

  useEffect(() => {
    const handleVisibility = () => setPageVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        entries => {
          const entry = entries[0];
          setHeroInView(entry.isIntersecting && entry.intersectionRatio > 0.12);
        },
        { threshold: [0, 0.12, 0.25, 0.5, 1] }
      );

      observer.observe(heroEl);
      return () => observer.disconnect();
    }

    const update = () => {
      const rect = heroEl.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const visiblePx = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const ratio = Math.max(0, visiblePx) / Math.max(1, rect.height);
      setHeroInView(ratio > 0.12);
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();

    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  const sceneActive = heroInView && pageVisible;

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      switch (e.key) {
        case ' ':
        case 'Space':
          e.preventDefault();
          toggleConveyor();
          break;
        case 'a':
        case 'A':
          acknowledgeAlarm();
          break;
        case 'Escape':
          if (modalOpen) {
            setModalOpen(false);
          } else if (cameraTarget !== 'overview') {
            setCameraTarget('overview');
          }
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen, cameraTarget, setCameraTarget, toggleConveyor, acknowledgeAlarm]);

  return (
    <>
      {/* ── Fixed home navigation ── */}
      <a
        href="/"
        style={{
          position: 'fixed',
          top: 16,
          left: 20,
          zIndex: 200,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 18px',
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: 'var(--font-serif)',
          letterSpacing: '0.02em',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          borderRadius: '100px',
          textDecoration: 'none',
          boxShadow: '0 2px 12px rgba(8,23,42,0.06)',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          const el = e.currentTarget;
          el.style.background = 'var(--accent)';
          el.style.color = '#fff';
          el.style.borderColor = 'var(--accent)';
          el.style.boxShadow = '0 4px 20px rgba(47,95,138,0.25)';
        }}
        onMouseLeave={e => {
          const el = e.currentTarget;
          el.style.background = 'rgba(255,255,255,0.82)';
          el.style.color = 'var(--text)';
          el.style.borderColor = 'var(--border)';
          el.style.boxShadow = '0 2px 12px rgba(8,23,42,0.06)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        Ascentra
      </a>

      {/* ── Hero Viewport: 3D scene + overlays ── */}
      <div ref={heroRef} style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Suspense fallback={<LoadingScreen />}>
          <ControlRoomDiorama active={sceneActive} />
        </Suspense>

        <HeroOverlay />
        <SystemsPanel />
        <OperationsPanel />

        {/* Immersive CTA — smooth scroll to profiles */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 20,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            animation: 'fade-in 1s ease-out 1s both',
          }}
        >
          <button
            onClick={() => {
              const el = document.getElementById('profiles-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '14px 32px',
              fontSize: '0.82rem',
              fontWeight: 600,
              fontFamily: 'var(--font-sans)',
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: 'var(--text)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '100px',
              cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              letterSpacing: '0.01em',
              lineHeight: 1.4,
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.background = 'var(--accent)';
              btn.style.color = '#fff';
              btn.style.boxShadow = '0 8px 32px rgba(47,95,138,0.25)';
              btn.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.background = 'rgba(255,255,255,0.88)';
              btn.style.color = 'var(--text)';
              btn.style.boxShadow = '0 4px 24px rgba(8,23,42,0.08)';
              btn.style.transform = 'translateY(0)';
            }}
          >
            We know how to control room.<br />
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Discover our available profiles &darr;</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable Content Below (lazy-loaded) ── */}
      <Suspense fallback={
        <div style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--bg)' }}>
          <div style={{
            width: 32, height: 32, margin: '0 auto',
            border: '2px solid var(--border)', borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'spin 1s linear infinite',
          }} />
        </div>
      }>
        <ScrollContent onRequestProfiles={() => setModalOpen(true)} />
      </Suspense>

      <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
