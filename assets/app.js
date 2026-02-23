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
  document.dispatchEvent(new CustomEvent('app:langchange', { detail: { lang } }));
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
    hero_eyebrow: 'PRIVATE ENTERPRISE ADVISORY',
    hero_headline: 'Ascentra',
    hero_subcopy: 'Operational excellence, engineered with elegance.',
    hero_cta_explore: 'Explore platform',
    hero_cta_meeting: 'Plan a meeting',
    operis_title: 'Operis Dashboard',
    operis_desc: 'Activated when consultants and operational leaders run site execution with your teams.',
    operis_open_dashboard: 'Open Dashboard',
    operis_dashboard_live: 'Dashboard Live',
    operis_mode: 'Mode',
    operis_picks_hour: 'Picks/h',
    operis_repl_hour: 'Repl/h',
    operis_flow: 'Flow',
    operis_system_health: 'System Health',
    operis_mode_standby: 'Standby',
    operis_mode_live: 'Live',
    operis_flow_nominal: 'Nominal',
    operis_flow_watch: 'Watch',
    operis_flow_constrained: 'Constrained',
    operis_bottleneck: 'Bottleneck',
    operis_none: 'None',
    operis_zone_snapshot: 'Zone Snapshot',
    operis_hover_zone: 'Hover a zone',
    operis_panel_workforce: 'Workforce Assignment',
    operis_panel_flow: 'Flow Intelligence',
    operis_panel_system_layers: 'System Layers',
    operis_zone_pick_east: 'Order Pick East',
    operis_zone_pick_west: 'Order Pick West',
    operis_zone_repl_core: 'Replenish Core',
    operis_zone_buffer_north: 'Buffer North',
    operis_zone_sortation: 'Sortation',
    operis_lane_picking: 'Picking',
    operis_lane_replenish: 'Replenish',
    operis_lane_sortation: 'Sortation',
    operis_lane_buffer: 'Buffer',
    operis_status_healthy: 'Healthy',
    operis_status_warning: 'Warning',
    operis_status_critical: 'Critical',
    operis_util_short: 'util',
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
    hero_eyebrow: 'PRIVATE ENTERPRISE ADVISORY',
    hero_headline: 'Ascentra',
    hero_subcopy: 'Operationele excellentie, ontworpen met elegantie.',
    hero_cta_explore: 'Ontdek platform',
    hero_cta_meeting: 'Plan een afspraak',
    operis_title: 'Operis Dashboard',
    operis_desc: 'Geactiveerd wanneer consultants en operationele leiders de site-executie met je teams aansturen.',
    operis_open_dashboard: 'Open Dashboard',
    operis_dashboard_live: 'Dashboard Live',
    operis_mode: 'Modus',
    operis_picks_hour: 'Picks/u',
    operis_repl_hour: 'Repl/u',
    operis_flow: 'Flow',
    operis_system_health: 'Systeemgezondheid',
    operis_mode_standby: 'Stand-by',
    operis_mode_live: 'Live',
    operis_flow_nominal: 'Nominaal',
    operis_flow_watch: 'Observeer',
    operis_flow_constrained: 'Beperkt',
    operis_bottleneck: 'Knelpunt',
    operis_none: 'Geen',
    operis_zone_snapshot: 'Zone Snapshot',
    operis_hover_zone: 'Beweeg over een zone',
    operis_panel_workforce: 'Personeelsindeling',
    operis_panel_flow: 'Flow-intelligentie',
    operis_panel_system_layers: 'Systeemlagen',
    operis_zone_pick_east: 'Order Pick Oost',
    operis_zone_pick_west: 'Order Pick West',
    operis_zone_repl_core: 'Replenish Kern',
    operis_zone_buffer_north: 'Buffer Noord',
    operis_zone_sortation: 'Sortering',
    operis_lane_picking: 'Picking',
    operis_lane_replenish: 'Replenish',
    operis_lane_sortation: 'Sortering',
    operis_lane_buffer: 'Buffer',
    operis_status_healthy: 'Gezond',
    operis_status_warning: 'Waarschuwing',
    operis_status_critical: 'Kritiek',
    operis_util_short: 'util',
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

