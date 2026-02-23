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

  const state = {
    running: false,
    picksHour: 842,
    replHour: 416,
    flowState: 'Nominal',
    health: 98.9,
    selectedTile: 'revenue',
    summary: {
      revenue: 248400,
      profit: 61100,
      margin: 24.6,
      shipments: 1296,
      avgDelivery: 43
    },
    delivery: {
      within: 86,
      out: 14
    },
    countries: {
      nl: 34,
      de: 27,
      be: 21,
      fr: 18
    },
    fleet: {
      total: 128,
      moving: 91,
      maintenance: 9,
      health: 95.2
    },
    loading: {
      avgTime: 28,
      avgWeight: 612
    },
    avgDeliverySeries: [41, 40, 39, 40, 42, 41, 43, 44, 43, 42, 43, 43],
    profitSeries: [56, 58, 57, 59, 61, 63, 62, 64, 66, 67, 68, 69]
  };

  function currency(value) {
    return `€${Math.round(value).toLocaleString()}`;
  }

  function percentToStroke(percent, radius) {
    const circumference = 2 * Math.PI * radius;
    const value = Math.max(0, Math.min(100, percent));
    const dash = (value / 100) * circumference;
    return `${dash} ${circumference - dash}`;
  }

  function seriesToPoints(series, width, height, min, max) {
    return series.map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * width;
      const y = height - ((value - min) / Math.max(1, max - min)) * height;
      return `${x.toFixed(2)},${Math.max(4, Math.min(height - 2, y)).toFixed(2)}`;
    }).join(' ');
  }

  function renderWarehouse() {
    const onTime = state.delivery.within;
    const outTime = state.delivery.out;
    const ringStroke = percentToStroke(onTime, 44);

    const avgMin = Math.min(...state.avgDeliverySeries) - 2;
    const avgMax = Math.max(...state.avgDeliverySeries) + 2;
    const avgPoints = seriesToPoints(state.avgDeliverySeries, 340, 86, avgMin, avgMax);

    const profitMin = Math.min(...state.profitSeries) - 3;
    const profitMax = Math.max(...state.profitSeries) + 3;
    const profitPoints = seriesToPoints(state.profitSeries, 340, 86, profitMin, profitMax);

    const countryValues = Object.values(state.countries);
    const countryMax = Math.max(...countryValues, 1);

    warehouse.innerHTML = `
      <div class="operis-console">
        <div class="operis-console-header">
          <div>
            <div class="console-title">${t('operis_console_title')}</div>
            <div class="console-subtitle">${t('operis_console_subtitle')}</div>
          </div>
          <div class="console-period">${t('operis_period_label')}: ${t('operis_period_value')}</div>
        </div>

        <div class="operis-grid-board" role="group" aria-label="Operis interactive board">
          <div class="op-stack">
            <button class="op-card ${state.selectedTile === 'revenue' ? 'active' : ''}" type="button" data-tile="revenue">
              <div class="op-card-minititle">${t('operis_summary_revenue')}</div>
              <div class="op-card-value">${currency(state.summary.revenue)}</div>
              <div class="op-card-delta delta-up">+2.4%</div>
            </button>
            <button class="op-card ${state.selectedTile === 'profit' ? 'active' : ''}" type="button" data-tile="profit">
              <div class="op-card-minititle">${t('operis_summary_profit')}</div>
              <div class="op-card-value">${currency(state.summary.profit)}</div>
              <div class="op-card-delta delta-up">+1.7%</div>
            </button>
            <button class="op-card ${state.selectedTile === 'margin' ? 'active' : ''}" type="button" data-tile="margin">
              <div class="op-card-minititle">${t('operis_summary_margin')}</div>
              <div class="op-card-value">${state.summary.margin.toFixed(1)}%</div>
              <div class="op-card-delta ${state.summary.margin >= 24 ? 'delta-up' : 'delta-down'}">${state.summary.margin >= 24 ? '+' : '-'}0.3pt</div>
            </button>
            <button class="op-card ${state.selectedTile === 'shipments' ? 'active' : ''}" type="button" data-tile="shipments">
              <div class="op-card-minititle">${t('operis_summary_shipments')}</div>
              <div class="op-card-value">${Math.round(state.summary.shipments).toLocaleString()}</div>
              <div class="op-card-delta delta-up">+3.2%</div>
            </button>
            <button class="op-card ${state.selectedTile === 'avgDelivery' ? 'active' : ''}" type="button" data-tile="avgDelivery">
              <div class="op-card-minititle">${t('operis_summary_avg_delivery')}</div>
              <div class="op-card-value">${state.summary.avgDelivery.toFixed(0)}m</div>
              <div class="op-card-delta ${state.summary.avgDelivery <= 44 ? 'delta-up' : 'delta-down'}">${state.summary.avgDelivery <= 44 ? '-1.2m' : '+1.2m'}</div>
            </button>
          </div>

          <button class="op-card op-card-large ${state.selectedTile === 'delivery' ? 'active' : ''}" type="button" data-tile="delivery">
            <div>
              <div class="op-card-title">${t('operis_delivery_status')}</div>
              <div class="op-donut-wrap">
                <svg class="op-ring" viewBox="0 0 128 128" role="img" aria-label="Delivery status">
                  <circle class="op-ring-bg" cx="64" cy="64" r="44"></circle>
                  <circle class="op-ring-val" cx="64" cy="64" r="44" stroke-dasharray="${ringStroke}"></circle>
                  <text class="op-ring-label" x="64" y="56" text-anchor="middle">${t('operis_within_limit')}</text>
                  <text class="op-ring-value" x="64" y="76" text-anchor="middle">${onTime}%</text>
                </svg>
                <div class="op-list">
                  <div class="op-list-row"><span>${t('operis_within_limit')}</span><strong>${onTime}%</strong></div>
                  <div class="op-list-row"><span>${t('operis_out_of_limit')}</span><strong>${outTime}%</strong></div>
                </div>
              </div>
            </div>
            <div class="op-bottom-note">${t('operis_panel_delivery')}</div>
          </button>

          <button class="op-card op-card-large ${state.selectedTile === 'country' ? 'active' : ''}" type="button" data-tile="country">
            <div>
              <div class="op-card-title">${t('operis_deliveries_country')}</div>
              <svg class="op-country-chart" viewBox="0 0 320 106" role="img" aria-label="Deliveries by country">
                ${Object.entries(state.countries).map(([key, value], index) => {
                  const width = (value / countryMax) * 220;
                  const y = 12 + index * 22;
                  const color = ['#d4a531', '#9fc2e4', '#b58a5a', '#cfd9e6'][index] || '#d4a531';
                  return `<rect x="76" y="${y}" width="${width.toFixed(1)}" height="12" rx="6" fill="${color}"></rect><text x="12" y="${y + 10}" fill="#edf4fb" font-size="10">${key.toUpperCase()}</text><text x="${(84 + width).toFixed(1)}" y="${y + 10}" fill="#edf4fb" font-size="10">${value}%</text>`;
                }).join('')}
              </svg>
              <div class="op-country-legends">
                ${Object.entries(state.countries).map(([key, value], index) => {
                  const color = ['#d4a531', '#9fc2e4', '#b58a5a', '#cfd9e6'][index] || '#d4a531';
                  return `<span class="op-legend"><span class="op-legend-dot" style="background:${color}"></span>${key.toUpperCase()} ${value}%</span>`;
                }).join('')}
              </div>
            </div>
            <div class="op-bottom-note">${t('operis_panel_country')}</div>
          </button>

          <button class="op-card op-card-large ${state.selectedTile === 'fleet' ? 'active' : ''}" type="button" data-tile="fleet">
            <div>
              <div class="op-card-title">${t('operis_status_fleet')}</div>
              <svg class="op-gauge" viewBox="0 0 240 72" role="img" aria-label="Fleet health gauge">
                <path class="op-gauge-track" d="M20 58 A98 98 0 0 1 220 58"></path>
                <path class="op-gauge-value" d="M20 58 A98 98 0 0 1 ${20 + (state.fleet.health / 100) * 200} 58"></path>
                <text class="op-gauge-text" x="120" y="44" text-anchor="middle">${state.fleet.health.toFixed(1)}%</text>
              </svg>
              <div class="op-list">
                <div class="op-list-row"><span>${t('operis_total_fleet')}</span><strong>${state.fleet.total}</strong></div>
                <div class="op-list-row"><span>${t('operis_on_move')}</span><strong>${state.fleet.moving}</strong></div>
                <div class="op-list-row"><span>${t('operis_maintenance')}</span><strong>${state.fleet.maintenance}</strong></div>
              </div>
            </div>
            <div class="op-bottom-note">${t('operis_panel_fleet')}</div>
          </button>

          <button class="op-card op-card-large ${state.selectedTile === 'load' ? 'active' : ''}" type="button" data-tile="load">
            <div>
              <div class="op-card-title">${t('operis_avg_loading_time')} / ${t('operis_avg_loading_weight')}</div>
              <svg class="op-mix-chart" viewBox="0 0 340 110" role="img" aria-label="Loading performance">
                <polyline points="0,95 35,78 70,76 105,62 140,68 175,52 210,58 245,49 280,46 315,39 340,36" fill="none" stroke="#d4a531" stroke-width="3" stroke-linecap="round"></polyline>
                <polyline points="0,88 35,84 70,80 105,75 140,71 175,67 210,63 245,60 280,55 315,52 340,48" fill="none" stroke="#9fc2e4" stroke-width="3" stroke-linecap="round"></polyline>
              </svg>
              <div class="op-list">
                <div class="op-list-row"><span>${t('operis_avg_loading_time')}</span><strong>${state.loading.avgTime.toFixed(0)}m</strong></div>
                <div class="op-list-row"><span>${t('operis_avg_loading_weight')}</span><strong>${Math.round(state.loading.avgWeight)} kg</strong></div>
              </div>
            </div>
            <div class="op-bottom-note">${t('operis_panel_load')}</div>
          </button>

          <button class="op-card op-card-large ${state.selectedTile === 'avgtime' ? 'active' : ''}" type="button" data-tile="avgtime">
            <div>
              <div class="op-card-title">${t('operis_avg_delivery_time')}</div>
              <svg class="op-mix-chart" viewBox="0 0 340 110" role="img" aria-label="Average delivery trend">
                <polyline points="${avgPoints}" fill="none" stroke="#9fc2e4" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
            </div>
            <div class="op-bottom-note">${t('operis_panel_avgtime')}</div>
          </button>

          <button class="op-card op-card-large ${state.selectedTile === 'profitTrend' ? 'active' : ''}" type="button" data-tile="profitTrend">
            <div>
              <div class="op-card-title">${t('operis_profit_country')}</div>
              <svg class="op-profit-chart" viewBox="0 0 340 110" role="img" aria-label="Profit evolution chart">
                <polyline points="${profitPoints}" fill="none" stroke="#d4a531" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
            </div>
            <div class="op-bottom-note">${t('operis_panel_profit')}</div>
          </button>
        </div>
      </div>
    `;
  }

  function renderSupportPanels() {
    const laneValue = Math.round((state.delivery.within + state.fleet.health) / 2);
    const statusKey = laneValue > 88 ? 'operis_status_healthy' : laneValue > 80 ? 'operis_status_warning' : 'operis_status_critical';

    staffPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_workforce')}</h3>
      <div class="operis-staff-list">
        <div class="staff-row"><div class="staff-main"><div class="staff-name">${t('operis_zone_pick_east')}</div><div class="staff-zone">A-Team</div></div><div class="staff-metric"><span class="staff-status healthy">${t('operis_status_healthy')}</span></div></div>
        <div class="staff-row"><div class="staff-main"><div class="staff-name">${t('operis_zone_repl_core')}</div><div class="staff-zone">B-Team</div></div><div class="staff-metric"><span class="staff-status warning">${t('operis_status_warning')}</span></div></div>
      </div>
    `;

    chartsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_flow')}</h3>
      <div class="operis-chart-wrap">
        <svg class="operis-mini-chart" viewBox="0 0 320 80" role="img" aria-label="Flow trend">
          <polyline points="${seriesToPoints(state.avgDeliverySeries, 320, 70, 35, 48)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></polyline>
        </svg>
      </div>
    `;

    systemsPanel.innerHTML = `
      <h3 class="operis-panel-title">${t('operis_panel_system_layers')}</h3>
      <div class="system-grid">
        <div class="system-tile"><div class="system-name">WMS</div><div class="system-value">${Math.max(97.1, state.health - 0.4).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">WCS</div><div class="system-value">${Math.max(96.8, state.health - 0.8).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">TMS</div><div class="system-value">${Math.max(96.4, state.health - 1.1).toFixed(2)}%</div></div>
        <div class="system-tile"><div class="system-name">OPS</div><div class="system-value">${Math.max(97.0, state.health - 0.6).toFixed(2)}%</div></div>
      </div>
      <div class="op-bottom-note">${t(statusKey)}</div>
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

  function updateHealthAndFlow() {
    const onTimeScore = state.delivery.within;
    const fleetScore = state.fleet.health;
    const marginScore = Math.min(100, state.summary.margin * 3.5);
    state.health = (onTimeScore + fleetScore + marginScore) / 3;

    if (state.delivery.within < 80 || state.fleet.health < 90) state.flowState = 'Constrained';
    else if (state.delivery.within < 87 || state.fleet.health < 94) state.flowState = 'Watch';
    else state.flowState = 'Nominal';
  }

  function applyTileAction(tile) {
    state.selectedTile = tile;

    if (tile === 'revenue') state.summary.revenue += 650 + Math.random() * 420;
    if (tile === 'profit') state.summary.profit += 180 + Math.random() * 130;
    if (tile === 'margin') state.summary.margin = Math.max(21, Math.min(29, state.summary.margin + (Math.random() - 0.5) * 0.45));
    if (tile === 'shipments') {
      state.summary.shipments = Math.max(860, state.summary.shipments + (Math.random() - 0.4) * 44);
      state.picksHour = 700 + state.summary.shipments * 0.11;
    }
    if (tile === 'avgDelivery') {
      state.summary.avgDelivery = Math.max(32, Math.min(58, state.summary.avgDelivery + (Math.random() - 0.6) * 2.3));
    }

    if (tile === 'delivery') {
      const withinShift = (Math.random() - 0.4) * 1.8;
      state.delivery.within = Math.max(74, Math.min(96, state.delivery.within + withinShift));
      state.delivery.out = 100 - state.delivery.within;
    }

    if (tile === 'country') {
      const keys = Object.keys(state.countries);
      const source = keys[Math.floor(Math.random() * keys.length)];
      const target = keys[Math.floor(Math.random() * keys.length)];
      if (source !== target && state.countries[source] > 12) {
        state.countries[source] -= 1;
        state.countries[target] += 1;
      }
    }

    if (tile === 'fleet') {
      state.fleet.moving = Math.max(74, Math.min(state.fleet.total - state.fleet.maintenance, state.fleet.moving + Math.round((Math.random() - 0.35) * 5)));
      state.fleet.health = Math.max(88, Math.min(99.8, state.fleet.health + (Math.random() - 0.45) * 0.9));
    }

    if (tile === 'load') {
      state.loading.avgTime = Math.max(19, Math.min(44, state.loading.avgTime + (Math.random() - 0.45) * 1.5));
      state.loading.avgWeight = Math.max(460, Math.min(760, state.loading.avgWeight + (Math.random() - 0.5) * 22));
      state.replHour = Math.max(260, Math.min(880, state.replHour + (Math.random() - 0.45) * 18));
    }

    if (tile === 'avgtime') {
      const next = Math.max(35, Math.min(48, state.summary.avgDelivery + (Math.random() - 0.5) * 2.2));
      state.avgDeliverySeries.push(next);
      if (state.avgDeliverySeries.length > 12) state.avgDeliverySeries.shift();
      state.summary.avgDelivery = next;
    }

    if (tile === 'profitTrend') {
      const last = state.profitSeries[state.profitSeries.length - 1] || 62;
      state.profitSeries.push(Math.max(48, Math.min(82, last + (Math.random() - 0.35) * 2.3)));
      if (state.profitSeries.length > 12) state.profitSeries.shift();
    }

    updateHealthAndFlow();
    updateRuntimeStrip();
    renderWarehouse();
    renderSupportPanels();
  }

  function tick() {
    if (!state.running) return;

    state.summary.revenue = Math.max(180000, state.summary.revenue + (Math.random() - 0.35) * 1700);
    state.summary.profit = Math.max(42000, state.summary.profit + (Math.random() - 0.38) * 610);
    state.summary.margin = Math.max(20, Math.min(30, state.summary.margin + (Math.random() - 0.45) * 0.25));

    state.summary.shipments = Math.max(840, state.summary.shipments + (Math.random() - 0.4) * 18);
    state.summary.avgDelivery = Math.max(36, Math.min(50, state.summary.avgDelivery + (Math.random() - 0.53) * 0.55));

    state.picksHour = Math.max(500, Math.min(1650, 680 + state.summary.shipments * 0.13 + (Math.random() - 0.5) * 14));
    state.replHour = Math.max(280, Math.min(980, state.replHour + (Math.random() - 0.47) * 9));

    state.delivery.within = Math.max(75, Math.min(96, state.delivery.within + (Math.random() - 0.47) * 0.55));
    state.delivery.out = 100 - state.delivery.within;

    state.fleet.moving = Math.max(70, Math.min(state.fleet.total - state.fleet.maintenance, state.fleet.moving + Math.round((Math.random() - 0.48) * 2)));
    state.fleet.health = Math.max(88, Math.min(99.9, state.fleet.health + (Math.random() - 0.5) * 0.34));

    const avgNext = Math.max(35, Math.min(49, state.summary.avgDelivery + (Math.random() - 0.5) * 1.1));
    state.avgDeliverySeries.push(avgNext);
    if (state.avgDeliverySeries.length > 12) state.avgDeliverySeries.shift();

    const profitNext = Math.max(48, Math.min(82, (state.profitSeries[state.profitSeries.length - 1] || 60) + (Math.random() - 0.45) * 1.45));
    state.profitSeries.push(profitNext);
    if (state.profitSeries.length > 12) state.profitSeries.shift();

    updateHealthAndFlow();
    updateRuntimeStrip();
    renderWarehouse();
    renderSupportPanels();
  }

  function setupInteractions() {
    warehouse.addEventListener('click', (event) => {
      const tile = event.target.closest('[data-tile]');
      if (!tile) return;
      const tileKey = tile.getAttribute('data-tile');
      if (!tileKey) return;
      applyTileAction(tileKey);
    });

    warehouse.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const tile = event.target.closest('[data-tile]');
      if (!tile) return;
      event.preventDefault();
      const tileKey = tile.getAttribute('data-tile');
      if (!tileKey) return;
      applyTileAction(tileKey);
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
  }, 950);
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
