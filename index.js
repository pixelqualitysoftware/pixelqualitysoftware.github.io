// Keep the initial visible if GitHub cannot serve an avatar (including gallery copies).
document.addEventListener('error', (event) => {
  if (event.target.matches?.('.member-avatar img')) event.target.hidden = true;
}, true);

const menuToggle = document.querySelector('.menu-toggle');
const mainNavigation = document.querySelector('#main-navigation');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
});
mainNavigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    menuToggle.focus();
  }
});
const desktopCards = window.matchMedia('(min-width: 1001px)');
desktopCards.addEventListener('change', closeMenu);
document.documentElement.classList.add('js');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const revealTargets = document.querySelectorAll('.section-heading, .project-card, .member, .join-grid > div');
let revealObserver;

function configureReveals() {
  revealObserver?.disconnect();
  revealTargets.forEach((target) => target.classList.remove('reveal-pending', 'reveal-ready'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove('reveal-pending');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -24px 0px' });

  revealTargets.forEach((target) => {
    // Don't animate content already visible, including direct anchor visits.
    if (target.getBoundingClientRect().top < window.innerHeight) return;
    target.classList.add('reveal-ready', 'reveal-pending');
    revealObserver.observe(target);
  });
}
reducedMotion.addEventListener('change', configureReveals);
configureReveals();

// Ease background layers toward pointer/scroll targets, then stop drawing at rest.
const glowSections = [...document.querySelectorAll('main > section')];
const visibleGlows = new Set(glowSections);
const glowState = new Map(glowSections.map((section) => [section, { x: 0, y: 0, hue: 0 }]));
let pointerX = 0;
let pointerY = 0;
let movementHue = 0;
let previousPointer = null;
let glowFrame = 0;
let previousFrameTime = 0;

function requestGlowFrame() {
  if (glowFrame || reducedMotion.matches || document.hidden) return;
  glowFrame = requestAnimationFrame(updateGlows);
}

function updateGlows(time) {
  glowFrame = 0;
  const elapsed = previousFrameTime ? Math.min(time - previousFrameTime, 64) : 16;
  previousFrameTime = time;
  const positionEase = 1 - Math.exp(-elapsed / 650);
  const colorEase = 1 - Math.exp(-elapsed / 1800);
  const targetHue = window.scrollY * .025 + movementHue;
  let moving = false;

  // Read geometry before writing styles to avoid repeated layout work.
  const targets = [...visibleGlows].map((section) => {
    const rect = section.getBoundingClientRect();
    const scrollOffset = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
    return { section, x: pointerX * Math.min(innerWidth * .035, 48), y: pointerY * 30 + scrollOffset * 24 };
  });
  for (const { section, x, y } of targets) {
    const state = glowState.get(section);
    state.x += (x - state.x) * positionEase;
    state.y += (y - state.y) * positionEase;
    state.hue += (targetHue - state.hue) * colorEase;
    section.style.setProperty('--glow-x', `${state.x.toFixed(2)}px`);
    section.style.setProperty('--glow-y', `${state.y.toFixed(2)}px`);
    section.style.setProperty('--glow-hue', `${state.hue.toFixed(2)}deg`);
    if (Math.abs(x - state.x) > .1 || Math.abs(y - state.y) > .1 || Math.abs(targetHue - state.hue) > .1) moving = true;
  }
  if (moving) requestGlowFrame();
  else previousFrameTime = 0;
}

window.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || reducedMotion.matches) return;
  pointerX = event.clientX / innerWidth * 2 - 1;
  pointerY = event.clientY / innerHeight * 2 - 1;
  if (previousPointer) movementHue += Math.min(80, Math.hypot(event.clientX - previousPointer.x, event.clientY - previousPointer.y)) * .008;
  previousPointer = { x: event.clientX, y: event.clientY };
  requestGlowFrame();
}, { passive: true });
document.documentElement.addEventListener('pointerleave', () => {
  pointerX = pointerY = 0;
  previousPointer = null;
  requestGlowFrame();
});
window.addEventListener('scroll', requestGlowFrame, { passive: true });
window.addEventListener('resize', requestGlowFrame);

if ('IntersectionObserver' in window) {
  const glowObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) visibleGlows.add(target);
      else visibleGlows.delete(target);
    });
    requestGlowFrame();
  });
  glowSections.forEach((section) => glowObserver.observe(section));
}

function resetGlowAnimation() {
  cancelAnimationFrame(glowFrame);
  glowFrame = previousFrameTime = 0;
  previousPointer = null;
  if (reducedMotion.matches) {
    pointerX = pointerY = movementHue = 0;
    glowSections.forEach((section) => {
      glowState.set(section, { x: 0, y: 0, hue: 0 });
      ['--glow-x', '--glow-y', '--glow-hue'].forEach((property) => section.style.removeProperty(property));
    });
  }
  requestGlowFrame();
}
reducedMotion.addEventListener('change', resetGlowAnimation);
document.addEventListener('visibilitychange', resetGlowAnimation);
requestGlowFrame();

// A compositor-driven track keeps moving independently of scrolling and pointer events.
document.querySelectorAll('.project-grid, .team-grid').forEach((row) => {
  const cards = [...row.children];
  const isProjects = row.classList.contains('project-grid');
  const track = document.createElement('div');
  track.className = 'gallery-track';
  track.append(...cards);
  row.append(track);
  let animation;
  let duration = 0;

  function configure() {
    const progress = animation && duration ? (animation.currentTime % duration) / duration : 0;
    animation?.cancel();
    track.querySelectorAll('[data-gallery-copy]').forEach((copy) => copy.remove());
    const overflowing = desktopCards.matches && cards.length > (isProjects ? 2 : 3);
    const running = overflowing && !reducedMotion.matches;
    row.classList.toggle('gallery-overflow', overflowing);
    row.classList.toggle('gallery-running', running);
    row.scrollLeft = 0;
    if (overflowing) {
      row.setAttribute('role', 'region');
      row.setAttribute('aria-label', isProjects ? 'Project gallery' : 'Team gallery');
    } else {
      row.removeAttribute('role');
      row.removeAttribute('aria-label');
    }
    if (overflowing && !running) row.tabIndex = 0;
    else row.removeAttribute('tabindex');
    if (!running) return;

    row.style.setProperty('--gallery-card-width', `${row.clientWidth * (isProjects ? .44 : .30)}px`);
    cards.forEach((card) => {
      const copy = card.cloneNode(true);
      copy.dataset.galleryCopy = '';
      copy.setAttribute('aria-hidden', 'true');
      copy.classList.remove('reveal-pending', 'reveal-ready');
      copy.querySelectorAll('[id]').forEach((element) => element.removeAttribute('id'));
      copy.querySelectorAll('a, button, [tabindex]').forEach((element) => element.setAttribute('tabindex', '-1'));
      track.append(copy);
    });
    const distance = track.querySelector('[data-gallery-copy]').offsetLeft - cards[0].offsetLeft;
    duration = distance / 36 * 1000;
    animation = track.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: `translate3d(-${distance}px, 0, 0)` }
    ], { duration, iterations: Infinity, easing: 'linear' });
    animation.currentTime = progress * duration;
  }

  desktopCards.addEventListener('change', configure);
  reducedMotion.addEventListener('change', configure);
  let previousWidth = 0;
  if ('ResizeObserver' in window) {
    new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - previousWidth) < 1) return;
      previousWidth = entry.contentRect.width;
      configure();
    }).observe(row);
  } else window.addEventListener('resize', configure);
  document.fonts.ready.then(configure);
  configure();
});
