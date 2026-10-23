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