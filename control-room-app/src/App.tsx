import React, { useState, useEffect, Suspense } from 'react';
import { ControlRoomDiorama } from './scene/ControlRoomDiorama';
import { SystemsPanel } from './components/ui/SystemsPanel';
import { OperationsPanel } from './components/ui/OperationsPanel';
import { ProfilesDock } from './components/ui/ProfilesDock';
import { HeroOverlay } from './components/ui/HeroOverlay';
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
      <Suspense fallback={<LoadingScreen />}>
        <ControlRoomDiorama />
      </Suspense>

      <HeroOverlay />
      <SystemsPanel />
      <OperationsPanel />
      <ProfilesDock />

      {/* CTA button */}
      <button
        onClick={() => setModalOpen(true)}
        style={{
          position: 'fixed',
          bottom: 115,
          right: 16,
          zIndex: 25,
          padding: '8px 18px',
          fontSize: '0.7rem',
          fontWeight: 600,
          fontFamily: 'var(--font-sans)',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 'var(--radius-xs)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(107, 173, 107, 0.3)',
          transition: 'all 0.15s',
          animation: 'fade-in 0.6s ease-out 0.6s both',
        }}
        onMouseEnter={e => {
          (e.target as HTMLButtonElement).style.background = 'var(--accent-bright)';
        }}
        onMouseLeave={e => {
          (e.target as HTMLButtonElement).style.background = 'var(--accent)';
        }}
      >
        Request Profiles
      </button>

      <RequestModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Keyboard hints */}
      <div style={{
        position: 'fixed',
        bottom: 8,
        right: 16,
        zIndex: 10,
        display: 'flex',
        gap: 8,
        opacity: 0.35,
        fontSize: '0.5rem',
        color: 'var(--text-muted)',
      }}>
        <span>Space: Conveyor</span>
        <span>A: Ack Alarms</span>
        <span>Esc: Back</span>
      </div>
    </>
  );
}