function initOperisDashboard() {
  const section = document.getElementById('operis-app');
  const warehouse = document.getElementById('operis-warehouse');
  const staffPanel = document.getElementById('operis-staff');
  const chartsPanel = document.getElementById('operis-charts');
  const systemsPanel = document.getElementById('operis-systems');
  const launchButton = document.getElementById('operis-launch');

  if (!section || !warehouse || !staffPanel || !chartsPanel || !systemsPanel || !launchButton) {
    return;
  }

  function getLang() {
    return root.getAttribute('data-lang') || localStorage.getItem('lang') || 'en';
  }

  function t(key) {
    const lang = getLang();
    const dict = i18n[lang] || i18n.en;
    return dict[key] || i18n.en[key] || key;
  }

  function flowText(flowState) {
    if (flowState === 'Constrained') return t('operis_flow_constrained');
    if (flowState === 'Watch') return t('operis_flow_watch');
    return t('operis_flow_nominal');
  }

  function statusText(status) {
    if (status === 'healthy') return t('operis_status_healthy');
    if (status === 'warning') return t('operis_status_warning');
    return t('operis_status_critical');
  }

  function laneText(laneKey) {
    return t(`operis_lane_${laneKey}`);
  }

  const state = {
    running: false,
    picksHour: 842,
    replHour: 416,
    flowState: 'Nominal',
    health: 99.9,
    flowSeries: [61, 63, 66, 68, 67, 69, 70, 72, 71, 73, 74, 75],
    lanes: {
      picking: 72,
      replenish: 66,
      sortation: 78,
      buffer: 83
    },
    zones: {
      z_pick_east: { nameKey: 'operis_zone_pick_east', status: 'healthy', utilization: 78 },
      z_pick_west: { nameKey: 'operis_zone_pick_west', status: 'healthy', utilization: 74 },
      z_repl_core: { nameKey: 'operis_zone_repl_core', status: 'healthy', utilization: 69 },
      z_sortation: { nameKey: 'operis_zone_sortation', status: 'healthy', utilization: 82 },
      z_buffer_north: { nameKey: 'operis_zone_buffer_north', status: 'healthy', utilization: 64 }
    },
    staff: [
      { name: 'L. Vermeer', zone: 'z_pick_east', actual: 97, norm: 95 },
      { name: 'M. Aydin', zone: 'z_pick_west', actual: 94, norm: 95 },
      { name: 'R. de Jong', zone: 'z_repl_core', actual: 92, norm: 93 },
      { name: 'S. Kovacs', zone: 'z_sortation', actual: 99, norm: 97 },
      { name: 'N. Santos', zone: 'z_buffer_north', actual: 96, norm: 94 }
    ],
    systems: {
      plc: 99.98,
      wcs: 99.95,
      agv: 98.9,
      vision: 99.21
    },
    totes: [
      { id: 't1', route: 'upper', t: 0.05, speed: 0.0042 },
      { id: 't2', route: 'upper', t: 0.42, speed: 0.0039 },
      { id: 't3', route: 'lower', t: 0.12, speed: 0.0036 },
      { id: 't4', route: 'lower', t: 0.68, speed: 0.0041 },
      { id: 't5', route: 'loop', t: 0.33, speed: 0.0028 }
    ]
  };

  const routes = {
    upper: [
      [98, 116], [280, 116], [455, 116], [620, 116], [790, 116]
    ],
    lower: [
      [790, 250], [620, 250], [455, 250], [280, 250], [98, 250]
    ],
    loop: [
      [454, 116], [540, 148], [542, 220], [456, 250], [368, 220], [366, 148], [454, 116]
    ]
  };

  function getPoint(route, t) {
    const points = routes[route];
    if (!points || points.length < 2) return { x: 0, y: 0 };

    const clamped = (t % 1 + 1) % 1;
    const segmentCount = points.length - 1;
    const scaled = clamped * segmentCount;
    const index = Math.min(segmentCount - 1, Math.floor(scaled));
    const localT = scaled - index;
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    return {
      x: x1 + (x2 - x1) * localT,
      y: y1 + (y2 - y1) * localT
    };
  }

  function zoneStatusClass(value) {
    if (value >= 96) return 'healthy';
    if (value >= 90) return 'warning';
    return 'critical';
  }

  function renderWarehouse() {
    warehouse.innerHTML = `
      <svg class="operis-scada" viewBox="0 0 900 380" role="img" aria-label="Live SCADA warehouse">
        <defs>
          <pattern id="operis-grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" class="scada-grid-line"></path>
          </pattern>
        </defs>
        <rect x="1" y="1" width="898" height="378" rx="14" fill="url(#operis-grid)"></rect>

        <rect class="scada-zone" data-zone-id="z_pick_east" x="72" y="86" width="164" height="62" rx="10"></rect>
        <text class="scada-zone-label" x="84" y="110">${t('operis_zone_pick_east').toUpperCase()}</text>

        <rect class="scada-zone" data-zone-id="z_pick_west" x="664" y="86" width="164" height="62" rx="10"></rect>
        <text class="scada-zone-label" x="676" y="110">${t('operis_zone_pick_west').toUpperCase()}</text>

        <rect class="scada-zone" data-zone-id="z_repl_core" x="72" y="220" width="164" height="62" rx="10"></rect>
        <text class="scada-zone-label" x="84" y="244">${t('operis_zone_repl_core').toUpperCase()}</text>

        <rect class="scada-zone" data-zone-id="z_buffer_north" x="664" y="220" width="164" height="62" rx="10"></rect>
        <text class="scada-zone-label" x="676" y="244">${t('operis_zone_buffer_north').toUpperCase()}</text>

        <rect class="scada-zone" data-zone-id="z_sortation" x="368" y="148" width="174" height="86" rx="42"></rect>
        <text class="scada-zone-label" x="407" y="194">${t('operis_zone_sortation').toUpperCase()}</text>

        <path class="scada-conveyor" d="M98 116 L790 116"></path>
        <path class="scada-conveyor" d="M790 250 L98 250"></path>
        <path class="scada-conveyor" d="M454 116 C546 146 548 220 456 250 C364 220 362 146 454 116"></path>

        <path class="scada-conveyor-core" d="M98 116 L790 116"></path>
        <path class="scada-conveyor-core" d="M790 250 L98 250"></path>
        <path class="scada-conveyor-core" d="M454 116 C546 146 548 220 456 250 C364 220 362 146 454 116"></path>

        <circle class="scada-worker" cx="148" cy="154" r="7"></circle>
        <circle class="scada-worker" cx="752" cy="154" r="7"></circle>
        <circle class="scada-worker" cx="148" cy="214" r="7"></circle>
        <circle class="scada-worker" cx="752" cy="214" r="7"></circle>

        <circle class="scada-pulse" id="operis-pulse" cx="454" cy="191" r="22"></circle>

        <rect x="686" y="18" width="196" height="64" rx="12" class="scada-status-pill"></rect>
        <text x="702" y="42" class="scada-status-text">${t('operis_bottleneck').toUpperCase()}</text>
        <text x="702" y="66" class="scada-status-text" id="operis-bottleneck-label">${t('operis_none').toUpperCase()}</text>

        ${state.totes.map((tote) => `<circle id="${tote.id}" class="scada-tote" cx="120" cy="120" r="7"></circle>`).join('')}
      </svg>
      <div class="operis-tooltip" id="operis-tooltip">
        <div class="operis-tooltip-title">${t('operis_zone_snapshot')}</div>
        <div class="operis-tooltip-value" id="operis-tooltip-value">${t('operis_hover_zone')}</div>
      </div>
    `;
  }

  function renderStaffPanel() {
    const rows = state.staff.map((member) => {
      const ratio = Math.max(0, Math.round((member.actual / member.norm) * 100));
      const status = zoneStatusClass(ratio);
      const zoneName = state.zones[member.zone]?.nameKey ? t(state.zones[member.zone].nameKey) : member.zone;
      return `
        <div class="staff-row" data-zone-focus="${member.zone}" tabindex="0">
          <div class="staff-main">
            <div class="staff-name">${member.name}</div>
            <div class="staff-zone">${zoneName}</div>
          </div>
          <div class="staff-metric">
            <span class="staff-status ${status}">${statusText(status)}</span>
          </div>
        </div>
      `;
    }).join('');

    staffPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_workforce')}</h3>
      <div class="operis-staff-list">${rows}</div>
    `;
  }

  function renderChartsPanel() {
    const points = state.flowSeries
      .map((value, index) => {
        const x = 16 + index * 24;
        const y = 66 - (value - 50) * 1.05;
        return `${x},${Math.max(8, Math.min(72, y))}`;
      })
      .join(' ');

    chartsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_flow')}</h3>
      <div class="operis-chart-wrap">
        <svg class="operis-mini-chart" viewBox="0 0 320 80" role="img" aria-label="Throughput trend">
          <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
        <div class="operis-bars">
          ${Object.entries(state.lanes).map(([key, value]) => `
            <div class="operis-bar-row">
              <div class="operis-bar-label">${laneText(key).toUpperCase()}</div>
              <div class="operis-bar-track"><div class="operis-bar-fill" style="width:${Math.max(6, Math.min(100, value))}%;"></div></div>
              <div class="operis-bar-val">${Math.round(value)}%</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderSystemsPanel() {
    systemsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_system_layers')}</h3>
      <div class="system-grid">
        ${Object.entries(state.systems).map(([key, value]) => `
          <div class="system-tile">
            <div class="system-name">${key.toUpperCase()}</div>
            <div class="system-value">${value.toFixed(2)}%</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function updateRuntimeStrip() {
    const picks = document.getElementById('operis-picks-hour');
    const repl = document.getElementById('operis-repl-hour');
    const flow = document.getElementById('operis-flow-state');
    const health = document.getElementById('operis-health');
    const mode = document.getElementById('operis-mode');

    if (picks) picks.textContent = `${Math.round(state.picksHour)}`;
    if (repl) repl.textContent = `${Math.round(state.replHour)}`;
    if (flow) flow.textContent = flowText(state.flowState);
    if (health) health.textContent = `${state.health.toFixed(2)}%`;
    if (mode) mode.textContent = state.running ? t('operis_mode_live') : t('operis_mode_standby');
  }

  function pickBottleneck() {
    const entries = Object.entries(state.lanes);
    entries.sort((a, b) => a[1] - b[1]);
    return entries[0];
  }

  function updateZoneStates() {
    const [bottleneckKey, bottleneckValue] = pickBottleneck();

    state.zones.z_pick_east.utilization = state.lanes.picking;
    state.zones.z_pick_west.utilization = state.lanes.picking - 2;
    state.zones.z_repl_core.utilization = state.lanes.replenish;
    state.zones.z_sortation.utilization = state.lanes.sortation;
    state.zones.z_buffer_north.utilization = state.lanes.buffer;

    Object.keys(state.zones).forEach((zoneKey) => {
      const value = state.zones[zoneKey].utilization;
      state.zones[zoneKey].status = zoneStatusClass(value + 20);
    });

    const bottleneckLabel = document.getElementById('operis-bottleneck-label');
    if (bottleneckLabel) bottleneckLabel.textContent = `${laneText(bottleneckKey).toUpperCase()} ${Math.round(bottleneckValue)}%`;

    if (bottleneckValue < 62) state.flowState = 'Constrained';
    else if (bottleneckValue < 72) state.flowState = 'Watch';
    else state.flowState = 'Nominal';
  }

  function animateTotes() {
    state.totes.forEach((tote) => {
      tote.t += tote.speed;
      const point = getPoint(tote.route, tote.t);
      const dot = document.getElementById(tote.id);
      if (dot) {
        dot.setAttribute('cx', point.x.toFixed(2));
        dot.setAttribute('cy', point.y.toFixed(2));
      }
    });

    const pulse = document.getElementById('operis-pulse');
    if (pulse) {
      const wave = 20 + Math.sin(Date.now() / 380) * 4;
      pulse.setAttribute('r', wave.toFixed(2));
      pulse.setAttribute('opacity', (0.42 + Math.sin(Date.now() / 280) * 0.15).toFixed(2));
    }
  }

  function tick() {
    if (!state.running) return;

    const randomStep = () => (Math.random() - 0.5) * 2.6;
    state.lanes.picking = Math.max(55, Math.min(93, state.lanes.picking + randomStep()));
    state.lanes.replenish = Math.max(52, Math.min(91, state.lanes.replenish + randomStep()));
    state.lanes.sortation = Math.max(58, Math.min(95, state.lanes.sortation + randomStep()));
    state.lanes.buffer = Math.max(60, Math.min(96, state.lanes.buffer + randomStep()));

    const laneAverage = (state.lanes.picking + state.lanes.replenish + state.lanes.sortation + state.lanes.buffer) / 4;
    state.picksHour = Math.max(420, Math.min(1450, state.picksHour + (laneAverage - 70) * 1.8 + (Math.random() - 0.5) * 12));
    state.replHour = Math.max(240, Math.min(980, state.replHour + (state.lanes.replenish - 68) * 1.1 + (Math.random() - 0.5) * 8));

    const throughput = Math.max(55, Math.min(96, laneAverage + (Math.random() - 0.5) * 4));
    state.flowSeries.push(throughput);
    if (state.flowSeries.length > 12) state.flowSeries.shift();

    state.staff = state.staff.map((member) => {
      const zone = state.zones[member.zone];
      const zoneEffect = zone ? (zone.utilization - 70) * 0.12 : 0;
      const jitter = (Math.random() - 0.5) * 1.8;
      const nextActual = Math.max(84, Math.min(104, member.actual + zoneEffect * 0.08 + jitter));
      return { ...member, actual: nextActual };
    });

    state.systems.plc = Math.max(98.9, Math.min(99.99, state.systems.plc + (Math.random() - 0.5) * 0.03));
    state.systems.wcs = Math.max(98.7, Math.min(99.97, state.systems.wcs + (Math.random() - 0.5) * 0.05));
    state.systems.agv = Math.max(96.8, Math.min(99.6, state.systems.agv + (Math.random() - 0.5) * 0.12));
    state.systems.vision = Math.max(97.2, Math.min(99.6, state.systems.vision + (Math.random() - 0.5) * 0.08));

    state.health = (state.systems.plc + state.systems.wcs + state.systems.agv + state.systems.vision) / 4;

    updateZoneStates();
    updateRuntimeStrip();
    renderStaffPanel();
    renderChartsPanel();
    renderSystemsPanel();
    animateTotes();
  }

  function handleZoneHover(zoneId) {
    const tooltip = document.getElementById('operis-tooltip');
    const tooltipValue = document.getElementById('operis-tooltip-value');
    if (!tooltip || !tooltipValue) return;
    const zone = state.zones[zoneId];
    if (!zone) {
      tooltip.classList.remove('show');
      return;
    }
    tooltipValue.textContent = `${t(zone.nameKey)} · ${zone.utilization.toFixed(0)}% ${t('operis_util_short')} · ${statusText(zone.status)}`;
    tooltip.classList.add('show');
  }

  function setupInteractions() {
    warehouse.addEventListener('mouseover', (event) => {
      const zone = event.target.closest('[data-zone-id]');
      if (!zone) return;
      const zoneId = zone.getAttribute('data-zone-id');
      warehouse.querySelectorAll('.scada-zone').forEach((z) => z.classList.remove('is-focus'));
      zone.classList.add('is-focus');
      handleZoneHover(zoneId);
    });

    warehouse.addEventListener('mouseleave', () => {
      const tooltip = document.getElementById('operis-tooltip');
      if (tooltip) tooltip.classList.remove('show');
      warehouse.querySelectorAll('.scada-zone').forEach((z) => z.classList.remove('is-focus'));
    });

    staffPanel.addEventListener('mouseover', (event) => {
      const row = event.target.closest('[data-zone-focus]');
      if (!row) return;
      const zoneId = row.getAttribute('data-zone-focus');
      const zoneShape = warehouse.querySelector(`[data-zone-id="${zoneId}"]`);
      if (!zoneShape) return;
      warehouse.querySelectorAll('.scada-zone').forEach((z) => z.classList.remove('is-focus'));
      zoneShape.classList.add('is-focus');
      handleZoneHover(zoneId);
    });

    staffPanel.addEventListener('mouseleave', () => {
      warehouse.querySelectorAll('.scada-zone').forEach((z) => z.classList.remove('is-focus'));
    });
  }

  function openDashboard() {
    state.running = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    launchButton.textContent = t('operis_dashboard_live');
    launchButton.setAttribute('aria-pressed', 'true');
    updateRuntimeStrip();
  }

  document.addEventListener('app:langchange', () => {
    renderWarehouse();
    updateRuntimeStrip();
    renderStaffPanel();
    renderChartsPanel();
    renderSystemsPanel();
    if (state.running) {
      launchButton.textContent = t('operis_dashboard_live');
    }
  });

  launchButton.addEventListener('click', () => {
    if (!state.running) openDashboard();
  });

  renderWarehouse();
  updateZoneStates();
  updateRuntimeStrip();
  renderStaffPanel();
  renderChartsPanel();
  renderSystemsPanel();
  setupInteractions();

  setInterval(() => {
    if (!state.running) return;
    tick();
  }, 950);

  setInterval(() => {
    if (!state.running) return;
    animateTotes();
  }, 140);
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

  initOperisDashboard();
  initPlatformExplorer();
});
