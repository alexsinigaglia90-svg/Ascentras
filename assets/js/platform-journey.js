(function initPlatformJourney() {
  let hasLoggedInit = false;

  function fallbackStack(root, reason) {
    if (reason) {
      console.error('[PlatformJourney] fallback:', reason);
    }

    root.classList.add('pj-fallback');
    root.setAttribute('data-world', 'ascentra');

    const worlds = root.querySelectorAll('.pj-world');
    worlds.forEach((world) => {
      world.classList.add('is-active');
      world.style.opacity = '1';
      world.style.transform = 'none';
      world.style.position = 'static';
      world.style.pointerEvents = 'auto';

      const copy = world.querySelector('.pj-copy');
      const preview = world.querySelector('.pj-preview');
      if (copy) {
        copy.style.opacity = '1';
        copy.style.transform = 'none';
      }
      if (preview) {
        preview.style.opacity = '1';
        preview.style.transform = 'none';
      }
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
    const worldsWrap = root.querySelector('#pj-worlds');
    const worlds = Array.from(root.querySelectorAll('.pj-world'));

    const elements = { stage, worldsWrap };
    if (!validateElements(elements) || worlds.length < 3) {
      fallbackStack(root, new Error('Missing required Platform Journey elements'));
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      fallbackStack(root);
      return;
    }

    try {
      if (!window.gsap || !window.ScrollTrigger) {
        throw new Error('GSAP/ScrollTrigger missing');
      }

      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      gsap.registerPlugin(ScrollTrigger);
      console.log('[PlatformJourney] GSAP+ScrollTrigger loaded');

      const ascentra = worlds.find((world) => world.dataset.world === 'ascentra');
      const operis = worlds.find((world) => world.dataset.world === 'operis');
      const astra = worlds.find((world) => world.dataset.world === 'astra');

      if (!ascentra || !operis || !astra) {
        throw new Error('Expected worlds not found');
      }

      const worldNodes = {
        ascentra: {
          world: ascentra,
          copy: ascentra.querySelector('.pj-copy'),
          preview: ascentra.querySelector('.pj-preview')
        },
        operis: {
          world: operis,
          copy: operis.querySelector('.pj-copy'),
          preview: operis.querySelector('.pj-preview')
        },
        astra: {
          world: astra,
          copy: astra.querySelector('.pj-copy'),
          preview: astra.querySelector('.pj-preview')
        }
      };

      if (!worldNodes.ascentra.copy || !worldNodes.ascentra.preview || !worldNodes.operis.copy || !worldNodes.operis.preview || !worldNodes.astra.copy || !worldNodes.astra.preview) {
        throw new Error('Missing copy/preview nodes in one or more worlds');
      }

      setWorld(root, worlds, 'ascentra');

      gsap.set(worlds, { opacity: 0, y: 16, pointerEvents: 'none' });
      gsap.set([worldNodes.ascentra.world], { opacity: 1, y: 0, pointerEvents: 'auto' });
      gsap.set([worldNodes.ascentra.copy], { opacity: 1, y: 0 });
      gsap.set([worldNodes.ascentra.preview], { opacity: 1, x: 0, scale: 1 });
      gsap.set([
        worldNodes.operis.copy,
        worldNodes.astra.copy
      ], { opacity: 0, y: 24 });
      gsap.set([
        worldNodes.operis.preview,
        worldNodes.astra.preview
      ], { opacity: 0, x: 24, scale: 0.98 });

      const lines = gsap.utils.toArray('.platform-lines .line', root);
      gsap.set(lines, { scaleX: 0.85, opacity: 0.2 });

      const timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          id: 'platformJourneyPin',
          trigger: root,
          start: 'top top',
          end: '+=300%',
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            root.style.setProperty('--pj-progress', progress.toFixed(4));

            if (progress < 0.33) setWorld(root, worlds, 'ascentra');
            else if (progress < 0.66) setWorld(root, worlds, 'operis');
            else setWorld(root, worlds, 'astra');
          }
        }
      });

      const stageCount = 3;
      let stageIndex = 0;
      let wheelLocked = false;

      function stageToProgress(index) {
        if (stageCount <= 1) return 0;
        return index / (stageCount - 1);
      }

      function syncStageFromTrigger() {
        const trigger = ScrollTrigger.getById('platformJourneyPin');
        if (!trigger) return;
        const progress = Math.max(0, Math.min(1, trigger.progress || 0));
        stageIndex = Math.round(progress * (stageCount - 1));
      }

      function scrollToStage(nextStage) {
        const trigger = ScrollTrigger.getById('platformJourneyPin');
        if (!trigger || !trigger.isActive || wheelLocked) return;

        const clampedStage = Math.max(0, Math.min(stageCount - 1, nextStage));
        if (clampedStage === stageIndex) return;

        const distance = trigger.end - trigger.start;
        const targetProgress = stageToProgress(clampedStage);
        const targetY = trigger.start + distance * targetProgress;

        stageIndex = clampedStage;
        wheelLocked = true;

        window.scrollTo({ top: targetY, behavior: 'smooth' });

        window.setTimeout(() => {
          wheelLocked = false;
          syncStageFromTrigger();
        }, 520);
      }

      root.addEventListener('wheel', (event) => {
        const trigger = ScrollTrigger.getById('platformJourneyPin');
        if (!trigger || !trigger.isActive) return;
        if (Math.abs(event.deltaY) < 3) return;

        event.preventDefault();
        syncStageFromTrigger();
        const direction = event.deltaY > 0 ? 1 : -1;
        scrollToStage(stageIndex + direction);
      }, { passive: false });

      timeline
        .fromTo(worldNodes.ascentra.copy, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.12 }, 0)
        .fromTo(worldNodes.ascentra.preview, { opacity: 0, x: 24, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.12 }, 0)
        .to(lines, { scaleX: 1.0, opacity: 0.4, duration: 0.18 }, 0.06)

        .add(() => setWorld(root, worlds, 'operis'), 0.33)
        .to(worldNodes.ascentra.world, { opacity: 0, x: -30, duration: 0.14 }, 0.33)
        .to(worldNodes.ascentra.copy, { opacity: 0, y: -10, duration: 0.14 }, 0.33)
        .to(worldNodes.ascentra.preview, { opacity: 0, x: -10, scale: 0.985, duration: 0.14 }, 0.33)
        .to(worldNodes.operis.world, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.14 }, 0.36)
        .fromTo(worldNodes.operis.copy, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.14 }, 0.38)
        .fromTo(worldNodes.operis.preview, { opacity: 0, x: 24, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.14 }, 0.4)
        .to(lines, { scaleX: 1.15, opacity: 0.5, duration: 0.14 }, 0.45)

        .add(() => setWorld(root, worlds, 'astra'), 0.66)
        .to(worldNodes.ascentra.world, { opacity: 0, x: -34, duration: 0.1 }, 0.66)
        .to(worldNodes.operis.world, { opacity: 0, x: -28, duration: 0.14 }, 0.66)
        .to(worldNodes.operis.copy, { opacity: 0, y: -10, duration: 0.14 }, 0.66)
        .to(worldNodes.operis.preview, { opacity: 0, x: -10, scale: 0.985, duration: 0.14 }, 0.66)
        .to(worldNodes.astra.world, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.14 }, 0.7)
        .fromTo(worldNodes.astra.copy, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.14 }, 0.72)
        .fromTo(worldNodes.astra.preview, { opacity: 0, x: 24, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.14 }, 0.74)
        .to(lines, { scaleX: 1.25, opacity: 0.28, duration: 0.14 }, 0.86);

      window.setTimeout(() => {
        const trigger = ScrollTrigger.getById('platformJourneyPin');
        if (!trigger || !trigger.pin) {
          fallbackStack(root, new Error('ScrollTrigger pin not active'));
        }
      }, 1000);

      root.addEventListener('mousemove', (event) => {
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        const rect = stage.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
        gsap.to(active, { x: nx, y: ny, duration: 0.35, overwrite: true });
      });

      root.addEventListener('mouseleave', () => {
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        gsap.to(active, { x: 0, y: 0, duration: 0.4, overwrite: true });
      });

      if (!hasLoggedInit) {
        console.log('[PlatformJourney] timeline attached');
        hasLoggedInit = true;
      }
    } catch (error) {
      fallbackStack(root, error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
