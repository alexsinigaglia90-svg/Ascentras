(function initPlatformJourney() {
  function ensureDebugBadge(root) {
    let badge = root.querySelector('.pj-build-indicator');
    if (badge) return badge;
    badge = document.createElement('div');
    badge.className = 'pj-build-indicator';
    badge.setAttribute('aria-label', 'Platform Journey status');
    badge.textContent = 'PJ: booting';
    root.appendChild(badge);
    return badge;
  }

  function setDebug(badge, mode, world) {
    badge.textContent = world ? `${mode} | world: ${world}` : mode;
  }

  function enableFallback(root, stage, worlds, badge, reason, error) {
    if (error) {
      console.error('[PlatformJourney] fallback:', error);
    }

    const trigger = window.ScrollTrigger && window.ScrollTrigger.getById('platformJourneyPin');
    if (trigger) trigger.kill(true);

    root.classList.add('pj-fallback');
    root.setAttribute('data-world', 'ascentra');
    setDebug(badge, `PJ: fallback (${reason})`, 'ascentra');

    if (stage) {
      stage.style.position = 'relative';
      stage.style.transform = 'none';
      stage.style.top = 'auto';
      stage.style.left = 'auto';
    }

    worlds.forEach((world) => {
      world.classList.add('is-active');
      world.style.position = 'static';
      world.style.opacity = '1';
      world.style.transform = 'none';
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

  function applyWorld(root, worlds, badge, key) {
    root.setAttribute('data-world', key);
    setDebug(badge, 'PJ: animated', key);

    worlds.forEach((world) => {
      const isActive = world.dataset.world === key;
      world.classList.toggle('is-active', isActive);
      world.style.pointerEvents = isActive ? 'auto' : 'none';
    });
  }

  function init() {
    const root = document.querySelector('#platform-journey');
    if (!root) return;

    const badge = ensureDebugBadge(root);
    const stage = root.querySelector('.pj-stage');
    const worlds = [...root.querySelectorAll('.pj-world')];

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      enableFallback(root, stage, worlds, badge, 'reduced motion');
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      enableFallback(root, stage, worlds, badge, 'gsap missing');
      return;
    }

    if (!stage || worlds.length !== 3) {
      enableFallback(root, stage, worlds, badge, 'missing elements');
      return;
    }

    try {
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      root.classList.remove('pj-fallback');
      gsap.registerPlugin(ScrollTrigger);

      const worldByKey = {
        ascentra: worlds.find((world) => world.dataset.world === 'ascentra'),
        operis: worlds.find((world) => world.dataset.world === 'operis'),
        astra: worlds.find((world) => world.dataset.world === 'astra')
      };

      if (!worldByKey.ascentra || !worldByKey.operis || !worldByKey.astra) {
        enableFallback(root, stage, worlds, badge, 'missing elements');
        return;
      }

      const ascentraCopy = worldByKey.ascentra.querySelector('.pj-copy');
      const ascentraPreview = worldByKey.ascentra.querySelector('.pj-preview');
      const operisCopy = worldByKey.operis.querySelector('.pj-copy');
      const operisPreview = worldByKey.operis.querySelector('.pj-preview');
      const astraCopy = worldByKey.astra.querySelector('.pj-copy');
      const astraPreview = worldByKey.astra.querySelector('.pj-preview');

      if (!ascentraCopy || !ascentraPreview || !operisCopy || !operisPreview || !astraCopy || !astraPreview) {
        enableFallback(root, stage, worlds, badge, 'missing elements');
        return;
      }

      gsap.set(worlds, { opacity: 0, y: 12, pointerEvents: 'none' });
      gsap.set(worldByKey.ascentra, { opacity: 1, y: 0, pointerEvents: 'auto' });
      gsap.set(ascentraCopy, { opacity: 1, y: 0 });
      gsap.set(ascentraPreview, { opacity: 1, x: 0, scale: 1 });
      gsap.set([operisCopy, astraCopy], { opacity: 0, y: 12 });
      gsap.set([operisPreview, astraPreview], { opacity: 0, x: 20, scale: 0.98 });

      applyWorld(root, worlds, badge, 'ascentra');

      const timeline = gsap.timeline({ defaults: { ease: 'power2.inOut' } });

      timeline
        .fromTo(ascentraPreview, { opacity: 0, x: 24, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.16 }, 0)
        .to(worldByKey.ascentra, { opacity: 0.08, y: -8, duration: 0.18 }, 0.33)
        .to(ascentraCopy, { opacity: 0, y: -12, duration: 0.18 }, 0.33)
        .to(ascentraPreview, { opacity: 0, x: -12, duration: 0.18 }, 0.33)
        .to(worldByKey.operis, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.18 }, 0.35)
        .fromTo(operisCopy, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.18 }, 0.36)
        .fromTo(operisPreview, { opacity: 0, x: 20, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.18 }, 0.38)
        .to(worldByKey.operis, { opacity: 0.08, y: -8, duration: 0.2 }, 0.66)
        .to(operisCopy, { opacity: 0, y: -12, duration: 0.2 }, 0.66)
        .to(operisPreview, { opacity: 0, x: -12, duration: 0.2 }, 0.66)
        .to(worldByKey.astra, { opacity: 1, y: 0, pointerEvents: 'auto', duration: 0.2 }, 0.69)
        .fromTo(astraCopy, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.2 }, 0.7)
        .fromTo(astraPreview, { opacity: 0, x: 20, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: 0.2 }, 0.72);

      ScrollTrigger.create({
        id: 'platformJourneyPin',
        trigger: root,
        start: 'top top',
        end: '+=300%',
        scrub: 1,
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        markers: true,
        animation: timeline,
        onUpdate: (self) => {
          const progress = self.progress;
          root.style.setProperty('--pj-progress', progress.toFixed(4));
          if (progress < 0.33) applyWorld(root, worlds, badge, 'ascentra');
          else if (progress < 0.66) applyWorld(root, worlds, badge, 'operis');
          else applyWorld(root, worlds, badge, 'astra');
        }
      });

      if (!hasLoggedInit) {
        console.log('[PlatformJourney] attached');
        hasLoggedInit = true;
      }
      setDebug(badge, 'PJ: animated', 'ascentra');
    } catch (error) {
      enableFallback(root, stage, worlds, badge, 'init error', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
