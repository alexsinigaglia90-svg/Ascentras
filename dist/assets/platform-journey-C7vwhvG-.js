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

  function initGuidanceConsole(root) {
    const consoleRoot = root.querySelector('[data-pj-guidance]');
    if (!consoleRoot) return;

    const tabs = Array.from(consoleRoot.querySelectorAll('.pj-guidance-tab'));
    const panel = consoleRoot.querySelector('#pj-guidance-panel');
    const step = consoleRoot.querySelector('#pj-guidance-step');
    const title = consoleRoot.querySelector('#pj-guidance-title');
    const copy = consoleRoot.querySelector('#pj-guidance-copy');
    const list = consoleRoot.querySelector('#pj-guidance-list');
    const link = consoleRoot.querySelector('#pj-guidance-link');
    const metrics = consoleRoot.querySelector('#pj-guidance-metrics');

    if (!tabs.length || !panel || !step || !title || !copy || !list || !link || !metrics) return;

    const content = {
      ascentra: {
        step: '01 · Consultancy Layer',
        title: 'Supply Chain Consultancy',
        copy: 'Van strategie naar uitvoerbaar operating model met heldere governance en tastbare resultaten.',
        points: [
          'Boardroom-to-floor alignment op targets en verantwoordelijkheden',
          'Proces- en netwerkontwerp met uitvoerbaarheid als uitgangspunt',
          'Programmasturing met meetbare executiekwaliteit'
        ],
        cta: 'Ontdek Ascentra',
        href: '/ascentra/',
        metricSet: [
          { label: 'Model Clarity 94', value: '94%' },
          { label: 'Lead Time -27%', value: '73%' },
          { label: 'Program Confidence 9.4/10', value: '94%' }
        ]
      },
      operis: {
        step: '02 · Operations Layer',
        title: 'Warehousing & Logistics Operations',
        copy: 'Operis levert operationele rust op de vloer met directe sturing op capaciteit, flow en betrouwbaarheid.',
        points: [
          'Realtime ritme op shifts, zones en stationbezetting',
          'Snelle interventies op bottlenecks en SLA-risico\'s',
          'Transparante performance voor management en teams'
        ],
        cta: 'Ontdek Operis',
        href: '/operis/',
        metricSet: [
          { label: 'Throughput Stability 96.8%', value: '97%' },
          { label: 'Flow Variance -19%', value: '81%' },
          { label: 'SLA Reliability 99.1%', value: '99%' }
        ]
      },
      astra: {
        step: '03 · Engineering Layer',
        title: 'Hard- & Software Development',
        copy: 'Astra bouwt de technische ruggengraat voor slimme warehouses: van industrial devices tot integrale softwarelagen.',
        points: [
          'Industrial hardware en embedded control in productieomgevingen',
          'Software architectuur voor data, besturing en integratie',
          'Schaalbare implementatie met focus op continuïteit en ROI'
        ],
        cta: 'Ontdek Astra',
        href: '/astra/',
        metricSet: [
          { label: 'Deployment Confidence 93%', value: '93%' },
          { label: 'Integration Speed +31%', value: '82%' },
          { label: 'Automation Readiness 9.2/10', value: '92%' }
        ]
      }
    };

    let activeKey = 'ascentra';

    function render(nextKey) {
      const safeKey = content[nextKey] ? nextKey : 'ascentra';
      const item = content[safeKey];
      activeKey = safeKey;

      panel.classList.add('is-updating');

      tabs.forEach((tab) => {
        const selected = tab.getAttribute('data-guidance-key') === safeKey;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
      });

      step.textContent = item.step;
      title.textContent = item.title;
      copy.textContent = item.copy;
      list.innerHTML = item.points.map((entry) => `<li>${entry}</li>`).join('');
      link.textContent = item.cta;
      link.setAttribute('href', item.href);
      metrics.innerHTML = item.metricSet.map((entry) => `
        <span class="pj-guidance-metric">${entry.label}<i style="--metric-value:${entry.value}"></i></span>
      `).join('');

      window.setTimeout(() => {
        panel.classList.remove('is-updating');
      }, 180);
    }

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const key = tab.getAttribute('data-guidance-key');
        if (!key) return;
        render(key);
      });

      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();

        const currentIndex = tabs.findIndex((node) => node.getAttribute('data-guidance-key') === activeKey);
        const stepDir = event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = (currentIndex + stepDir + tabs.length) % tabs.length;
        const nextTab = tabs[nextIndex];
        const nextKey = nextTab.getAttribute('data-guidance-key');
        if (!nextKey) return;

        render(nextKey);
        nextTab.focus({ preventScroll: true });
      });
    });

    render(activeKey);
  }

  function initOperisRoleAtlas(root) {
    const atlas = root.querySelector('[data-operis-role-atlas]');
    if (!atlas) return;

    const clusterButtons = Array.from(atlas.querySelectorAll('.operis-role-cluster'));
    const step = atlas.querySelector('#operis-role-step');
    const title = atlas.querySelector('#operis-role-title');
    const copy = atlas.querySelector('#operis-role-copy');
    const orbit = atlas.querySelector('#operis-role-orbit');
    const count = atlas.querySelector('#operis-role-count');
    const shuffle = atlas.querySelector('#operis-role-shuffle');

    if (!clusterButtons.length || !step || !title || !copy || !orbit || !count || !shuffle) return;

    const clusterLabel = {
      ops: 'Floor & Equipment',
      control: 'Control & Systems',
      planning: 'Planning & Leadership'
    };

    const roleData = {
      ops: [
        { name: 'Team Lead Warehouse', copy: 'Stuurt het team op dagritme, safety, kwaliteit en output, met directe vertaling van target naar vloeractie.' },
        { name: 'Supervisor Warehouse', copy: 'Borgt procesdiscipline op de vloer en schakelt direct op afwijkingen in capaciteit of doorlooptijd.' },
        { name: 'Shift Leader', copy: 'Houdt iedere shift strak op planning met focus op productiviteit, veiligheid en voorspelbaarheid.' },
        { name: 'Operator', copy: 'Zorgt voor stabiele uitvoer op kritieke operationele activiteiten binnen het warehouseproces.' },
        { name: 'VNA Driver', copy: 'Levert precisie in hoogbouw en versnelt interne verplaatsingen met veiligheid als standaard.' },
        { name: 'Quality Control', copy: 'Waarborgt uitvoerkwaliteit en reduceert herstelwerk door gerichte kwaliteitscontrole.' },
        { name: 'Training & Warehouse Onboard Specialist', copy: 'Verhoogt instroomsnelheid en performance via gestructureerde onboarding op de werkvloer.' }
      ],
      control: [
        { name: 'Control Room Manager', copy: 'Stuurt realtime operatie vanuit de control room en maakt direct impact op flow en uptime.' },
        { name: 'Control Room Operator', copy: 'Monitort kritieke signalen en initieert snelle acties om verstoringen te voorkomen.' },
        { name: 'Process Controller', copy: 'Beheert processtabiliteit over zones heen en vertaalt data naar directe operationele beslissingen.' },
        { name: 'WMS Controller', copy: 'Borgt WMS-procesintegriteit en bewaakt de digitale control laag van de operatie.' },
        { name: 'WMS Specialist', copy: 'Optimaliseert systeeminrichting en haalt structurele efficiëntie uit het WMS-landschap.' },
        { name: 'Function Analyst', copy: 'Verbindt operatie en systeemlogica in schaalbare functionele oplossingen.' },
        { name: 'Inventory Controller', copy: 'Houdt voorraadnauwkeurigheid hoog en voorkomt operationele frictie in replenishment.' },
        { name: 'Stock Controller', copy: 'Stuurt op voorraadbalans en beschikbaarheid met focus op service en betrouwbaarheid.' },
        { name: 'Slotting Specialist', copy: 'Ontwerpt slotting logica die loopafstanden verlaagt en picksnelheid verhoogt.' },
        { name: 'CI-Engineer', copy: 'Verankert continu verbeteren in dagelijkse operatie met meetbare verbetercycli.' }
      ],
      planning: [
        { name: 'Transport Planner', copy: 'Orkestreert inbound en outbound planning voor maximale leverbetrouwbaarheid.' },
        { name: 'Workforce Planner', copy: 'Verbindt capaciteitsvraag met bezettingsplan voor stabiele operationele prestaties.' },
        { name: 'Capacity Planner', copy: 'Bouwt scenario\'s die pieken beheersbaar maken en bottlenecks voorspelbaar oplossen.' },
        { name: 'Production Planner', copy: 'Synchroniseert productie-output met warehouse-capaciteit voor end-to-end flow.' },
        { name: 'Warehouse Manager', copy: 'Leidt volledige warehouse-executie met verantwoordelijkheid op resultaat, team en proces.' },
        { name: 'Manager Logistics', copy: 'Stuurt logistieke ketenprestatie op kosten, service en schaalbaarheid.' },
        { name: 'Operations Manager', copy: 'Levert operationeel leiderschap over meerdere teams, processen en prestatiedoelen.' },
        { name: 'Site Manager', copy: 'Draagt end-to-end verantwoordelijkheid voor performance, veiligheid en continuïteit op site-niveau.' },
        { name: 'Fulfillment Manager', copy: 'Optimaliseert orderafhandeling over pieken en kanalen met consistente servicelevels.' },
        { name: 'Manager Operational Excellence', copy: 'Borgt structurele prestatieverbetering met governance, standaarden en KPI-sturing.' }
      ]
    };

    const orbitPoints = [
      { x: '18%', y: '18%' },
      { x: '50%', y: '14%' },
      { x: '82%', y: '20%' },
      { x: '24%', y: '44%' },
      { x: '72%', y: '42%' },
      { x: '14%', y: '72%' },
      { x: '44%', y: '78%' },
      { x: '78%', y: '74%' },
      { x: '60%', y: '58%' }
    ];

    let activeCluster = 'ops';
    let spotlightIndex = 0;
    let orbitOffset = 0;
    let autoTimer = null;

    function renderOrbit(items) {
      const visible = items.slice(0, Math.min(items.length, orbitPoints.length));
      orbit.innerHTML = visible.map((item, index) => {
        const point = orbitPoints[(index + orbitOffset) % orbitPoints.length];
        const active = index === spotlightIndex ? ' is-active' : '';
        return `<span class="operis-role-chip${active}" style="--x:${point.x};--y:${point.y};--delay:${(index * 0.18).toFixed(2)}s">${item.name}</span>`;
      }).join('');
    }

    function renderCluster(clusterKey) {
      const safeCluster = roleData[clusterKey] ? clusterKey : 'ops';
      activeCluster = safeCluster;

      const items = roleData[safeCluster];
      if (!items.length) return;

      if (spotlightIndex >= items.length) spotlightIndex = 0;

      const current = items[spotlightIndex];
      step.textContent = `Cluster · ${clusterLabel[safeCluster]}`;
      title.textContent = current.name;
      copy.textContent = current.copy;
      count.textContent = `${Object.values(roleData).reduce((sum, list) => sum + list.length, 0)} specialistische profielen beschikbaar`;

      clusterButtons.forEach((button) => {
        const selected = button.getAttribute('data-role-cluster') === safeCluster;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-selected', selected ? 'true' : 'false');
        button.tabIndex = selected ? 0 : -1;
      });

      renderOrbit(items);
    }

    function nextSpotlight() {
      const items = roleData[activeCluster] || [];
      if (!items.length) return;
      spotlightIndex = (spotlightIndex + 1) % items.length;
      orbitOffset = (orbitOffset + 1) % orbitPoints.length;
      renderCluster(activeCluster);
    }

    function restartAutoPlay() {
      if (autoTimer) {
        window.clearInterval(autoTimer);
      }
      autoTimer = window.setInterval(nextSpotlight, 4200);
    }

    clusterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const clusterKey = button.getAttribute('data-role-cluster');
        spotlightIndex = 0;
        orbitOffset = 0;
        renderCluster(clusterKey || 'ops');
        restartAutoPlay();
      });
    });

    shuffle.addEventListener('click', () => {
      const items = roleData[activeCluster] || [];
      if (!items.length) return;
      spotlightIndex = Math.floor(Math.random() * items.length);
      orbitOffset = (orbitOffset + 2) % orbitPoints.length;
      renderCluster(activeCluster);
      restartAutoPlay();
    });

    renderCluster(activeCluster);
    restartAutoPlay();
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
    const laneNavigatorFactory = window.AscentraLaneNavigator && window.AscentraLaneNavigator.createLaneNavigator;

    try {
      root.classList.add('pj-enhanced');
      setWorld(root, worlds, 'ascentra');
      initGuidanceConsole(root);
      initOperisRoleAtlas(root);
      window.requestAnimationFrame(() => {
        root.classList.add('pj-cinematic-ready');
        setRuntimeState(root, 'cinematic');
      });

      const laneNavigator = typeof laneNavigatorFactory === 'function'
        ? laneNavigatorFactory(root)
        : null;

      if (laneNavigator) {
        setRuntimeState(root, 'cinematic', 'lanes-ready');
      }

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
        if (root.dataset.lane && root.dataset.lane !== 'center') return;
        const active = root.querySelector('.pj-world.is-active .pj-preview');
        if (!active) return;
        const rect = stage.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - 0.5) * 14;
        const ny = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
        gsap.to(active, { x: nx, y: ny, duration: 0.24, overwrite: true, ease: 'power3.out' });
      });

      root.addEventListener('mouseleave', () => {
        if (!gsap || prefersReducedMotion) return;
        if (root.dataset.lane && root.dataset.lane !== 'center') return;
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
