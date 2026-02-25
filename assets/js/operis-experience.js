(function initOperisExperience() {
  function markPageEntered() {
    document.body.classList.add('page-enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.body.classList.add('page-enter-active');
        document.body.classList.remove('page-enter');
      });
    });
  }

  function setupReveals() {
    const revealItems = document.querySelectorAll('.reveal');
    if (!revealItems.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

    revealItems.forEach((item) => observer.observe(item));
  }

  function setupRoleFilters() {
    const filterButtons = Array.from(document.querySelectorAll('[data-role-filter]'));
    const cards = Array.from(document.querySelectorAll('.role-card'));
    if (!filterButtons.length || !cards.length) return;

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-role-filter') || 'all';

        filterButtons.forEach((item) => item.classList.remove('active'));
        button.classList.add('active');

        cards.forEach((card) => {
          const role = card.getAttribute('data-role');
          const visible = filter === 'all' || filter === role;
          card.classList.toggle('hidden', !visible);
        });
      });
    });
  }

  function formatNumber(value) {
    return Math.round(value).toLocaleString();
  }

  function setupSimulator() {
    const teamSlider = document.getElementById('sim-team');
    const supportSlider = document.getElementById('sim-support');
    const teamLabel = document.getElementById('sim-team-value');
    const supportLabel = document.getElementById('sim-support-value');
    const throughputLabel = document.getElementById('sim-throughput');
    const efficiencyLabel = document.getElementById('sim-efficiency');
    const stabilityLabel = document.getElementById('sim-stability');
    const chartPath = document.getElementById('sim-path');

    if (!teamSlider || !supportSlider || !teamLabel || !supportLabel || !throughputLabel || !efficiencyLabel || !stabilityLabel || !chartPath) {
      return;
    }

    const supportText = {
      1: 'Level 1 · Basic onboarding',
      2: 'Level 2 · Weekly floor coaching',
      3: 'Level 3 · Embedded BI + weekly SC coaching',
      4: 'Level 4 · BI + SC war-room support',
      5: 'Level 5 · Full Operis + Ascentra command support'
    };

    function recalculate() {
      const teamSize = Number(teamSlider.value);
      const supportDepth = Number(supportSlider.value);

      const throughput = 780 + teamSize * 9.6 + supportDepth * 36;
      const efficiency = Math.min(99.4, 84.5 + supportDepth * 2.2 + teamSize * 0.04);
      const stability = Math.min(99.9, 76 + supportDepth * 4.8 + teamSize * 0.21);

      teamLabel.textContent = `${teamSize} people`;
      supportLabel.textContent = supportText[supportDepth] || supportText[3];

      throughputLabel.textContent = `${formatNumber(throughput)} / h`;
      efficiencyLabel.textContent = `${efficiency.toFixed(1)}%`;
      stabilityLabel.textContent = `${stability.toFixed(1)}`;

      const y1 = Math.max(20, 116 - teamSize * 0.52 - supportDepth * 3.4);
      const y2 = Math.max(16, 96 - teamSize * 0.38 - supportDepth * 3);
      const y3 = Math.max(12, 76 - teamSize * 0.28 - supportDepth * 2.6);
      const y4 = Math.max(10, 58 - teamSize * 0.2 - supportDepth * 2.1);
      const y5 = Math.max(8, 42 - teamSize * 0.12 - supportDepth * 1.8);

      chartPath.setAttribute('d', `M0 ${y1.toFixed(1)} C38 ${(y1 - 8).toFixed(1)}, 72 ${(y2 + 4).toFixed(1)}, 102 ${y2.toFixed(1)} C146 ${(y2 - 10).toFixed(1)}, 184 ${(y3 + 2).toFixed(1)}, 218 ${y3.toFixed(1)} C264 ${(y3 - 11).toFixed(1)}, 304 ${(y4 + 2).toFixed(1)}, 340 ${y4.toFixed(1)} C372 ${(y4 - 8).toFixed(1)}, 396 ${(y5 + 2).toFixed(1)}, 420 ${y5.toFixed(1)}`);
    }

    teamSlider.addEventListener('input', recalculate);
    supportSlider.addEventListener('input', recalculate);
    recalculate();
  }

  function setupCounters() {
    const counters = Array.from(document.querySelectorAll('[data-counter]'));
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = entry.target;
        const goal = Number(target.getAttribute('data-counter'));
        const isDays = target.textContent.includes('days');
        const suffix = target.textContent.includes('%') ? '%' : isDays ? ' days' : '+';

        const start = performance.now();
        const duration = 960;

        function tick(now) {
          const progress = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - progress, 3);
          const value = goal * eased;

          if (goal >= 1000) target.textContent = `${Math.round(value).toLocaleString()}${suffix}`;
          else if (goal % 1 !== 0) target.textContent = `${value.toFixed(1)}${suffix}`;
          else target.textContent = `${Math.round(value)}${suffix}`;

          if (progress < 1) requestAnimationFrame(tick);
        }

        requestAnimationFrame(tick);
        observer.unobserve(target);
      });
    }, { threshold: 0.4 });

    counters.forEach((counter) => observer.observe(counter));
  }

  function setupPageTransitions() {
    document.querySelectorAll('a[data-page-transition]').forEach((link) => {
      link.addEventListener('click', (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        event.preventDefault();
        document.body.classList.add('page-leaving');
        window.setTimeout(() => {
          window.location.href = href;
        }, 420);
      });
    });
  }

  function setupCinematicStory() {
    const section = document.querySelector('[data-cinematic]');
    const stage = document.getElementById('cinematic-stage');
    const progress = document.getElementById('cinematic-progress-fill');
    const scenes = Array.from(document.querySelectorAll('.cinematic-scene'));
    const dots = Array.from(document.querySelectorAll('[data-jump-scene]'));

    if (!section || !stage || !progress || scenes.length === 0) return;

    const mobile = window.matchMedia('(max-width: 1024px)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (mobile || reduced) {
      scenes.forEach((scene, index) => scene.classList.toggle('is-active', index === 0));
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === 0));
      progress.style.width = '33%';
      return;
    }

    function setScene(index, ratio) {
      scenes.forEach((scene, sceneIndex) => {
        scene.classList.toggle('is-active', sceneIndex === index);
      });

      dots.forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === index);
      });

      progress.style.width = `${Math.max(0, Math.min(100, ratio * 100)).toFixed(2)}%`;
    }

    function calculateProgress() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const total = Math.max(1, rect.height - viewport);
      const ratio = Math.max(0, Math.min(1, (-rect.top) / total));
      const sceneIndex = Math.max(0, Math.min(scenes.length - 1, Math.round(ratio * (scenes.length - 1))));
      setScene(sceneIndex, ratio);
      return ratio;
    }

    let ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        calculateProgress();
        ticking = false;
      });
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        const index = Number(dot.getAttribute('data-jump-scene')) || 0;
        const targetRatio = index / Math.max(1, scenes.length - 1);
        const sectionTop = window.scrollY + section.getBoundingClientRect().top;
        const targetY = sectionTop + (section.offsetHeight - window.innerHeight) * targetRatio;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      });
    });

    calculateProgress();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  function setupMicroInteractions() {
    const heroCard = document.querySelector('.hero-control-card');
    const roleCards = Array.from(document.querySelectorAll('.role-card'));

    if (heroCard) {
      heroCard.classList.add('is-interactive');
      heroCard.addEventListener('mousemove', (event) => {
        const rect = heroCard.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        heroCard.style.transform = `perspective(920px) rotateX(${(-ny * 3.5).toFixed(2)}deg) rotateY(${(nx * 4.2).toFixed(2)}deg) translateY(-1px)`;
      });

      heroCard.addEventListener('mouseleave', () => {
        heroCard.style.transform = 'perspective(920px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    }

    roleCards.forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(760px) rotateX(${(-ny * 2.4).toFixed(2)}deg) rotateY(${(nx * 2.8).toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  function setupCinematicCompare() {
    const shell = document.querySelector('[data-compare-shell]');
    const range = document.getElementById('compare-range');
    const percent = document.getElementById('compare-percent');
    if (!shell || !range || !percent) return;

    const min = Number(range.min || 15);
    const max = Number(range.max || 85);
    let dragging = false;

    function clamp(value) {
      return Math.max(min, Math.min(max, value));
    }

    function update(value) {
      const next = clamp(value);
      shell.style.setProperty('--split', `${next}%`);
      range.value = `${next}`;
      percent.textContent = `${Math.round(next)}`;
    }

    function updateFromClientX(clientX) {
      const rect = shell.getBoundingClientRect();
      const ratio = (clientX - rect.left) / Math.max(1, rect.width);
      update(ratio * 100);
    }

    range.addEventListener('input', () => {
      update(Number(range.value));
    });

    shell.addEventListener('mousedown', (event) => {
      dragging = true;
      updateFromClientX(event.clientX);
    });

    window.addEventListener('mousemove', (event) => {
      if (!dragging) return;
      updateFromClientX(event.clientX);
    });

    window.addEventListener('mouseup', () => {
      dragging = false;
    });

    shell.addEventListener('touchstart', (event) => {
      dragging = true;
      const touch = event.touches[0];
      if (touch) updateFromClientX(touch.clientX);
    }, { passive: true });

    shell.addEventListener('touchmove', (event) => {
      if (!dragging) return;
      const touch = event.touches[0];
      if (touch) updateFromClientX(touch.clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => {
      dragging = false;
    }, { passive: true });

    update(Number(range.value));
  }

  window.addEventListener('DOMContentLoaded', () => {
    markPageEntered();
    setupReveals();
    setupCinematicStory();
    setupCinematicCompare();
    setupMicroInteractions();
    setupRoleFilters();
    setupSimulator();
    setupCounters();
    setupPageTransitions();
  });
})();
