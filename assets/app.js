function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth' });
}

const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.querySelectorAll('[data-theme]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}

function setLang(lang) {
  root.setAttribute('data-lang', lang);
  localStorage.setItem('lang', lang);
  document.querySelectorAll('[data-lang]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyI18n(lang);
}

function setStyle(style) {
  root.setAttribute('data-style', style);
  localStorage.setItem('style', style);
  document.querySelectorAll('[data-style]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
}

const i18n = {
  en: {
    nav_platform: 'Platform',
    nav_usecases: 'Use cases',
    nav_contact: 'Contact',
    nav_cta: 'Contact',
    hero_headline: 'Operational Excellence, engineered with intelligence.',
    hero_subcopy: 'Empowering industry leaders with seamless, resilient, and beautiful solutions.',
    hero_cta_explore: 'Explore platform',
    hero_cta_meeting: 'Plan a meeting',
    platform_title: 'Platform',
    platform_ifs: 'IFS',
    platform_ifs_desc: 'Intelligent Factory Suite: Orchestrate, monitor, and optimize manufacturing operations in real time.',
    platform_ips: 'IPS',
    platform_ips_desc: 'Industrial Process Suite: Automate and control complex process flows with precision.',
    platform_ics: 'ICS',
    platform_ics_desc: 'Industrial Control Suite: Secure, scalable, and resilient control for critical infrastructure.',
    platform_hw: 'Hardware',
    platform_hw_desc: 'Edge Hardware: Rugged, reliable, and high-performance devices for industrial environments.',
    usecases_title: 'Use Cases',
    usecases_smart: 'Smart Manufacturing',
    usecases_smart_desc: 'Realtime insights & control for next-gen factories.',
    usecases_energy: 'Energy Optimization',
    usecases_energy_desc: 'Reduce waste, maximize uptime, sustainable operations.',
    usecases_infra: 'Critical Infrastructure',
    usecases_infra_desc: 'Secure, resilient, and scalable for mission-critical needs.'
  },
  nl: {
    nav_platform: 'Platform',
    nav_usecases: 'Toepassingen',
    nav_contact: 'Contact',
    nav_cta: 'Contact',
    hero_headline: 'Operationele excellentie, ontworpen met intelligentie.',
    hero_subcopy: 'Industrie leiders versterken met naadloze, veerkrachtige en elegante oplossingen.',
    hero_cta_explore: 'Ontdek platform',
    hero_cta_meeting: 'Plan een afspraak',
    platform_title: 'Platform',
    platform_ifs: 'IFS',
    platform_ifs_desc: 'Intelligent Factory Suite: Orkestreer, monitor en optimaliseer productieprocessen realtime.',
    platform_ips: 'IPS',
    platform_ips_desc: 'Industrial Process Suite: Automatiseer en beheer complexe processtromen met precisie.',
    platform_ics: 'ICS',
    platform_ics_desc: 'Industrial Control Suite: Veilig, schaalbaar en veerkrachtig voor kritieke infrastructuur.',
    platform_hw: 'Hardware',
    platform_hw_desc: 'Edge Hardware: Robuuste, betrouwbare en krachtige apparaten voor industriële omgevingen.',
    usecases_title: 'Toepassingen',
    usecases_smart: 'Slimme productie',
    usecases_smart_desc: 'Realtime inzicht & controle voor de fabriek van de toekomst.',
    usecases_energy: 'Energie optimalisatie',
    usecases_energy_desc: 'Verminder verspilling, maximaliseer uptime, duurzame operatie.',
    usecases_infra: 'Kritieke infrastructuur',
    usecases_infra_desc: 'Veilig, veerkrachtig en schaalbaar voor missiekritische behoeften.'
  }
};

function applyI18n(lang) {
  const dict = i18n[lang] || i18n.en;
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) el.textContent = dict[key];
  });
}

