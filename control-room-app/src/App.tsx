import React, { useState, useEffect, Suspense } from 'react';
import { ControlRoomDiorama } from './scene/ControlRoomDiorama';
import { SystemsPanel } from './components/ui/SystemsPanel';
import { HeroOverlay } from './components/ui/HeroOverlay';
import { ScrollContent } from './components/ui/ScrollContent';
import { RequestModal } from './components/ui/RequestModal';
import { useStore } from './state/store';

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
  const { setCameraTarget, toggleConveyor, acknowledgeAlarm, cameraTarget } = useStore();

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
      {/* ── Hero Viewport: 3D scene + overlays ── */}
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <Suspense fallback={<LoadingScreen />}>
          <ControlRoomDiorama />
        </Suspense>

        <HeroOverlay />
        <SystemsPanel />

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
              btn.style.boxShadow = '0 8px 32px rgba(45,106,79,0.25)';
              btn.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.background = 'rgba(255,255,255,0.88)';
              btn.style.color = 'var(--text)';
              btn.style.boxShadow = '0 4px 24px rgba(0,0,0,0.08)';
              btn.style.transform = 'translateY(0)';
            }}
          >
            We know how to control room.<br />
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Discover our available profiles &darr;</span>
          </button>
        </div>
      </div>

      {/* ── Scrollable Content Below ── */}
      <ScrollContent onRequestProfiles={() => setModalOpen(true)} />

      <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
