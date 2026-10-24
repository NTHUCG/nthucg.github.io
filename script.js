// Only one YouTube player exists at a time; lifecycle changes notify decoration directly.
const playerPreviews = new WeakMap();
let activePlayer = null;
function notifyVideoState(active) {
  document.dispatchEvent(new CustomEvent('site:video-state', { detail: { active } }));
}
function restoreVideoPlayer(player = activePlayer) {
  if (!player) return;
  const preview = playerPreviews.get(player);
  if (preview && player.isConnected) player.replaceWith(preview);
  if (player === activePlayer) activePlayer = null;
  notifyVideoState(false);
}
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const preview = event.target.closest('.video-preview');
  if (!preview || !/^[A-Za-z0-9_-]{11}$/.test(preview.dataset.videoId)) return;
  restoreVideoPlayer();
  const player = document.createElement('iframe');
  const parameters = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
  if (preview.dataset.start) parameters.set('start', preview.dataset.start);
  if (preview.dataset.end) parameters.set('end', preview.dataset.end);
  player.src = `https://www.youtube-nocookie.com/embed/${preview.dataset.videoId}?${parameters}`;
  player.title = preview.dataset.videoTitle;
  player.allow = 'autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  player.allowFullscreen = true;
  playerPreviews.set(player, preview);
  activePlayer = player;
  preview.replaceWith(player);
  notifyVideoState(true);
  player.focus();
});
// Cache homepage-only nodes and media queries once, rather than on every focus event.
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const hoverPreference = matchMedia('(hover: hover)');
const animatedLetters = [...document.querySelectorAll('.wind-letter, .breeze-lines path')];
const lightLetters = [...document.querySelectorAll('.light-accent')];
// Resume decorative motion after navigation, back/forward cache, or tab switching.
function restoreHomeEffects() {
  if (document.visibilityState !== 'visible') return;
  if (!motionPreference.matches) {
    animatedLetters.forEach((element) => {
      element.getAnimations?.().forEach((animation) => {
        if (animation.playState !== 'running') animation.play();
      });
    });
  }
  lightLetters.forEach((element) => {
    element.classList.toggle('is-lit', hoverPreference.matches && (element.matches(':hover') || element.matches(':focus')));
  });
}
lightLetters.forEach((element) => {
  element.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'touch') element.classList.add('is-lit');
  });
  element.addEventListener('pointerleave', () => element.classList.remove('is-lit'));
  element.addEventListener('focus', () => element.classList.add('is-lit'));
  element.addEventListener('blur', () => element.classList.remove('is-lit'));
  element.addEventListener('pointercancel', () => element.classList.remove('is-lit'));
});
window.addEventListener('pageshow', () => requestAnimationFrame(restoreHomeEffects));
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') requestAnimationFrame(restoreHomeEffects);
});
window.addEventListener('focus', () => requestAnimationFrame(restoreHomeEffects));
restoreHomeEffects();

// Progressive year tabs: all records remain readable without JavaScript.
const yearTabs = document.querySelector('.year-tabs');
if (yearTabs) {
  const panels = Array.from(document.querySelectorAll('.performance-archive'));
  const buttons = panels.map((panel) => {
    const heading = panel.querySelector('h2');
    const year = heading.textContent.trim();
    const button = document.createElement('button');
    button.type = 'button';
    button.id = `year-tab-${year}`;
    button.textContent = year;
    button.setAttribute('role', 'tab');
    panel.id = `year-panel-${year}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.tabIndex = 0;
    button.setAttribute('aria-controls', panel.id);
    button.dataset.year = year;
    yearTabs.append(button);
    return button;
  });
  function selectYear(index, updateAddress = false) {
    panels.forEach((panel, i) => {
      const selected = i === index;
      panel.hidden = !selected;
      buttons[i].setAttribute('aria-selected', String(selected));
      buttons[i].tabIndex = selected ? 0 : -1;
      if (!selected && activePlayer && panel.contains(activePlayer)) restoreVideoPlayer();
    });
    if (updateAddress) history.replaceState(null, '', `#archive-${buttons[index].dataset.year}`);
  }
  function selectFromAddress() {
    const year = location.hash.replace('#archive-', '');
    const index = buttons.findIndex(button => button.dataset.year === year);
    selectYear(index >= 0 ? index : 0);
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => selectYear(index, true));
    button.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = buttons.length - 1;
      else return;
      event.preventDefault();
      selectYear(next, true);
      buttons[next].focus();
    });
  });
  selectFromAddress();
  yearTabs.hidden = false;
  window.addEventListener('hashchange', selectFromAddress);
}

