// Smooth scroll CTA
const cta = document.getElementById('cta-explore');
if (cta) {
  cta.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('platform').scrollIntoView({ behavior: 'smooth' });
  });
}

// Sticky topbar appear on scroll
const topbar = document.getElementById('topbar');
let topbarVisible = false;
window.addEventListener('scroll', () => {
  if (window.scrollY > 32 && !topbarVisible) {
    topbar.classList.add('visible');
    topbarVisible = true;
  } else if (window.scrollY <= 32 && topbarVisible) {
    topbar.classList.remove('visible');
    topbarVisible = false;
  }
});

// Platform explorer state
const explorerNav = document.getElementById('explorer-nav');
const explorerPanel = document.getElementById('explorer-panel');

const platformData = {
  IFS: {
    desc: 'Intelligent Factory Suite: Orchestrate, monitor, and optimize manufacturing operations in real time.',
    kpis: [
      { label: 'OEE', value: 98.2, unit: '%'},
      { label: 'Downtime', value: 1.1, unit: 'h/mo'},
      { label: 'Yield', value: 99.7, unit: '%'}
    ],
    chart: [82, 90, 95, 98, 97, 98, 98]
  },
  IPS: {
    desc: 'Industrial Process Suite: Automate and control complex process flows with precision.',
    kpis: [
      { label: 'Throughput', value: 1200, unit: 'units/h'},
      { label: 'Energy Use', value: 0.82, unit: 'kWh/unit'},
      { label: 'Defects', value: 0.2, unit: '%'}
    ],
    chart: [1100, 1150, 1200, 1190, 1200, 1205, 1200]
  },
  ICS: {
    desc: 'Industrial Control Suite: Secure, scalable, and resilient control for critical infrastructure.',
    kpis: [
      { label: 'Uptime', value: 99.999, unit: '%'},
      { label: 'Latency', value: 2, unit: 'ms'},
      { label: 'Incidents', value: 0, unit: 'this year'}
    ],
    chart: [99.99, 99.995, 99.999, 99.999, 99.999, 99.999, 99.999]
  },
  Hardware: {
    desc: 'Edge Hardware: Rugged, reliable, and high-performance devices for industrial environments.',
    kpis: [
      { label: 'MTBF', value: 120000, unit: 'h'},
      { label: 'Temp Range', value: '-40~85', unit: '°C'},
      { label: 'Power', value: 8, unit: 'W avg'}
    ],
    chart: [7, 8, 8, 8, 8, 8, 8]
  }
};

function renderPanel(tab) {
  const data = platformData[tab];
  if (!data) return;
  explorerPanel.innerHTML = `
    <div class="desc">${data.desc}</div>
    <div class="kpi-row">
      ${data.kpis.map(kpi => `
        <div class="kpi">
          <span class="kpi-label">${kpi.label}</span>
          <span class="kpi-value">${kpi.value}<span class="kpi-unit">${kpi.unit}</span></span>
        </div>
      `).join('')}
    </div>
    <div class="chart">${renderChart(tab, data.chart)}</div>
  `;
}

function renderChart(tab, values) {
  // Simple SVG line or bar chart
  const w = 220, h = 60, pad = 12;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((v,i) => {
    const x = pad + i * ((w-2*pad)/(values.length-1));
    const y = h - pad - ((v-min)/(max-min||1))*(h-2*pad);
    return `${x},${y}`;
  }).join(' ');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline points="${points}" fill="none" stroke="#0B1F3A" stroke-width="3" stroke-linecap="round" style="filter: drop-shadow(0 2px 8px #0B1F3A22)"/>
    <circle cx="${w-pad}" cy="${h - pad - ((values[values.length-1]-min)/(max-min||1))*(h-2*pad)}" r="5" fill="#6B4E2E"/>
  </svg>`;
}

// Tab switching
if (explorerNav && explorerPanel) {
  explorerNav.addEventListener('click', e => {
    if (e.target.classList.contains('nav-item')) {
      Array.from(explorerNav.children).forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      renderPanel(e.target.dataset.tab);
    }
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
