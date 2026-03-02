import React, { useState, useEffect, Suspense } from 'react';
import { ControlRoomDiorama } from './scene/ControlRoomDiorama';
import { SystemsPanel } from './components/ui/SystemsPanel';
import { ProfilesDock } from './components/ui/ProfilesDock';
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
      <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Suspense fallback={<LoadingScreen />}>
          <ControlRoomDiorama />
        </Suspense>

        <HeroOverlay />
        <SystemsPanel />
        <ProfilesDock />

        {/* Scroll indicator */}
        <div style={{
          position: 'absolute',
          bottom: 14,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 15,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          opacity: 0.5,
          animation: 'fade-in 1s ease-out 1.5s both',
          cursor: 'pointer',
        }}
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span style={{
            fontSize: '0.55rem',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}>Scroll to explore</span>
          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" style={{ animation: 'bounce 2s infinite' }}>
            <path d="M1 1L8 8L15 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <style>{`@keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(4px); } }`}</style>
        </div>
      </div>

      {/* ── Scrollable Content Below ── */}
      <ScrollContent onRequestProfiles={() => setModalOpen(true)} />

      <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
