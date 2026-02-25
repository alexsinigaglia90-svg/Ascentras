(function initPlatformJourney() {
  let hasLoggedInit = false;

  function fallbackStack(root, worlds, reason) {
    if (reason) {
      console.error('[PlatformJourney] fallback:', reason);
    }

    root.classList.remove('pj-enhanced');
    root.classList.add('pj-fallback');
    root.setAttribute('data-world', 'ascentra');

    worlds.forEach((world) => {
      world.classList.add('is-active');
      world.classList.add('is-revealed');
    });
  }

  function setWorld(root, worlds, key) {
    root.setAttribute('data-world', key);
    worlds.forEach((world) => {
      world.classList.toggle('is-active', world.dataset.world === key);
    });
  }

  function validateElements(elements) {
    return Object.entries(elements).every((entry) => Boolean(entry[1]));
  }

  function init() {
    const root = document.getElementById('platform-journey');
    if (!root) return;

    const stage = root.querySelector('#platform-journey-stage');
    const worlds = Array.from(root.querySelectorAll('.pj-world'));

    const elements = { stage };
    if (!validateElements(elements) || worlds.length < 3) {
      fallbackStack(root, worlds, new Error('Missing required Platform Journey elements'));
      return;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      fallbackStack(root, worlds);
      return;
    }

    try {
      const hasGsap = Boolean(window.gsap && window.ScrollTrigger);
      const gsap = hasGsap ? window.gsap : null;
      const ScrollTrigger = hasGsap ? window.ScrollTrigger : null;

      if (hasGsap) {
        gsap.registerPlugin(ScrollTrigger);
        root.classList.add('pj-enhanced');
      }

      setWorld(root, worlds, 'ascentra');
      worlds.forEach((world) => world.classList.add('is-revealed'));

      function applyWorldState(activeKey) {
        setWorld(root, worlds, activeKey);
      }

      applyWorldState('ascentra');

      function updateActiveWorld() {
        const viewportMiddle = window.innerHeight * 0.48;
        let candidate = worlds[0];
        let bestDistance = Number.POSITIVE_INFINITY;

        worlds.forEach((world) => {
          const rect = world.getBoundingClientRect();
          const worldMiddle = rect.top + rect.height * 0.5;
          const distance = Math.abs(worldMiddle - viewportMiddle);
          if (distance < bestDistance) {
            bestDistance = distance;
            candidate = world;
          }
          const inView = rect.bottom > window.innerHeight * 0.02 && rect.top < window.innerHeight * 0.98;
          world.classList.toggle('is-revealed', inView);
        });

        const activeKey = candidate.dataset.world || 'ascentra';
        applyWorldState(activeKey);
      }

      if (hasGsap) {
        const lines = gsap.utils.toArray('.platform-lines .line', root);
        gsap.set(lines, { scaleX: 0.95, opacity: 0.24 });

        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            const progress = self.progress;
            root.style.setProperty('--pj-progress', progress.toFixed(4));
            const lineScale = 0.95 + progress * 0.14;
            const lineOpacity = 0.24 + (1 - Math.abs(progress - 0.5) * 2) * 0.14;
            gsap.set(lines, { scaleX: lineScale, opacity: Math.max(0.2, lineOpacity) });
          }
        });
      }

      let ticking = false;
      const onScrollOrResize = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          updateActiveWorld();
          ticking = false;
        });
      };

      window.addEventListener('scroll', onScrollOrResize, { passive: true });
      window.addEventListener('resize', onScrollOrResize);
      updateActiveWorld();
      window.setTimeout(updateActiveWorld, 80);

      root.addEventListener('mousemove', (event) => {
        if (!gsap) return;
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        const rect = stage.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
        gsap.to(active, { x: nx, y: ny, duration: 0.35, overwrite: true });
      });

      root.addEventListener('mouseleave', () => {
        if (!gsap) return;
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        gsap.to(active, { x: 0, y: 0, duration: 0.4, overwrite: true });
      });

      if (!hasLoggedInit) {
        console.log('[PlatformJourney] journey attached');
        hasLoggedInit = true;
      }
    } catch (error) {
      fallbackStack(root, worlds, error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
