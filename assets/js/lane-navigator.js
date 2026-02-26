(function initLaneNavigatorModule() {
  const LANE_STATE_KEY = 'pjLane';
  const LANE_HASH_PREFIX = '#lane-';

  function toLaneFromHash(hash) {
    if (!hash || !hash.startsWith(LANE_HASH_PREFIX)) return 'center';
    const lane = hash.slice(LANE_HASH_PREFIX.length);
    return lane === 'operis' || lane === 'astra' ? lane : 'center';
  }

  function hashForLane(lane) {
    return lane === 'center' ? '' : `${LANE_HASH_PREFIX}${lane}`;
  }

  function createLaneNavigator(root) {
    if (!root) return null;

    const overlay = root.querySelector('#pj-lane-overlay');
    const triggerElements = Array.from(root.querySelectorAll('[data-lane-target]'));
    const closeElements = Array.from(root.querySelectorAll('[data-lane-close]'));
    const laneSections = {
      operis: root.querySelector('#pj-lane-operis'),
      astra: root.querySelector('#pj-lane-astra')
    };

    if (!overlay || !laneSections.operis || !laneSections.astra) {
      return null;
    }

    const laneTitles = {
      operis: root.querySelector('#pj-lane-operis-title'),
      astra: root.querySelector('#pj-lane-astra-title')
    };

    // Keep animation timing centralized so reduced-motion can short-circuit all cinematic movement.
    const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const transitionDurationMs = () => (reduceMotionQuery.matches ? 20 : 760);

    let activeLane = 'center';
    let restoreFocusElement = null;
    let animationTimer = null;
    let focusTimer = null;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeTracking = false;

    function clearTimers() {
      if (animationTimer) {
        window.clearTimeout(animationTimer);
        animationTimer = null;
      }
      if (focusTimer) {
        window.clearTimeout(focusTimer);
        focusTimer = null;
      }
    }

    function applyInertState(lane) {
      const operisIsActive = lane === 'operis';
      const astraIsActive = lane === 'astra';

      laneSections.operis.toggleAttribute('inert', !operisIsActive);
      laneSections.astra.toggleAttribute('inert', !astraIsActive);

      laneSections.operis.setAttribute('aria-hidden', operisIsActive ? 'false' : 'true');
      laneSections.astra.setAttribute('aria-hidden', astraIsActive ? 'false' : 'true');
    }

    function pushLaneState(lane) {
      const laneHash = hashForLane(lane);
      const nextUrl = `${window.location.pathname}${window.location.search}${laneHash}`;
      const currentState = window.history.state || {};
      const nextState = { ...currentState, [LANE_STATE_KEY]: lane };

      window.history.pushState(nextState, '', nextUrl);
    }

    function replaceCenterStateIfMissing() {
      const currentState = window.history.state || {};
      if (typeof currentState[LANE_STATE_KEY] === 'string') return;

      // Ensure browser Back always has a deterministic center-state anchor.
      const centerUrl = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({ ...currentState, [LANE_STATE_KEY]: 'center' }, '', centerUrl);
    }

    function focusLaneTitle(lane) {
      if (lane === 'center') return;
      const title = laneTitles[lane];
      if (!title) return;
      title.focus({ preventScroll: true });
    }

    function finalizeAnimation(lane) {
      root.classList.remove('pj-lane-animating');
      if (lane === 'center') {
        document.body.classList.remove('pj-lane-open');
        if (restoreFocusElement && document.contains(restoreFocusElement)) {
          restoreFocusElement.focus({ preventScroll: true });
        }
      } else {
        focusLaneTitle(lane);
      }
    }

    function setLane(lane, options = {}) {
      const { pushHistory = true, triggerElement = null } = options;
      if (lane !== 'center' && lane !== 'operis' && lane !== 'astra') return;
      if (lane === activeLane) return;

      clearTimers();

      if (lane !== 'center' && triggerElement instanceof HTMLElement) {
        restoreFocusElement = triggerElement;
      }

      activeLane = lane;
      root.dataset.lane = lane;
      root.classList.add('pj-lane-animating');

      if (lane === 'center') {
        applyInertState('center');
      } else {
        // Lock interaction to the active side lane while preserving center scroll position in the DOM.
        document.body.classList.add('pj-lane-open');
        applyInertState(lane);
      }

      if (pushHistory) {
        pushLaneState(lane);
      }

      animationTimer = window.setTimeout(() => {
        finalizeAnimation(lane);
      }, transitionDurationMs());

      focusTimer = window.setTimeout(() => {
        if (lane !== 'center') {
          focusLaneTitle(lane);
        }
      }, Math.min(240, transitionDurationMs()));
    }

    function closeLane() {
      if (activeLane === 'center') return;

      const stateLane = (window.history.state && window.history.state[LANE_STATE_KEY]) || null;
      if (stateLane === activeLane) {
        window.history.back();
      } else {
        setLane('center', { pushHistory: false });
      }
    }

    function onPopState() {
      const stateLane = window.history.state && window.history.state[LANE_STATE_KEY];
      const hashLane = toLaneFromHash(window.location.hash);
      const lane = stateLane === 'operis' || stateLane === 'astra' || stateLane === 'center' ? stateLane : hashLane;
      setLane(lane || 'center', { pushHistory: false });
    }

    function onKeyDown(event) {
      if (event.key === 'Escape' && activeLane !== 'center') {
        event.preventDefault();
        closeLane();
      }
    }

    function onSwipeStart(event) {
      if (activeLane === 'center') return;
      if (event.target && event.target.closest('button, a, input, textarea, select')) return;

      swipeTracking = true;
      swipeStartX = event.clientX;
      swipeStartY = event.clientY;
    }

    function onSwipeEnd(event) {
      if (!swipeTracking || activeLane === 'center') return;
      swipeTracking = false;

      const dx = event.clientX - swipeStartX;
      const dy = event.clientY - swipeStartY;
      const horizontalIntent = Math.abs(dx) > 72 && Math.abs(dx) > Math.abs(dy) * 1.2;

      if (!horizontalIntent) return;

      if ((activeLane === 'operis' && dx > 0) || (activeLane === 'astra' && dx < 0)) {
        closeLane();
      }
    }

    function bindEvents() {
      triggerElements.forEach((trigger) => {
        const targetLane = trigger.getAttribute('data-lane-target');
        if (targetLane !== 'operis' && targetLane !== 'astra') return;

        trigger.addEventListener('click', (event) => {
          event.preventDefault();
          setLane(targetLane, { pushHistory: true, triggerElement: trigger });
        });
      });

      closeElements.forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          closeLane();
        });
      });

      document.addEventListener('keydown', onKeyDown);
      window.addEventListener('popstate', onPopState);

      overlay.addEventListener('pointerdown', onSwipeStart, { passive: true });
      overlay.addEventListener('pointerup', onSwipeEnd, { passive: true });
      overlay.addEventListener('pointercancel', () => {
        swipeTracking = false;
      });
    }

    function init() {
      replaceCenterStateIfMissing();
      root.dataset.lane = 'center';
      applyInertState('center');
      bindEvents();

      const initialLane = toLaneFromHash(window.location.hash);
      if (initialLane !== 'center') {
        setLane(initialLane, { pushHistory: true });
      }
    }

    init();

    return {
      openLane(lane, triggerElement) {
        if (lane !== 'operis' && lane !== 'astra') return;
        setLane(lane, { pushHistory: true, triggerElement: triggerElement || null });
      },
      closeLane,
      getActiveLane() {
        return activeLane;
      }
    };
  }

  window.AscentraLaneNavigator = {
    createLaneNavigator
  };
})();