function initPlatformExplorer() {
  const explorerNav = document.getElementById('explorer-nav');
  const explorerPanel = document.getElementById('explorer-panel');
  if (!explorerNav || !explorerPanel) return;

  const platformData = {
    IFS: {
      title: 'IFS',
      desc: 'Intelligent Factory Suite: Orchestrate, monitor, and optimize manufacturing operations in real time.',
      kpis: [
        { label: 'OEE', value: 98.2, unit: '%' },
        { label: 'Downtime', value: 1.1, unit: 'h/mo' },
        { label: 'Yield', value: 99.7, unit: '%' }
      ],
      chart: [82, 90, 95, 98, 97, 98, 98]
    },
    IPS: {
      title: 'IPS',
      desc: 'Industrial Process Suite: Automate and control complex process flows with precision.',
      kpis: [
        { label: 'Throughput', value: 1200, unit: 'units/h' },
        { label: 'Energy Use', value: 0.82, unit: 'kWh/unit' },
        { label: 'Defects', value: 0.2, unit: '%' }
      ],
      chart: [1100, 1150, 1200, 1190, 1200, 1205, 1200]
    },
    ICS: {
      title: 'ICS',
      desc: 'Industrial Control Suite: Secure, scalable, and resilient control for critical infrastructure.',
      kpis: [
        { label: 'Uptime', value: 99.999, unit: '%' },
        { label: 'Latency', value: 2, unit: 'ms' },
        { label: 'Incidents', value: 0, unit: 'this year' }
      ],
      chart: [99.99, 99.995, 99.999, 99.999, 99.999, 99.999, 99.999]
    },
    Hardware: {
      title: 'Hardware',
      desc: 'Edge Hardware: Rugged, reliable, and high-performance devices for industrial environments.',
      kpis: [
        { label: 'MTBF', value: 120000, unit: 'h' },
        { label: 'Temp Range', value: '-40~85', unit: '°C' },
        { label: 'Power', value: 8, unit: 'W avg' }
      ],
      chart: [7, 8, 8, 8, 8, 8, 8]
    }
  };

  function renderPlatform(key) {
    const data = platformData[key];
    if (!data) return;

    const points = data.chart
      .map((value, index) => {
        const max = Math.max(...data.chart);
        const y = max === 0 ? 20 : 38 - (value / max) * 30;
        return `${index * 20},${y}`;
      })
      .join(' ');

    explorerPanel.querySelector('.explorer-title').textContent = data.title;
    explorerPanel.querySelector('.explorer-desc').textContent = data.desc;

    const kpiWrap = explorerPanel.querySelector('.explorer-kpis');
    kpiWrap.innerHTML = '';
    data.kpis.forEach((kpi) => {
      const chip = document.createElement('div');
      chip.className = 'kpi-chip';
      chip.innerHTML = `<span class="kpi-label">${kpi.label}</span> <span class="kpi-value">${kpi.value}${kpi.unit}</span>`;
      kpiWrap.appendChild(chip);
    });

    const chartWrap = explorerPanel.querySelector('.explorer-chart');
    chartWrap.innerHTML = `<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="${points}" stroke="var(--accent)" stroke-width="3" fill="none"/><circle cx="120" cy="${points.split(' ').slice(-1)[0].split(',')[1]}" r="4" fill="var(--accent)"/></svg>`;
  }

  explorerNav.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-platform]');
    if (!button) return;
    explorerNav.querySelectorAll('button[data-platform]').forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    renderPlatform(button.dataset.platform);
  });

  const initial = explorerNav.querySelector('button[data-platform].active') || explorerNav.querySelector('button[data-platform]');
  if (initial) renderPlatform(initial.dataset.platform);
}

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#cta-explore, #cta-meeting').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      smoothScrollTo('#platform');
    });
  });

  const nav = document.getElementById('topnav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('sticky', window.scrollY > 32);
    });
  }

  const heroVideo = document.getElementById('hero-video');
  const heroFallback = document.getElementById('hero-fallback');
  if (heroVideo && heroFallback) {
    heroVideo.addEventListener('loadeddata', () => {
      heroFallback.style.display = 'none';
    });
  }

  document.addEventListener('click', (event) => {
    const control = event.target.closest('[data-theme], [data-lang], [data-style]');
    if (!control) return;

    if (control.dataset.theme) setTheme(control.dataset.theme);
    if (control.dataset.lang) setLang(control.dataset.lang);
    if (control.dataset.style) setStyle(control.dataset.style);
  });

  setTheme(localStorage.getItem('theme') || 'light');
  setLang(localStorage.getItem('lang') || 'en');
  setStyle(localStorage.getItem('style') || 'ivory');

  initPlatformExplorer();
});
