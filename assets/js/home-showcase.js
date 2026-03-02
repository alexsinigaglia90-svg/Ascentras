(function initHomeShowcase() {
  function init() {
    const root = document.querySelector('[data-home-showcase]');
    if (!root) return;

    const tabs = Array.from(root.querySelectorAll('.home-showcase-tab'));
    const title = root.querySelector('#showcase-title');
    const desc = root.querySelector('#showcase-desc');
    const points = root.querySelector('#showcase-points');
    const link = root.querySelector('#showcase-link');

    if (!tabs.length || !title || !desc || !points || !link) return;

    const content = {
      ascentra: {
        title: 'Supply Chain Consultancy',
        desc: 'Ascentra vertaalt strategie naar uitvoerbare supply-chain ontwerpen met governance en meetbare impact.',
        points: [
          'Operating model alignment',
          'Network and process redesign',
          'Execution governance'
        ],
        cta: 'Open Ascentra',
        href: '/ascentra'
      },
      operis: {
        title: 'Warehousing & Logistics Operations',
        desc: 'Operis stuurt de warehousevloer met focus op throughput, capaciteit en serviceperformance.',
        points: [
          'Shift control en vloerorkestratie',
          'Bottleneck management',
          'Realtime performance dashboards'
        ],
        cta: 'Open Operis',
        href: '/operis'
      },
      astra: {
        title: 'Hard- en Software Development',
        desc: 'Astra ontwikkelt hard- en softwareoplossingen voor slimme, schaalbare warehouse-automatisering.',
        points: [
          'Industrial hardware engineering',
          'Warehouse software architecture',
          'Integratie en deployment in operatie'
        ],
        cta: 'Open Astra',
        href: '/astra'
      }
    };

    function render(unit) {
      const item = content[unit] || content.ascentra;

      tabs.forEach((tab) => {
        const selected = tab.dataset.showcaseUnit === unit;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
      });

      title.textContent = item.title;
      desc.textContent = item.desc;
      points.innerHTML = item.points.map((entry) => `<li>${entry}</li>`).join('');
      link.textContent = item.cta;
      link.setAttribute('href', item.href);
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        render(tab.dataset.showcaseUnit || 'ascentra');
      });

      tab.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();

        const step = event.key === 'ArrowRight' ? 1 : -1;
        const next = (index + step + tabs.length) % tabs.length;
        tabs[next].focus({ preventScroll: true });
        render(tabs[next].dataset.showcaseUnit || 'ascentra');
      });
    });

    render('ascentra');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
