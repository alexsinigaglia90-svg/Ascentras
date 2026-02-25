(function initPlatformJourney() {
  let hasLoggedInit = false;

  function setRuntimeState(root, state, detail) {
    root.setAttribute('data-pj-state', state);
    const indicator = root.querySelector('.pj-build-indicator');
    if (!indicator) return;
    indicator.textContent = detail ? `Build: LIVE · PJ: ${state.toUpperCase()} · ${detail}` : `Build: LIVE · PJ: ${state.toUpperCase()}`;
  }

  function fallbackStack(root, worlds, reason) {
    if (reason) {
      console.error('[PlatformJourney] fallback:', reason);
    }

    root.classList.remove('pj-enhanced');
    root.classList.remove('pj-cinematic-ready');
    root.classList.add('pj-fallback');
    root.setAttribute('data-world', 'ascentra');
    setRuntimeState(root, 'fallback', reason?.message || 'safe');

    worlds.forEach((world) => {
      world.classList.add('is-active');
      world.classList.add('is-revealed');
    });
  }

  function setWorld(root, worlds, key) {
    root.setAttribute('data-world', key);
    worlds.forEach((world) => {
      const isActive = world.dataset.world === key;
      world.classList.toggle('is-active', isActive);
      world.classList.toggle('is-revealed', isActive);
    });
  }

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function isActuallyVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0.05 && rect.width > 8 && rect.height > 8;
  }

  function init() {
    const root = document.getElementById('platform-journey');
    if (!root) return;

    setRuntimeState(root, 'boot');

    const stage = root.querySelector('#platform-journey-stage');
    const worlds = Array.from(root.querySelectorAll('.pj-world'));

    if (!stage || worlds.length < 3) {
      fallbackStack(root, worlds, new Error('Missing required Platform Journey elements'));
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    try {
      root.classList.add('pj-enhanced');
      setWorld(root, worlds, 'ascentra');
      window.requestAnimationFrame(() => {
        root.classList.add('pj-cinematic-ready');
        setRuntimeState(root, 'cinematic');
      });

      const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
      const gsap = hasGsap ? window.gsap : null;
      const ScrollTrigger = hasGsap ? window.ScrollTrigger : null;
      const lines = root.querySelectorAll('.platform-lines .line');

      if (hasGsap) {
        gsap.registerPlugin(ScrollTrigger);
      }

      function setByProgress(progress) {
        root.style.setProperty('--pj-progress', progress.toFixed(4));

        const worldIndex = Math.max(0, Math.min(worlds.length - 1, Math.round(progress * (worlds.length - 1))));
        const activeKey = worlds[worldIndex]?.dataset.world || 'ascentra';
        setWorld(root, worlds, activeKey);

        const lineScale = 0.92 + progress * 0.24;
        const lineOpacity = 0.22 + (1 - Math.abs(progress - 0.5) * 2) * 0.22;

        if (hasGsap) {
          gsap.set(lines, { scaleX: lineScale, opacity: Math.max(0.18, lineOpacity) });
        } else {
          lines.forEach((line) => {
            line.style.transform = `scaleX(${lineScale.toFixed(3)})`;
            line.style.opacity = `${Math.max(0.18, lineOpacity).toFixed(3)}`;
          });
        }
      }

      let ticking = false;
      const syncFromScroll = () => {
        if (ticking) return;
        ticking = true;

        window.requestAnimationFrame(() => {
          const rect = root.getBoundingClientRect();
          const distance = Math.max(1, rect.height - window.innerHeight);
          const progress = clamp01((-rect.top) / distance);
          setByProgress(progress);
          ticking = false;
        });
      };

      window.addEventListener('scroll', syncFromScroll, { passive: true });
      window.addEventListener('resize', syncFromScroll);
      syncFromScroll();
      window.setTimeout(syncFromScroll, 100);

      window.setTimeout(() => {
        const activeWorld = root.querySelector('.pj-world.is-active');
        const activeCopy = root.querySelector('.pj-world.is-active .pj-copy');
        const activePreview = root.querySelector('.pj-world.is-active .pj-preview');
        const healthy = isActuallyVisible(activeWorld) && (isActuallyVisible(activeCopy) || isActuallyVisible(activePreview));
        if (!healthy) {
          setRuntimeState(root, 'cinematic', 'degraded-visibility');
          console.warn('[PlatformJourney] visibility health-check not ideal, keeping cinematic mode active');
        }
      }, 220);

      root.addEventListener('mousemove', (event) => {
        if (!gsap || prefersReducedMotion) return;
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        const rect = stage.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
        gsap.to(active, { x: nx, y: ny, duration: 0.24, overwrite: true, ease: 'power3.out' });
      });

      root.addEventListener('mouseleave', () => {
        if (!gsap || prefersReducedMotion) return;
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        gsap.to(active, { x: 0, y: 0, duration: 0.3, overwrite: true, ease: 'power3.out' });
      });

      if (!hasLoggedInit) {
        console.log('[PlatformJourney] cinematic journey attached');
        hasLoggedInit = true;
      }
    } catch (error) {
      fallbackStack(root, worlds, error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
