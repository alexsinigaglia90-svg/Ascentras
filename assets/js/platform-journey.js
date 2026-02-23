(function initPlatformJourneyModule() {
  const reduceMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  const root = document.documentElement;
  let activeWorld = 'ascentra';
  let hasLoggedInit = false;

  const journeyI18n = {
    en: {
      sectionAria: 'Journey through Ascentra, Operis and Astra',
      worldPreviewAria: {
        ascentra: 'Ascentra web app preview',
        operis: 'Operis web app preview',
        astra: 'Astra web app preview'
      },
      kicker: 'Platform Journey',
      reduced: {
        title: 'Ascentra · Operis · Astra',
        subtitle: 'A calm 3-step overview of consultancy, operations and autonomy.',
        bullets: [
          'Ascentra: consulting + engineering orchestration',
          'Operis: operational detachering with dashboard support',
          'Astra: autonomous drones for cycle counting'
        ],
        ctaLabel: 'Explore Ascentra',
        ctaHref: '/ascentra'
      },
      worlds: {
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
      },
      preview: {
        preview_ascentra_head: 'Ascentra Orchestration',
        preview_ascentra_strategy: 'Strategy',
        preview_ascentra_mechanization: 'Mechanization',
        preview_ascentra_software: 'Software',
        preview_operis_head: 'Operis Operational Control',
        preview_operis_shift_a: 'Shift A · 21 staff',
        preview_operis_shift_b: 'Shift B · 19 staff',
        preview_operis_shift_c: 'Shift C · 17 staff',
        preview_operis_execution: 'Execution 97.8%',
        preview_operis_ribbon: 'Backed by Ascentra dashboard assist',
        preview_astra_head: 'Astra Mission Console',
        preview_astra_mission: 'Cycle Count Run · Zone D4',
        preview_astra_battery: 'Battery 84%',
        preview_astra_coverage: 'Coverage 92%',
        preview_astra_drone: 'Drone 06 · Active'
      }
    },
    nl: {
      sectionAria: 'Journey door Ascentra, Operis en Astra',
      worldPreviewAria: {
        ascentra: 'Ascentra webapp preview',
        operis: 'Operis webapp preview',
        astra: 'Astra webapp preview'
      },
      kicker: 'Platform Journey',
      reduced: {
        title: 'Ascentra · Operis · Astra',
        subtitle: 'Een rustige 3-stappen overview van consultancy, operatie en autonomie.',
        bullets: [
          'Ascentra: consultancy + engineering orchestration',
          'Operis: operationele detachering met dashboardondersteuning',
          'Astra: autonome drones voor cycle counting'
        ],
        ctaLabel: 'Ontdek Ascentra',
        ctaHref: '/ascentra'
      },
      worlds: {
        ascentra: {
          title: 'Ascentra',
          subtitle: 'Consultancy-intelligentie en engineering-orchestratie voor meetbare executie.',
          bullets: [
            'Strategie en operating model op één lijn',
            'Mechanisatie en softwarearchitectuur',
            'Executie-governance met meetbaar resultaat'
          ],
          ctaLabel: 'Ontdek Ascentra',
          ctaHref: '/ascentra'
        },
        operis: {
          title: 'Operis',
          subtitle: 'Operationele detachering met dashboardondersteuning en continue Ascentra-backup.',
          bullets: [
            'Shift-orkestratie met duidelijke floor-accountability',
            'Live control panels zonder implementatielast',
            'Prestatieverbetering volgens Ascentra-standaard'
          ],
          ctaLabel: 'Ontdek Operis',
          ctaHref: '/operis'
        },
        astra: {
          title: 'Astra',
          subtitle: 'Autonome cycle counting hardware en IP voor nauwkeurige warehouse-continuïteit.',
          bullets: [
            'Missiegestuurde autonome drone-runs',
            'Realtime dekking- en batterijtelemetrie',
            'Future-ready infrastructuur met meetbare ROI'
          ],
          ctaLabel: 'Ontdek Astra',
          ctaHref: '/astra'
        }
      },
      preview: {
        preview_ascentra_head: 'Ascentra Orchestratie',
        preview_ascentra_strategy: 'Strategie',
        preview_ascentra_mechanization: 'Mechanisatie',
        preview_ascentra_software: 'Software',
        preview_operis_head: 'Operis Operationele Controle',
        preview_operis_shift_a: 'Shift A · 21 medewerkers',
        preview_operis_shift_b: 'Shift B · 19 medewerkers',
        preview_operis_shift_c: 'Shift C · 17 medewerkers',
        preview_operis_execution: 'Executie 97,8%',
        preview_operis_ribbon: 'Ondersteund door Ascentra dashboard-assist',
        preview_astra_head: 'Astra Missieconsole',
        preview_astra_mission: 'Cycle Count Run · Zone D4',
        preview_astra_battery: 'Batterij 84%',
        preview_astra_coverage: 'Dekking 92%',
        preview_astra_drone: 'Drone 06 · Actief'
      }
    }
  };

  function getLang(explicitLang) {
    return explicitLang || root.getAttribute('data-lang') || localStorage.getItem('lang') || 'en';
  }

  function getCopy(lang) {
    return journeyI18n[lang] || journeyI18n.en;
  }

  function applyPreviewTranslations(container, lang) {
    const copy = getCopy(lang);
    const nodes = container.querySelectorAll('[data-journey-key]');
    nodes.forEach((node) => {
      const key = node.getAttribute('data-journey-key');
      if (!key || !copy.preview[key] && key !== 'kicker') return;
      if (key === 'kicker') {
        node.textContent = copy.kicker;
        return;
      }
      node.textContent = copy.preview[key];
    });

    container.setAttribute('aria-label', copy.sectionAria);
    container.querySelectorAll('.journey-world[data-world]').forEach((preview) => {
      const key = preview.getAttribute('data-world');
      if (!key) return;
      const label = copy.worldPreviewAria[key];
      if (label) preview.setAttribute('aria-label', label);
    });
  }

  function updateWorldState(container, nextWorld, explicitLang) {
    if (activeWorld === nextWorld && !explicitLang) return;

    const lang = getLang(explicitLang);
    const copy = getCopy(lang);
    const title = container.querySelector('#journey-title');
    const subtitle = container.querySelector('#journey-subtitle');
    const bullets = container.querySelector('#journey-bullets');
    const cta = container.querySelector('#journey-cta');
    const previews = container.querySelectorAll('.journey-world');
    const world = copy.worlds[nextWorld];

    if (!world || !title || !subtitle || !bullets || !cta) return;

    activeWorld = nextWorld;
    container.setAttribute('data-world', nextWorld);
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

  function setupReducedMotion(container, explicitLang) {
    const lang = getLang(explicitLang);
    const copy = getCopy(lang);

    container.setAttribute('data-state', 'active');
    container.setAttribute('data-world', 'ascentra');
    activeWorld = 'ascentra';

    const title = container.querySelector('#journey-title');
    const subtitle = container.querySelector('#journey-subtitle');
    const bullets = container.querySelector('#journey-bullets');
    const cta = container.querySelector('#journey-cta');

    if (!title || !subtitle || !bullets || !cta) return;

    title.textContent = copy.reduced.title;
    subtitle.textContent = copy.reduced.subtitle;
    bullets.innerHTML = copy.reduced.bullets.map((item) => `<li>${item}</li>`).join('');
    cta.textContent = copy.reduced.ctaLabel;
    cta.setAttribute('href', copy.reduced.ctaHref);
    cta.setAttribute('aria-label', copy.reduced.ctaLabel);

    applyPreviewTranslations(container, lang);
  }

  function forceVisibleFallback(container, error) {
    if (error) {
      console.error('[PlatformJourney] fallback:', error);
    }

    container.classList.add('journey-fallback');
    container.setAttribute('data-state', 'active');
    container.setAttribute('data-world', 'ascentra');

    const stage = container.querySelector('#platform-journey-stage');
    const previews = container.querySelector('#journey-previews');
    const worlds = container.querySelectorAll('.journey-world');

    if (stage) {
      stage.style.position = 'static';
      stage.style.height = 'auto';
      stage.style.minHeight = '0';
    }

    if (previews) {
      previews.style.display = 'block';
      previews.style.minHeight = '0';
    }

    worlds.forEach((world) => {
      world.classList.add('is-active');
      world.style.opacity = '1';
      world.style.transform = 'none';
      world.style.position = 'static';
      world.style.pointerEvents = 'auto';
    });
  }

  function setupLanguageBindings(section) {
    document.addEventListener('app:langchange', (event) => {
      const lang = event.detail && event.detail.lang ? event.detail.lang : getLang();
      applyPreviewTranslations(section, lang);

      if (section.classList.contains('journey-fallback')) {
        updateWorldState(section, 'ascentra', lang);
        forceVisibleFallback(section);
        return;
      }

      if (reduceMotionMedia.matches || window.innerWidth < 760) {
        setupReducedMotion(section, lang);
        return;
      }

      updateWorldState(section, activeWorld, lang);
    });
  }

  function initJourney() {
    const section = document.getElementById('platform-journey');
    const stage = document.getElementById('platform-journey-stage');
    const previews = document.getElementById('journey-previews');

    if (!section || !stage || !previews) return;

    setupLanguageBindings(section);

    applyPreviewTranslations(section, getLang());

    if (reduceMotionMedia.matches || window.innerWidth < 760) {
      setupReducedMotion(section);
      return;
    }

    try {
      if (!window.gsap || !window.ScrollTrigger) {
        throw new Error('GSAP/ScrollTrigger missing');
      }

      window.gsap.registerPlugin(window.ScrollTrigger);

      if (!hasLoggedInit) {
        console.log('[PlatformJourney] init ok');
        hasLoggedInit = true;
      }

      const lines = window.gsap.utils.toArray('.platform-lines .line', section);
      const cards = window.gsap.utils.toArray('.app-window .panel-card, .app-window .shift-tile, .app-window .perf-badge, .app-window .astra-mission, .app-window .astra-stats span', section);

      window.gsap.set(lines, { scaleX: 0.8, opacity: 0.15 });
      window.gsap.set(cards, { y: 8, opacity: 0.8 });

      updateWorldState(section, 'ascentra', getLang());
      section.setAttribute('data-state', 'entry');

      const timeline = window.gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
          id: 'platformJourneyPin',
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

      window.setTimeout(() => {
        if (section.classList.contains('journey-fallback')) return;

        const pinTrigger = window.ScrollTrigger.getById('platformJourneyPin');
        const hasPin = Boolean(pinTrigger && (pinTrigger.pin || (pinTrigger.vars && pinTrigger.vars.pin)));

        if (!hasPin) {
          forceVisibleFallback(section, new Error('ScrollTrigger pin guard: pin not active'));
        }
      }, 1000);

      section.addEventListener('mousemove', (event) => {
        const rect = stage.getBoundingClientRect();
        const rx = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
        const ry = ((event.clientY - rect.top) / rect.height - 0.5) * 10;

        window.gsap.to('.journey-copy', { x: rx * -0.35, y: ry * -0.2, duration: 0.4, overwrite: true });
        window.gsap.to('.journey-previews', { x: rx * 0.5, y: ry * 0.35, duration: 0.5, overwrite: true });
      });

      section.addEventListener('mouseleave', () => {
        window.gsap.to(['.journey-copy', '.journey-previews'], { x: 0, y: 0, duration: 0.5, overwrite: true });
      });
    } catch (error) {
      forceVisibleFallback(section, error);
    }
  }

  document.addEventListener('DOMContentLoaded', initJourney);
})();
