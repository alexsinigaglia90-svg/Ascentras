(function initPremiumStaticPages() {
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setupCardTilt() {
    const cards = Array.from(document.querySelectorAll('[data-premium-card]'));
    if (!cards.length || prefersReducedMotion()) return;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(980px) rotateX(${(-ny * 4.6).toFixed(2)}deg) rotateY(${(nx * 5.4).toFixed(2)}deg) translateY(-2px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(980px) rotateX(0deg) rotateY(0deg) translateY(0px)';
      });
    });
  }

  function setupMagneticButtons() {
    const buttons = Array.from(document.querySelectorAll('.page-actions .btn'));
    if (!buttons.length || prefersReducedMotion()) return;

    buttons.forEach((button) => {
      button.addEventListener('mousemove', (event) => {
        const rect = button.getBoundingClientRect();
        const nx = (event.clientX - rect.left) / rect.width - 0.5;
        const ny = (event.clientY - rect.top) / rect.height - 0.5;
        button.style.transform = `translate(${(nx * 6).toFixed(2)}px, ${(ny * 4).toFixed(2)}px)`;
      });

      button.addEventListener('mouseleave', () => {
        button.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  function setupOrbParallax() {
    const shell = document.querySelector('.page-shell');
    const orbs = Array.from(document.querySelectorAll('.page-orb'));
    if (!shell || !orbs.length || prefersReducedMotion()) return;

    shell.addEventListener('mousemove', (event) => {
      const rect = shell.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;

      orbs.forEach((orb, index) => {
        const factor = index === 0 ? 16 : -14;
        orb.style.transform = `translate(${(nx * factor).toFixed(2)}px, ${(ny * factor * 0.65).toFixed(2)}px)`;
      });
    });

    shell.addEventListener('mouseleave', () => {
      orbs.forEach((orb) => {
        orb.style.transform = 'translate(0px, 0px)';
      });
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setupCardTilt();
    setupMagneticButtons();
    setupOrbParallax();
  });
})();
