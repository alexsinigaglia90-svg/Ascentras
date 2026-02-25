function smoothScrollTo(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth' });
}

function initPageTransitions() {
  document.querySelectorAll('a[data-page-transition]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.defaultPrevented) return;
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
    operis_console_title: 'Dashboard to analyze impact of warehouse management system',
    operis_console_subtitle: 'Operational control panel with live logistics performance, fleet movement, and warehouse execution insights.',
    operis_period_label: 'Time Period',
    operis_period_value: 'Last Month',
    operis_summary_revenue: 'Total Revenue',
    operis_summary_profit: 'Profit',
    operis_summary_margin: 'Margin',
    operis_summary_shipments: 'Number of Shipments',
    operis_summary_avg_delivery: 'Average Delivery Time',
    operis_delivery_status: 'Delivery Status',
    operis_within_limit: 'Within Time Limit',
    operis_out_of_limit: 'Out of Time Limit',
    operis_deliveries_country: 'Deliveries by Country',
    operis_status_fleet: 'Status of Fleet',
    operis_total_fleet: 'Total Fleet',
    operis_on_move: 'On the Move',
    operis_maintenance: 'In Maintenance',
    operis_avg_loading_time: 'Avg Loading Time',
    operis_avg_loading_weight: 'Avg Loading Weight',
    operis_avg_delivery_time: 'Average Delivery Time',
    operis_profit_country: 'Profit by Country',
    operis_route: 'Route',
    operis_time: 'Time',
    operis_panel_revenue: 'Revenue pulse and trend',
    operis_panel_delivery: 'Delivery compliance and SLA',
    operis_panel_country: 'Country split and distribution',
    operis_panel_fleet: 'Fleet health and utilization',
    operis_panel_load: 'Loading performance and throughput',
    operis_panel_avgtime: 'Average delivery trend',
    operis_panel_profit: 'Profit evolution by country',
    operis_dashboard_headline: 'Picking Zone Performance Command',
    operis_dashboard_subheadline: 'Direct labor monitoring with station-level efficiency and throughput control.',
    operis_direct_labor: 'Direct Labor',
    operis_throughput: 'Throughput',
    operis_efficiency: 'Efficiency',
    operis_active_stations: 'Active Stations',
    operis_zone_network: 'Picking Zone Network',
    operis_station_panel: 'Stations',
    operis_employee_compare: 'Employee Compare',
    operis_history_days: 'history',
    operis_period_30: '30 days',
    operis_period_60: '60 days',
    operis_period_90: '90 days',
    operis_metric_trend: 'units / hour',
    operis_staff_watch: 'Team Watch',
    operis_zone_focus: 'Zone Focus',
    operis_station_focus: 'Station Focus',
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
    operis_console_title: 'Dashboard om impact van warehouse management te analyseren',
    operis_console_subtitle: 'Operationeel controlepaneel met live logistieke prestaties, vlootbeweging en warehouse executie-inzicht.',
    operis_period_label: 'Periode',
    operis_period_value: 'Afgelopen maand',
    operis_summary_revenue: 'Totale omzet',
    operis_summary_profit: 'Winst',
    operis_summary_margin: 'Marge',
    operis_summary_shipments: 'Aantal zendingen',
    operis_summary_avg_delivery: 'Gemiddelde levertijd',
    operis_delivery_status: 'Leverstatus',
    operis_within_limit: 'Binnen tijdslimiet',
    operis_out_of_limit: 'Buiten tijdslimiet',
    operis_deliveries_country: 'Leveringen per land',
    operis_status_fleet: 'Status van vloot',
    operis_total_fleet: 'Totale vloot',
    operis_on_move: 'Onderweg',
    operis_maintenance: 'In onderhoud',
    operis_avg_loading_time: 'Gem. laadtijd',
    operis_avg_loading_weight: 'Gem. laadgewicht',
    operis_avg_delivery_time: 'Gemiddelde levertijd',
    operis_profit_country: 'Winst per land',
    operis_route: 'Route',
    operis_time: 'Tijd',
    operis_panel_revenue: 'Omzetpuls en trend',
    operis_panel_delivery: 'Leverbetrouwbaarheid en SLA',
    operis_panel_country: 'Landverdeling en spreiding',
    operis_panel_fleet: 'Vlootgezondheid en inzet',
    operis_panel_load: 'Laadprestatie en throughput',
    operis_panel_avgtime: 'Gemiddelde levertijd trend',
    operis_panel_profit: 'Winstontwikkeling per land',
    operis_dashboard_headline: 'Picking Zone Performance Command',
    operis_dashboard_subheadline: 'Direct labor monitoring met station-niveau efficiëntie en throughput sturing.',
    operis_direct_labor: 'Direct Labor',
    operis_throughput: 'Throughput',
    operis_efficiency: 'Efficiëntie',
    operis_active_stations: 'Actieve Stations',
    operis_zone_network: 'Picking Zone Netwerk',
    operis_station_panel: 'Stations',
    operis_employee_compare: 'Medewerker Vergelijking',
    operis_history_days: 'historie',
    operis_period_30: '30 dagen',
    operis_period_60: '60 dagen',
    operis_period_90: '90 dagen',
    operis_metric_trend: 'units / uur',
    operis_staff_watch: 'Team Overzicht',
    operis_zone_focus: 'Zone Focus',
    operis_station_focus: 'Station Focus',
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

  function seriesToPoints(series, width, height, min, max) {
    return series.map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * width;
      const y = height - ((value - min) / Math.max(1, max - min)) * height;
      return `${x.toFixed(2)},${Math.max(4, Math.min(height - 2, y)).toFixed(2)}`;
    }).join(' ');
  }

  function seededSeries(seed, base, drift) {
    let current = base;
    const out = [];
    for (let index = 0; index < 90; index += 1) {
      const wave = Math.sin((index + seed) / 6) * 2.4;
      const micro = Math.cos((index + seed * 2) / 9) * 1.6;
      const bump = ((index + seed) % 11 === 0 ? 2.2 : 0) - ((index + seed) % 17 === 0 ? 1.4 : 0);
      current = Math.max(54, Math.min(132, current + drift + wave * 0.22 + micro * 0.18 + bump * 0.12));
      out.push(Number(current.toFixed(1)));
    }
    return out;
  }

  const state = {
    running: false,
    flowState: 'Nominal',
    health: 97.8,
    period: 30,
    selectedZone: 'pick-east',
    selectedStation: 'E-01',
    selectedEmployees: ['emma', 'noah', 'sara'],
    zones: [
      { id: 'pick-east', nameKey: 'operis_zone_pick_east', labor: 16, throughput: 438, stations: ['E-01', 'E-02', 'E-03', 'E-04'] },
      { id: 'pick-west', nameKey: 'operis_zone_pick_west', labor: 15, throughput: 412, stations: ['W-01', 'W-02', 'W-03', 'W-04'] },
      { id: 'repl-core', nameKey: 'operis_zone_repl_core', labor: 10, throughput: 205, stations: ['R-01', 'R-02', 'R-03'] },
      { id: 'buffer-north', nameKey: 'operis_zone_buffer_north', labor: 9, throughput: 184, stations: ['B-01', 'B-02', 'B-03'] },
      { id: 'sortation', nameKey: 'operis_zone_sortation', labor: 12, throughput: 261, stations: ['S-01', 'S-02', 'S-03', 'S-04'] }
    ],
    employees: {
      emma: { name: 'Emma V.', role: 'Picker', series: seededSeries(2, 92, 0.06) },
      noah: { name: 'Noah K.', role: 'Picker', series: seededSeries(7, 88, 0.05) },
      sara: { name: 'Sara D.', role: 'Replenisher', series: seededSeries(12, 84, 0.04) },
      liam: { name: 'Liam R.', role: 'Picker', series: seededSeries(19, 90, 0.03) },
      mila: { name: 'Mila T.', role: 'Sortation', series: seededSeries(24, 86, 0.05) }
    }
  };

  function getZone(zoneId) {
    return state.zones.find((zone) => zone.id === zoneId) || state.zones[0];
  }

  function zoneEfficiency(zone) {
    return (zone.throughput / Math.max(1, zone.labor * 28)) * 100;
  }

  function getTotals() {
    const picksHour = state.zones.reduce((sum, zone) => sum + zone.throughput, 0);
    const replHour = getZone('repl-core').throughput;
    const labor = state.zones.reduce((sum, zone) => sum + zone.labor, 0);
    const stations = state.zones.reduce((sum, zone) => sum + zone.stations.length, 0);
    const efficiency = state.zones.reduce((sum, zone) => sum + zoneEfficiency(zone), 0) / state.zones.length;
    return { picksHour, replHour, labor, stations, efficiency };
  }

  function updateHealthAndFlow() {
    const totals = getTotals();
    const efficiencyScore = Math.max(72, Math.min(99.7, totals.efficiency));
    const laborBalance = Math.max(76, Math.min(99, 100 - Math.abs(totals.labor - 62) * 1.1));
    state.health = (efficiencyScore + laborBalance + 96.2) / 3;

    if (state.health < 88 || totals.efficiency < 82) state.flowState = 'Constrained';
    else if (state.health < 93 || totals.efficiency < 89) state.flowState = 'Watch';
    else state.flowState = 'Nominal';
  }

  function updateRuntimeStrip() {
    const totals = getTotals();
    const picks = document.getElementById('operis-picks-hour');
    const repl = document.getElementById('operis-repl-hour');
    const flow = document.getElementById('operis-flow-state');
    const health = document.getElementById('operis-health');
    const mode = document.getElementById('operis-mode');

    if (picks) picks.textContent = `${Math.round(totals.picksHour)}`;
    if (repl) repl.textContent = `${Math.round(totals.replHour)}`;
    if (flow) flow.textContent = flowText(state.flowState);
    if (health) health.textContent = `${state.health.toFixed(2)}%`;
    if (mode) mode.textContent = state.running ? t('operis_mode_live') : t('operis_mode_standby');
  }

  function renderChart() {
    const colors = ['var(--accent)', 'var(--gold)', 'var(--blue)'];
    const activeEmployees = state.selectedEmployees.map((id) => state.employees[id]).filter(Boolean);
    const allValues = activeEmployees.flatMap((entry) => entry.series.slice(-state.period));
    const min = Math.min(...allValues, 60) - 4;
    const max = Math.max(...allValues, 120) + 4;

    const lineMarkup = activeEmployees.map((entry, index) => {
      const values = entry.series.slice(-state.period);
      const points = seriesToPoints(values, 640, 220, min, max);
      return `<polyline points="${points}" fill="none" stroke="${colors[index % colors.length]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>`;
    }).join('');

    const legendMarkup = state.selectedEmployees.map((id, index) => {
      const employee = state.employees[id];
      const value = employee.series[employee.series.length - 1];
      return `<div class="opx-legend-item"><span class="opx-legend-dot tone-${(index % colors.length) + 1}"></span><span>${employee.name}</span><strong>${value.toFixed(1)}</strong></div>`;
    }).join('');

    return `
      <div class="opx-chart-card">
        <div class="opx-chart-head">
          <h3>${t('operis_employee_compare')}</h3>
          <div class="opx-periods" role="group" aria-label="History period">
            <button class="opx-period ${state.period === 30 ? 'active' : ''}" type="button" data-period="30">${t('operis_period_30')}</button>
            <button class="opx-period ${state.period === 60 ? 'active' : ''}" type="button" data-period="60">${t('operis_period_60')}</button>
            <button class="opx-period ${state.period === 90 ? 'active' : ''}" type="button" data-period="90">${t('operis_period_90')}</button>
          </div>
        </div>
        <div class="opx-employee-pills" role="group" aria-label="Employee selection">
          ${Object.entries(state.employees).map(([id, employee]) => `
            <button class="opx-employee-pill ${state.selectedEmployees.includes(id) ? 'active' : ''}" type="button" data-employee="${id}">
              <span>${employee.name}</span>
              <small>${employee.role}</small>
            </button>
          `).join('')}
        </div>
        <svg class="opx-trend" viewBox="0 0 640 220" role="img" aria-label="Employee throughput trend chart">
          <g class="opx-grid">
            <line x1="0" y1="20" x2="640" y2="20"></line>
            <line x1="0" y1="75" x2="640" y2="75"></line>
            <line x1="0" y1="130" x2="640" y2="130"></line>
            <line x1="0" y1="185" x2="640" y2="185"></line>
          </g>
          ${lineMarkup}
        </svg>
        <div class="opx-chart-meta">
          <span>${state.period} ${t('operis_history_days')} · ${t('operis_metric_trend')}</span>
          <div class="opx-legend">${legendMarkup}</div>
        </div>
      </div>
    `;
  }

  function renderWarehouse() {
    const zone = getZone(state.selectedZone);
    const totals = getTotals();
    const stationFocus = state.selectedStation || zone.stations[0];

    warehouse.innerHTML = `
      <div class="opx-shell">
        <div class="opx-head">
          <div>
            <div class="opx-title">${t('operis_dashboard_headline')}</div>
            <div class="opx-subtitle">${t('operis_dashboard_subheadline')}</div>
          </div>
          <div class="opx-focus">
            <span>${t('operis_zone_focus')}: <strong>${t(zone.nameKey)}</strong></span>
            <span>${t('operis_station_focus')}: <strong>${stationFocus}</strong></span>
          </div>
        </div>

        <div class="opx-kpis">
          <div class="opx-kpi"><span>${t('operis_direct_labor')}</span><strong>${totals.labor}</strong></div>
          <div class="opx-kpi"><span>${t('operis_throughput')}</span><strong>${Math.round(totals.picksHour)}</strong></div>
          <div class="opx-kpi"><span>${t('operis_efficiency')}</span><strong>${totals.efficiency.toFixed(1)}%</strong></div>
          <div class="opx-kpi"><span>${t('operis_active_stations')}</span><strong>${totals.stations}</strong></div>
        </div>

        <div class="opx-main-grid">
          <div class="opx-zone-card">
            <h3>${t('operis_zone_network')}</h3>
            <div class="opx-zones" role="group" aria-label="Picking zones">
              ${state.zones.map((entry) => {
                const isActive = state.selectedZone === entry.id;
                return `
                  <button class="opx-zone ${isActive ? 'active' : ''}" type="button" data-zone="${entry.id}">
                    <div class="opx-zone-name">${t(entry.nameKey)}</div>
                    <div class="opx-zone-row"><span>${t('operis_direct_labor')}</span><strong>${entry.labor}</strong></div>
                    <div class="opx-zone-row"><span>${t('operis_throughput')}</span><strong>${Math.round(entry.throughput)}</strong></div>
                    <div class="opx-zone-stations">${entry.stations.map((station) => `<span>${station}</span>`).join('')}</div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <div class="opx-station-card">
            <h3>${t('operis_station_panel')}</h3>
            <div class="opx-stations">
              ${zone.stations.map((station) => `
                <button class="opx-station ${stationFocus === station ? 'active' : ''}" type="button" data-station="${station}">
                  <span>${station}</span>
                  <small>${Math.round(zone.throughput / zone.stations.length)} u/h</small>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        ${renderChart()}
      </div>
    `;
  }

  function renderSupportPanels() {
    const zone = getZone(state.selectedZone);
    const sortedEmployees = Object.values(state.employees)
      .map((employee) => ({
        ...employee,
        current: employee.series[employee.series.length - 1]
      }))
      .sort((a, b) => b.current - a.current);

    staffPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_staff_watch')}</h3>
      <div class="operis-staff-list">
        ${sortedEmployees.slice(0, 4).map((employee, index) => `
          <div class="staff-row">
            <div class="staff-main">
              <div class="staff-name">${employee.name}</div>
              <div class="staff-zone">${employee.role}</div>
            </div>
            <div class="staff-metric"><span class="staff-status ${index === 0 ? 'healthy' : index === 1 ? 'warning' : 'critical'}">${employee.current.toFixed(1)}</span></div>
          </div>
        `).join('')}
      </div>
    `;

    chartsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_flow')}</h3>
      <div class="operis-chart-wrap">
        <svg class="operis-mini-chart" viewBox="0 0 320 80" role="img" aria-label="Zone trend">
          <polyline points="${seriesToPoints(zone.stations.map((_, idx) => zone.throughput / zone.stations.length + idx * 3), 320, 70, 60, 130)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
      </div>
    `;

    systemsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_system_layers')}</h3>
      <div class="system-grid">
        <div class="system-tile"><div class="system-name">WMS</div><div class="system-value">${Math.max(95.2, state.health - 0.4).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">WCS</div><div class="system-value">${Math.max(94.6, state.health - 0.8).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">LM</div><div class="system-value">${Math.max(94.0, state.health - 1.0).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">OPS</div><div class="system-value">${Math.max(94.8, state.health - 0.6).toFixed(2)}%</div></div>
      </div>
      <div class="op-bottom-note">${flowText(state.flowState)}</div>
    `;
  }

  function tick() {
    if (!state.running) return;

    state.zones.forEach((zone, index) => {
      zone.throughput = Math.max(140, Math.min(520, zone.throughput + (Math.random() - 0.47) * (14 + index * 2)));
      zone.labor = Math.max(7, Math.min(22, zone.labor + (Math.random() - 0.5) * 0.3));
    });

    Object.values(state.employees).forEach((employee, index) => {
      const last = employee.series[employee.series.length - 1] || 84;
      const next = Math.max(54, Math.min(132, last + (Math.random() - 0.48) * (3.1 + index * 0.18)));
      employee.series.push(Number(next.toFixed(1)));
      if (employee.series.length > 90) employee.series.shift();
    });

    updateHealthAndFlow();
    updateRuntimeStrip();
    renderWarehouse();
    renderSupportPanels();
  }

  function setupInteractions() {
    warehouse.addEventListener('click', (event) => {
      const zoneButton = event.target.closest('[data-zone]');
      if (zoneButton) {
        const zoneId = zoneButton.getAttribute('data-zone');
        const zone = getZone(zoneId);
        state.selectedZone = zone.id;
        state.selectedStation = zone.stations[0];
        renderWarehouse();
        renderSupportPanels();
        return;
      }

      const stationButton = event.target.closest('[data-station]');
      if (stationButton) {
        const stationId = stationButton.getAttribute('data-station');
        state.selectedStation = stationId;
        renderWarehouse();
        return;
      }

      const periodButton = event.target.closest('[data-period]');
      if (periodButton) {
        const nextPeriod = Number(periodButton.getAttribute('data-period'));
        if ([30, 60, 90].includes(nextPeriod)) {
          state.period = nextPeriod;
          renderWarehouse();
        }
        return;
      }

      const employeeButton = event.target.closest('[data-employee]');
      if (employeeButton) {
        const employeeId = employeeButton.getAttribute('data-employee');
        const exists = state.selectedEmployees.includes(employeeId);

        if (exists && state.selectedEmployees.length > 1) {
          state.selectedEmployees = state.selectedEmployees.filter((id) => id !== employeeId);
        } else if (!exists) {
          if (state.selectedEmployees.length >= 3) {
            state.selectedEmployees = state.selectedEmployees.slice(1);
          }
          state.selectedEmployees.push(employeeId);
        }

        renderWarehouse();
      }
    });
  }

  function openDashboard() {
    state.running = true;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    launchButton.textContent = t('operis_dashboard_live');
    launchButton.setAttribute('aria-pressed', 'true');
    updateHealthAndFlow();
    updateRuntimeStrip();
  }

  document.addEventListener('app:langchange', () => {
    renderWarehouse();
    renderSupportPanels();
    updateRuntimeStrip();
    if (state.running) {
      launchButton.textContent = t('operis_dashboard_live');
      launchButton.setAttribute('aria-pressed', 'true');
    } else {
      launchButton.textContent = t('operis_open_dashboard');
      launchButton.setAttribute('aria-pressed', 'false');
    }
  });

  launchButton.addEventListener('click', () => {
    if (!state.running) {
      openDashboard();
      return;
    }
    state.running = false;
    launchButton.textContent = t('operis_open_dashboard');
    launchButton.setAttribute('aria-pressed', 'false');
    updateRuntimeStrip();
  });

  renderWarehouse();
  updateHealthAndFlow();
  updateRuntimeStrip();
  renderSupportPanels();
  setupInteractions();

  setInterval(() => {
    if (!state.running) return;
    tick();
  }, 900);
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
      heroVideo.classList.remove('is-hidden');
      heroFallback.classList.remove('is-visible');
    });
    heroVideo.addEventListener('error', () => {
      heroVideo.classList.add('is-hidden');
      heroFallback.classList.add('is-visible');
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

  initPageTransitions();
  initOperisDashboard();
  initPlatformExplorer();
});
