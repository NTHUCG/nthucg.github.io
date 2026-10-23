// Load archive players only when a visitor chooses a video.
document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) return;
  const preview = event.target.closest('.video-preview');
  if (!preview || !/^[A-Za-z0-9_-]{11}$/.test(preview.dataset.videoId)) return;
  document.querySelectorAll('.video-frame iframe').forEach((player) => {
    const previous = player._preview;
    if (previous) player.replaceWith(previous);
  });
  const player = document.createElement('iframe');
  const parameters = new URLSearchParams({ autoplay: '1', rel: '0', playsinline: '1' });
  if (preview.dataset.start) parameters.set('start', preview.dataset.start);
  if (preview.dataset.end) parameters.set('end', preview.dataset.end);
  player.src = `https://www.youtube-nocookie.com/embed/${preview.dataset.videoId}?${parameters}`;
  player.title = preview.dataset.videoTitle;
  player.allow = 'autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  player.allowFullscreen = true;
  player._preview = preview;
  preview.replaceWith(player);
  player.focus();
});
// Resume decorative motion after navigation, back/forward cache, or tab switching.
function restoreHomeEffects() {
  if (document.visibilityState !== 'visible') return;
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.wind-letter, .breeze-lines path').forEach((element) => {
      element.getAnimations().forEach((animation) => {
        if (animation.playState !== 'running') animation.play();
      });
    });
  }
  document.querySelectorAll('.light-accent').forEach((element) => {
    element.classList.toggle('is-lit', window.matchMedia('(hover: hover)').matches && (element.matches(':hover') || element.matches(':focus')));
  });
}
document.querySelectorAll('.light-accent').forEach((element) => {
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
      if (!selected) panel.querySelectorAll('iframe').forEach((player) => {
        if (player._preview) player.replaceWith(player._preview);
      });
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
