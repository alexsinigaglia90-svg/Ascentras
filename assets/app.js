

// Smooth scroll for hero CTA
function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth' });
}
['cta-explore', 'cta-meeting'].forEach(id => {
  const btn = document.getElementById(id);
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      smoothScrollTo('#platform');
    });
  }
});

// Sticky nav on scroll
const nav = document.getElementById('topnav');
let navSticky = false;
window.addEventListener('scroll', () => {
  if (window.scrollY > 32 && !navSticky) {
    nav.classList.add('sticky');
    navSticky = true;
  } else if (window.scrollY <= 32 && navSticky) {
    nav.classList.remove('sticky');
    navSticky = false;
  }
});

// Hero video fallback
window.addEventListener('DOMContentLoaded', () => {
  const heroVideo = document.getElementById('hero-video');
  if (heroVideo) {
    heroVideo.addEventListener('loadeddata', function() {
      document.getElementById('hero-fallback').style.display = 'none';
    });
  }
});


// Theme, language, and style toggles (rail)
const themeToggle = document.getElementById('theme-toggle');
const langToggle = document.getElementById('lang-toggle');
const styleToggle = document.getElementById('style-toggle');
const root = document.documentElement;

function setTheme(theme) {
  root.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  Array.from(themeToggle.querySelectorAll('button')).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
}
function setLang(lang) {
  root.setAttribute('data-lang', lang);
  localStorage.setItem('lang', lang);
  Array.from(langToggle.querySelectorAll('button')).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  applyI18n(lang);
}
function setStyle(style) {
  root.setAttribute('data-style', style);
  localStorage.setItem('style', style);
  Array.from(styleToggle.querySelectorAll('button')).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
}

if (themeToggle) themeToggle.addEventListener('click', e => {
  const btn = e.target.closest('button[data-theme]');
  if (btn) setTheme(btn.dataset.theme);
});
if (langToggle) langToggle.addEventListener('click', e => {
  const btn = e.target.closest('button[data-lang]');
  if (btn) setLang(btn.dataset.lang);
});
if (styleToggle) styleToggle.addEventListener('click', e => {
  const btn = e.target.closest('button[data-style]');
  if (btn) setStyle(btn.dataset.style);
});

// Init theme/lang/style from localStorage
window.addEventListener('DOMContentLoaded', () => {
  setTheme(localStorage.getItem('theme') || 'light');
  setLang(localStorage.getItem('lang') || 'en');
  setStyle(localStorage.getItem('style') || 'ivory');
});

