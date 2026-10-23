// Load archive players only when a visitor chooses a video.
document.addEventListener('click', (event) => {
  const preview = event.target.closest('.video-preview');
  if (!preview) return;
  document.querySelectorAll('.archive-card iframe').forEach((player) => {
    const previous = player._preview;
    if (previous) player.replaceWith(previous);
  });
  const player = document.createElement('iframe');
  player.src = `https://www.youtube-nocookie.com/embed/${preview.dataset.videoId}?autoplay=1&rel=0&playsinline=1`;
  player.title = preview.dataset.videoTitle;
  player.allow = 'autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  player.allowFullscreen = true;
  player._preview = preview;
  preview.replaceWith(player);
  player.focus();
});