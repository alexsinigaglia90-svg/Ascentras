(function initPlatformJourney() {
  let hasLoggedInit = false;

  function fallbackStack(root, reason) {
    if (reason) {
      console.error('[PlatformJourney] fallback:', reason);
    }

    root.classList.remove('pj-enhanced');
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
      root.classList.add('pj-enhanced');

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

      const lines = gsap.utils.toArray('.platform-lines .line', root);
      gsap.set(lines, { scaleX: 0.95, opacity: 0.26 });

      function applyWorldState(activeKey) {
        setWorld(root, worlds, activeKey);

        Object.entries(worldNodes).forEach(([key, node]) => {
          const isActive = key === activeKey;
          gsap.to(node.world, {
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 10,
            duration: 0.22,
            overwrite: true
          });
          gsap.to(node.copy, {
            opacity: isActive ? 1 : 0,
            y: isActive ? 0 : 12,
            duration: 0.22,
            overwrite: true
          });
          gsap.to(node.preview, {
            opacity: isActive ? 1 : 0,
            x: isActive ? 0 : 10,
            scale: isActive ? 1 : 0.99,
            duration: 0.22,
            overwrite: true
          });
          node.world.style.pointerEvents = isActive ? 'auto' : 'none';
        });
      }

      applyWorldState('ascentra');

      let currentStage = 'ascentra';

      ScrollTrigger.create({
        id: 'platformJourneyPin',
        trigger: root,
        start: 'top top',
        end: '+=220%',
        scrub: 0.9,
        pin: true,
        pinSpacing: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const progress = self.progress;
          root.style.setProperty('--pj-progress', progress.toFixed(4));

          const nextStage = progress < 0.34 ? 'ascentra' : (progress < 0.67 ? 'operis' : 'astra');
          if (nextStage !== currentStage) {
            currentStage = nextStage;
            applyWorldState(currentStage);
          }

          const lineScale = 0.95 + progress * 0.2;
          const lineOpacity = 0.26 + (1 - Math.abs(progress - 0.5) * 2) * 0.18;
          gsap.set(lines, { scaleX: lineScale, opacity: Math.max(0.2, lineOpacity) });
        }
      });

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