// i18n
const i18n = {

  // Platform explorer nav logic (premium panel)
  const explorerNav = document.getElementById('explorer-nav');
  const explorerPanel = document.getElementById('explorer-panel');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  if (explorerNav && explorerPanel) {
    explorerNav.addEventListener('click', e => {
      const btn = e.target.closest('button[data-platform]');
      if (!btn) return;
      Array.from(explorerNav.querySelectorAll('button')).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.platform;
      const data = platformData[key];
      if (!data) return;
      // Update panel
      explorerPanel.querySelector('.explorer-title').textContent = data.title;
      explorerPanel.querySelector('.explorer-desc').textContent = data.desc;
      // KPIs
      const kpiWrap = explorerPanel.querySelector('.explorer-kpis');
      kpiWrap.innerHTML = '';
      data.kpis.forEach(kpi => {
        const div = document.createElement('div');
        div.className = 'kpi-chip';
        div.innerHTML = `<span class="kpi-label">${kpi.label}</span> <span class="kpi-value">${kpi.value}${kpi.unit}</span>`;
        kpiWrap.appendChild(div);
      });
      // Chart (simple SVG polyline)
      const chartWrap = explorerPanel.querySelector('.explorer-chart');
      if (chartWrap && data.chart) {
        // Generate SVG polyline points
        const points = data.chart.map((v, i) => `${i*20},${40-(v/100)*34}`).join(' ');
        chartWrap.innerHTML = `<svg width="120" height="40" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="${points}" stroke="var(--accent)" stroke-width="3" fill="none"/>
          <circle cx="120" cy="${40-(data.chart[data.chart.length-1]/100)*34}" r="4" fill="var(--accent)"/>
        </svg>`;
      }
    });
  }
const explorerPanel = document.getElementById('explorer-panel');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const platformData = {
  IFS: {
    title: 'IFS',
    desc: 'Intelligent Factory Suite: Orchestrate, monitor, and optimize manufacturing operations in real time.',
    kpis: [
      { label: 'OEE', value: 98.2, unit: '%', icon: '⚙️'},
      { label: 'Downtime', value: 1.1, unit: 'h/mo', icon: '⏱️'},
      { label: 'Yield', value: 99.7, unit: '%', icon: '📈'}
    ],
    chart: [82, 90, 95, 98, 97, 98, 98]
  },
  IPS: {
    title: 'IPS',
    desc: 'Industrial Process Suite: Automate and control complex process flows with precision.',
    kpis: [
      { label: 'Throughput', value: 1200, unit: 'units/h', icon: '🔄'},
      { label: 'Energy Use', value: 0.82, unit: 'kWh/unit', icon: '⚡'},
      { label: 'Defects', value: 0.2, unit: '%', icon: '❌'}
    ],
    chart: [1100, 1150, 1200, 1190, 1200, 1205, 1200]
  },
  ICS: {
    title: 'ICS',
    desc: 'Industrial Control Suite: Secure, scalable, and resilient control for critical infrastructure.',
    kpis: [
      { label: 'Uptime', value: 99.999, unit: '%', icon: '🔒'},
      { label: 'Latency', value: 2, unit: 'ms', icon: '⚡'},
      { label: 'Incidents', value: 0, unit: 'this year', icon: '🛡️'}
    ],
    chart: [99.99, 99.995, 99.999, 99.999, 99.999, 99.999, 99.999]
  },
  Hardware: {
    title: 'Hardware',
    desc: 'Edge Hardware: Rugged, reliable, and high-performance devices for industrial environments.',
    kpis: [
      { label: 'MTBF', value: 120000, unit: 'h', icon: '🔋'},
      { label: 'Temp Range', value: '-40~85', unit: '°C', icon: '🌡️'},
      { label: 'Power', value: 8, unit: 'W avg', icon: '🔌'}
    ],
    chart: [7, 8, 8, 8, 8, 8, 8]
  }
};

function renderPanel(tab) {
  const data = platformData[tab];
  if (!data) return;
  explorerPanel.innerHTML = `
    <h3 class="panel-title">${data.title}</h3>
    <div class="desc">${data.desc}</div>
    <div class="kpi-row">
      ${data.kpis.map(kpi => `
        <div class="kpi" tabindex="0">
          <span class="kpi-icon" aria-hidden="true">${kpi.icon}</span>
          <span class="kpi-label">${kpi.label}</span>
          <span class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></span>
        </div>
      `).join('')}
    </div>
    <div class="chart">${renderChart(tab, data.chart)}</div>
  `;
  if (!prefersReducedMotion) {
    const chart = explorerPanel.querySelector('.chart');
    if (chart) {
      chart.style.opacity = 0;
      setTimeout(() => { chart.style.opacity = 1; }, 60);
    }
  }
}

function renderChart(tab, values) {
  // Cinematic SVG line chart with animate-in
  const w = 240, h = 72, pad = 16;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((v,i) => {
    const x = pad + i * ((w-2*pad)/(values.length-1));
    const y = h - pad - ((v-min)/(max-min||1))*(h-2*pad);
    return `${x},${y}`;
  }).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
    <defs>
      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#0B1F3A" stop-opacity=".9"/>
        <stop offset="100%" stop-color="#6B4E2E" stop-opacity=".5"/>
      </linearGradient>
    </defs>
    <polyline points="${points}" fill="none" stroke="url(#g1)" stroke-width="4" stroke-linecap="round" style="filter: drop-shadow(0 2px 8px #0B1F3A22)"/>
    <circle cx="${w-pad}" cy="${h - pad - ((values[values.length-1]-min)/(max-min||1))*(h-2*pad)}" r="7" fill="#6B4E2E"/>
  </svg>`;
}

// Tab switching + focus/keyboard
if (explorerNav && explorerPanel) {
  explorerNav.addEventListener('click', e => {
    if (e.target.classList.contains('nav-item')) {
      Array.from(explorerNav.children).forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      e.target.classList.add('active');
      e.target.setAttribute('aria-selected', 'true');
      renderPanel(e.target.dataset.tab);
      explorerPanel.focus();
    }
  });
  explorerNav.addEventListener('keydown', e => {
    const items = Array.from(explorerNav.querySelectorAll('.nav-item'));
    const idx = items.findIndex(btn => btn.classList.contains('active'));
    if (e.key === 'ArrowDown' && idx < items.length-1) { items[idx+1].focus(); }
    if (e.key === 'ArrowUp' && idx > 0) { items[idx-1].focus(); }
  });
  // Initial render
  renderPanel('IFS');
}

// Hide fallback if video loads
const heroVideo = document.querySelector('.hero-video');
if (heroVideo) {
  heroVideo.addEventListener('loadeddata', function() {
    document.getElementById('hero-fallback').style.display = 'none';
  });
}