// Sparse leaves: one low-resolution canvas, at most 30 frames per second.
(() => {
  const host = document.querySelector('main');
  if (!host || typeof Path2D === 'undefined') return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  let canvas, context, leaves = [], width = 0, height = 0;
  let frame = 0, previous = 0, resizeFrame = 0, videoPlaying = false;
  const pointer = { x: -1000, y: -1000 };
  const colors = ['#b99b78', '#b3a2c7', '#9aafc3', '#c5a479'];
  const shape = new Path2D('M0 -12C12 -9 12 5 0 13C-10 5 -10 -7 0 -12Z');
  function makeLeaf(initial = false) {
    return { x: Math.random() * width, y: initial ? Math.random() * height : -35,
      speed: 15 + Math.random() * 17, drift: Math.random() * 8 - 4,
      angle: Math.random() * Math.PI * 2, phase: Math.random() * Math.PI * 2,
      scale: .4 + Math.random() * .35, vx: 0, vy: 0, color: colors[Math.floor(Math.random() * colors.length)] };
  }
  function resize() {
    if (!canvas) return;
    if (width === innerWidth && height === innerHeight && leaves.length === (fine.matches ? 8 : 3)) return;
    width = innerWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.25);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    leaves = Array.from({ length: fine.matches ? 8 : 3 }, () => makeLeaf(true));
  }
  function stop() {
    cancelAnimationFrame(frame); frame = 0; previous = 0;
  }
  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (previous && now - previous < 1000 / 30) return;
    const dt = previous ? Math.min((now - previous) / 1000, .06) : 1 / 30;
    previous = now;
    context.clearRect(0, 0, width, height);
    context.globalAlpha = .42;
    for (const leaf of leaves) {
      if (fine.matches) {
        const dx = leaf.x - pointer.x, dy = leaf.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 90) {
          const force = (1 - distance / 90) * 180 * dt;
          leaf.vx += dx / Math.max(distance, 1) * force;
          leaf.vy += dy / Math.max(distance, 1) * force;
        }
      }
      const damping = Math.exp(-2 * dt);
      leaf.vx *= damping; leaf.vy *= damping;
      leaf.phase += dt * .65;
      leaf.x += (leaf.drift + Math.sin(leaf.phase) * 9 + leaf.vx) * dt;
      leaf.y += (leaf.speed + leaf.vy) * dt;
      leaf.angle += (.25 + leaf.vx * .008) * dt;
      if (leaf.y > height + 35 || leaf.x < -45 || leaf.x > width + 45) Object.assign(leaf, makeLeaf());
      context.save(); context.translate(leaf.x, leaf.y); context.rotate(leaf.angle);
      context.scale(leaf.scale, leaf.scale); context.fillStyle = leaf.color; context.fill(shape);
      context.strokeStyle = '#ffffffa6'; context.lineWidth = .8;
      context.beginPath(); context.moveTo(0, -8); context.lineTo(0, 9); context.stroke(); context.restore();
    }
  }
  function sync() {
    stop();
    if (reduced.matches) {
      canvas?.remove(); canvas = null; leaves = []; return;
    }
    if (!canvas) {
      canvas = document.createElement('canvas'); canvas.className = 'falling-leaves';
      canvas.setAttribute('aria-hidden', 'true'); host.prepend(canvas);
      context = canvas.getContext('2d');
      if (!context) { canvas.remove(); canvas = null; return; }
      resize();
    }
    videoPlaying = Boolean(activePlayer?.isConnected);
    canvas.hidden = videoPlaying;
    if (!document.hidden && !videoPlaying) frame = requestAnimationFrame(tick);
  }
  document.addEventListener('pointermove', event => {
    if (!fine.matches || event.pointerType === 'touch') return;
    pointer.x = event.clientX; pointer.y = event.clientY;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.x = pointer.y = -1000; });
  addEventListener('resize', () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; resize(); });
  }, { passive: true });
  document.addEventListener('visibilitychange', sync);
  addEventListener('pagehide', () => {
    stop(); cancelAnimationFrame(resizeFrame); resizeFrame = 0;
    pointer.x = pointer.y = -1000;
  });
  addEventListener('pageshow', sync);
  reduced.addEventListener('change', sync);
  fine.addEventListener('change', () => { resize(); sync(); });
  document.addEventListener('site:video-state', event => {
    videoPlaying = Boolean(event.detail.active);
    sync();
  });
  sync();
})();