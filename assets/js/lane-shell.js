(function initLaneShell() {
  const laneIds = ['home', 'pyramid', 'ascentra', 'operis', 'astra'];
  const lanePathMap = {
    home: '/',
    pyramid: '/hub',
    ascentra: '/ascentra',
    operis: '/operis',
    astra: '/astra'
  };
  const pathLaneMap = {
    '/': 'home',
    '/hub': 'pyramid',
    '/ascentra': 'ascentra',
    '/operis': 'operis',
    '/astra': 'astra'
  };

  const shell = document.getElementById('lane-shell');
  const track = document.getElementById('lane-track');
  const backButton = document.getElementById('lane-back');
  const dotButtons = Array.from(document.querySelectorAll('[data-lane-dot]'));
  const laneSections = new Map(laneIds.map((id) => [id, document.querySelector(`[data-lane-id="${id}"]`)]));
  const laneScrolls = new Map(Array.from(document.querySelectorAll('[data-lane-scroll]')).map((node) => [node.getAttribute('data-lane-scroll'), node]));

  if (!shell || !track) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const laneScrollTop = new Map();
  const laneHistory = [];

  let activeLane = 'home';
  let lastTrigger = null;
  let wheelLock = false;

  function getLaneFromUrl() {
    const queryLane = new URLSearchParams(window.location.search).get('lane');
    if (queryLane && laneIds.includes(queryLane)) return queryLane;

    const normalizedPath = window.location.pathname.replace(/\/$/, '') || '/';
    return pathLaneMap[normalizedPath] || 'home';
  }

  function getDuration(phase) {
    if (prefersReducedMotion) return 20;
    if (phase === 'engage') return 140;
    if (phase === 'settle') return 150;
    return 760;
  }

  function updateDotState(lane) {
    dotButtons.forEach((button) => {
      const isActive = button.getAttribute('data-lane-dot') === lane;
      button.setAttribute('aria-current', isActive ? 'true' : 'false');
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  function setInertState(activeId) {
    laneIds.forEach((laneId) => {
      const section = laneSections.get(laneId);
      if (!section) return;
      const isActive = laneId === activeId;
      section.toggleAttribute('inert', !isActive);
      section.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    });
  }

  function restoreScroll(lane) {
    const scrollNode = laneScrolls.get(lane);
    if (!scrollNode) return;
    const top = laneScrollTop.get(lane);
    if (typeof top === 'number') {
      scrollNode.scrollTop = top;
    }
  }

  function storeScroll(lane) {
    const scrollNode = laneScrolls.get(lane);
    if (!scrollNode) return;
    laneScrollTop.set(lane, scrollNode.scrollTop);
  }

  function focusLaneTitle(lane) {
    const title = document.querySelector(`[data-lane-title="${lane}"]`);
    if (title) {
      title.focus({ preventScroll: true });
    }
  }

  function updateHistory(lane, mode) {
    const path = lanePathMap[lane] || '/';
    const state = { lane };

    if (mode === 'replace') {
      window.history.replaceState(state, '', path);
      return;
    }

    if (mode === 'push') {
      window.history.pushState(state, '', path);
    }
  }

  function goToLane(targetLane, options = {}) {
    const { cinematic = true, trigger = null, historyMode = 'push', fromPop = false } = options;
    if (!laneIds.includes(targetLane) || targetLane === activeLane) return;

    if (trigger instanceof HTMLElement) {
      lastTrigger = trigger;
    }

    storeScroll(activeLane);

    if (!fromPop) {
      laneHistory.push(activeLane);
      if (laneHistory.length > 24) {
        laneHistory.shift();
      }
    }

    const targetIndex = laneIds.indexOf(targetLane);
    shell.style.setProperty('--lane-index', `${targetIndex}`);

    shell.classList.remove('is-engaging', 'is-traveling', 'is-settling');

    const performSettle = () => {
      shell.classList.add('is-settling');
      window.setTimeout(() => {
        shell.classList.remove('is-settling');
      }, getDuration('settle'));
    };

    if (cinematic && !prefersReducedMotion) {
      shell.classList.add('is-engaging');
      window.setTimeout(() => {
        shell.classList.remove('is-engaging');
        shell.classList.add('is-traveling');
      }, getDuration('engage'));

      window.setTimeout(() => {
        shell.classList.remove('is-traveling');
        performSettle();
      }, getDuration('engage') + getDuration('travel'));
    }

    if (historyMode === 'push' || historyMode === 'replace') {
      updateHistory(targetLane, historyMode);
    }

    activeLane = targetLane;
    shell.setAttribute('data-active-lane', targetLane);
    setInertState(targetLane);
    updateDotState(targetLane);

    window.setTimeout(() => {
      restoreScroll(targetLane);
      focusLaneTitle(targetLane);
      if (targetLane === 'home' && lastTrigger && document.contains(lastTrigger)) {
        lastTrigger.focus({ preventScroll: true });
      }
    }, prefersReducedMotion ? 20 : 120);
  }

  function moveRelative(delta, trigger) {
    const currentIndex = laneIds.indexOf(activeLane);
    const nextIndex = Math.max(0, Math.min(laneIds.length - 1, currentIndex + delta));
    if (nextIndex === currentIndex) return;
    goToLane(laneIds[nextIndex], { cinematic: true, trigger, historyMode: 'push' });
  }

  function handlePopState(event) {
    const lane = event.state && laneIds.includes(event.state.lane) ? event.state.lane : getLaneFromUrl();
    goToLane(lane, { cinematic: true, historyMode: 'none', fromPop: true });
  }

  function handleBackIntent() {
    if (activeLane === 'operis' || activeLane === 'astra') {
      goToLane('ascentra', { cinematic: true, historyMode: 'push' });
      return;
    }

    const previous = laneHistory.pop();
    if (previous && laneIds.includes(previous) && previous !== activeLane) {
      goToLane(previous, { cinematic: true, historyMode: 'push' });
      return;
    }

    moveRelative(-1, backButton);
  }

  function bindTriggers() {
    document.querySelectorAll('[data-goto-lane]').forEach((node) => {
      const lane = node.getAttribute('data-goto-lane');
      if (!laneIds.includes(lane)) return;

      node.addEventListener('click', () => {
        goToLane(lane, { cinematic: true, trigger: node, historyMode: 'push' });
      });
    });

    dotButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const lane = button.getAttribute('data-lane-dot');
        if (!lane) return;
        goToLane(lane, { cinematic: true, trigger: button, historyMode: 'push' });
      });
    });

    if (backButton) {
      backButton.addEventListener('click', handleBackIntent);
    }
  }

  function bindInputShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleBackIntent();
      }
    });

    window.addEventListener('wheel', (event) => {
      if (!event.shiftKey) return;
      if (wheelLock) return;

      const primaryDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (Math.abs(primaryDelta) < 20) return;

      event.preventDefault();
      wheelLock = true;
      moveRelative(primaryDelta > 0 ? 1 : -1, null);
      window.setTimeout(() => {
        wheelLock = false;
      }, 280);
    }, { passive: false });

    let touchStartX = 0;
    let touchStartY = 0;

    track.addEventListener('touchstart', (event) => {
      const t = event.changedTouches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    }, { passive: true });

    track.addEventListener('touchend', (event) => {
      const t = event.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;

      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      moveRelative(dx < 0 ? 1 : -1, null);
    }, { passive: true });
  }

  function interceptLegacyLinks() {
    document.addEventListener('click', (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href') || '';
      const lane = href === '/' ? 'home' : pathLaneMap[href.replace(/\/$/, '')] || null;
      if (!lane) return;

      event.preventDefault();
      goToLane(lane, { cinematic: true, trigger: link, historyMode: 'push' });
    });
  }

  function init() {
    bindTriggers();
    bindInputShortcuts();
    interceptLegacyLinks();

    const initialLane = getLaneFromUrl();
    const initialIndex = laneIds.indexOf(initialLane);
    shell.style.setProperty('--lane-index', `${Math.max(0, initialIndex)}`);

    activeLane = initialLane;
    shell.setAttribute('data-active-lane', initialLane);
    setInertState(initialLane);
    updateDotState(initialLane);
    updateHistory(initialLane, 'replace');
    restoreScroll(initialLane);

    window.setTimeout(() => {
      focusLaneTitle(initialLane);
    }, 40);

    window.addEventListener('popstate', handlePopState);
  }

  init();
})();
