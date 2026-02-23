(function initPlatformJourneyModule() {
  const reduceMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

  const worldCopy = {
    ascentra: {
      title: 'Ascentra',
      subtitle: 'Consulting intelligence and engineering orchestration for measurable execution.',
      bullets: [
        'Strategy and operating model alignment',
        'Mechanization and software architecture',
        'Execution governance with measurable outcomes'
      ],
      ctaLabel: 'Explore Ascentra',
      ctaHref: '/ascentra'
    },
    operis: {
      title: 'Operis',
      subtitle: 'Operational detachering with dashboard assistance and always-on Ascentra backup.',
      bullets: [
        'Shift orchestration with floor-level accountability',
        'Live control panels without implementation burden',
        'Performance uplift backed by Ascentra standards'
      ],
      ctaLabel: 'Explore Operis',
      ctaHref: '/operis'
    },
    astra: {
      title: 'Astra',
      subtitle: 'Autonomous cycle counting hardware and IP built for precise warehouse continuity.',
      bullets: [
        'Mission-based autonomous drone runs',
        'Coverage and battery telemetry in real time',
        'Future-ready infrastructure with measurable ROI'
      ],
      ctaLabel: 'Explore Astra',
      ctaHref: '/astra'
    }
  };

  function updateWorldState(container, nextWorld) {
    const title = container.querySelector('#journey-title');
    const subtitle = container.querySelector('#journey-subtitle');
    const bullets = container.querySelector('#journey-bullets');
    const cta = container.querySelector('#journey-cta');
    const previews = container.querySelectorAll('.journey-world');
    const world = worldCopy[nextWorld];

    if (!world || !title || !subtitle || !bullets || !cta) return;

    container.setAttribute('data-world', nextWorld);
    container.setAttribute('data-state', 'active');
    title.textContent = world.title;
    subtitle.textContent = world.subtitle;
    bullets.innerHTML = world.bullets.map((item) => `<li>${item}</li>`).join('');
    cta.textContent = world.ctaLabel;
    cta.setAttribute('href', world.ctaHref);
    cta.setAttribute('aria-label', world.ctaLabel);

    previews.forEach((preview) => {
      const isActive = preview.getAttribute('data-world') === nextWorld;
      preview.classList.toggle('is-active', isActive);
    });
  }

  function setupReducedMotion(container) {
    container.setAttribute('data-state', 'active');
    container.setAttribute('data-world', 'ascentra');

    const title = container.querySelector('#journey-title');
    const subtitle = container.querySelector('#journey-subtitle');
    const bullets = container.querySelector('#journey-bullets');
    const cta = container.querySelector('#journey-cta');

    if (!title || !subtitle || !bullets || !cta) return;

    title.textContent = 'Ascentra · Operis · Astra';
    subtitle.textContent = 'A calm 3-step overview of consultancy, operations and autonomy.';
    bullets.innerHTML = [
      'Ascentra: consulting + engineering orchestration',
      'Operis: operational detachering with dashboard support',
      'Astra: autonomous drones for cycle counting'
    ].map((item) => `<li>${item}</li>`).join('');

    cta.textContent = 'Explore Ascentra';
    cta.setAttribute('href', '/ascentra');
  }

  function initJourney() {
    const section = document.getElementById('platform-journey');
    const stage = document.getElementById('platform-journey-stage');
    const previews = document.getElementById('journey-previews');

    if (!section || !stage || !previews) return;

    if (reduceMotionMedia.matches || window.innerWidth < 760) {
      setupReducedMotion(section);
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      setupReducedMotion(section);
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const lines = gsap.utils.toArray('.platform-lines .line', section);
    const cards = gsap.utils.toArray('.app-window .panel-card, .app-window .shift-tile, .app-window .perf-badge, .app-window .astra-mission, .app-window .astra-stats span', section);

    gsap.set(lines, { scaleX: 0.8, opacity: 0.15 });
    gsap.set(cards, { y: 8, opacity: 0.8 });

    updateWorldState(section, 'ascentra');
    section.setAttribute('data-state', 'entry');

    const timeline = gsap.timeline({
      defaults: { ease: 'power2.inOut' },
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=300%',
        scrub: 0.8,
        pin: stage,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const p = self.progress;
          if (p < 0.15) {
            section.setAttribute('data-state', 'entry');
          } else {
            section.setAttribute('data-state', 'active');
          }

          if (p >= 0.88) updateWorldState(section, 'astra');
          else if (p >= 0.55) updateWorldState(section, 'operis');
          else updateWorldState(section, 'ascentra');
        }
      }
    });

    timeline
      .to(lines, { scaleX: 1, opacity: 0.4, duration: 0.15 }, 0.02)
      .to('.journey-copy', { y: -4, duration: 0.16 }, 0.15)
      .to(cards, { y: 0, opacity: 1, stagger: 0.02, duration: 0.18 }, 0.2)
      .to('.journey-previews', { y: -8, duration: 0.1 }, 0.46)
      .to(lines, { scaleX: 1.15, opacity: 0.5, duration: 0.1 }, 0.48)
      .to('.journey-previews', { y: -2, duration: 0.1 }, 0.6)
      .to(lines, { scaleX: 1.28, opacity: 0.34, duration: 0.1 }, 0.82)
      .to('.journey-previews', { y: 0, duration: 0.1 }, 0.88);

    section.addEventListener('mousemove', (event) => {
      const rect = stage.getBoundingClientRect();
      const rx = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
      const ry = ((event.clientY - rect.top) / rect.height - 0.5) * 10;

      gsap.to('.journey-copy', { x: rx * -0.35, y: ry * -0.2, duration: 0.4, overwrite: true });
      gsap.to('.journey-previews', { x: rx * 0.5, y: ry * 0.35, duration: 0.5, overwrite: true });
    });

    section.addEventListener('mouseleave', () => {
      gsap.to(['.journey-copy', '.journey-previews'], { x: 0, y: 0, duration: 0.5, overwrite: true });
    });
  }

  window.addEventListener('DOMContentLoaded', initJourney);
})();
