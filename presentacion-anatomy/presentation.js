const root = document.documentElement;
const stage = document.querySelector('#stage');
const slides = [...document.querySelectorAll('[data-slide]')];
const setup = document.querySelector('#setup');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const themeToggle = document.querySelector('#theme-toggle');
const themeOptions = [...document.querySelectorAll('[data-theme-choice]')];
const label = document.querySelector('#slide-label');
let current = 0;
let theme = 'dark';

function resize() {
  stage.style.setProperty('--scale', Math.min(innerWidth / 1600, innerHeight / 900));
}
function setTheme(value) {
  theme = value;
  root.classList.add('no-transitions');
  root.dataset.theme = value;
  for (const image of document.querySelectorAll('img[data-dark][data-light]')) image.src = image.dataset[value];
  for (const option of themeOptions) option.setAttribute('aria-pressed', String(option.dataset.themeChoice === value));
  themeToggle.textContent = value === 'dark' ? 'MODO CLARO' : 'MODO OSCURO';
  themeToggle.setAttribute('aria-label', value === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
  document.querySelector('[data-demo="webb"]').src = `webb-${value}.html`;
  document.querySelector('[data-demo="raptor"]').src = `raptor-${value}.html`;
  void root.offsetHeight;
  requestAnimationFrame(() => root.classList.remove('no-transitions'));
}
function showSlide(index) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => { slide.hidden = i !== current; });
  label.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  previous.disabled = current === 0;
  next.disabled = current === slides.length - 1;
}
for (const option of themeOptions) option.addEventListener('click', () => setTheme(option.dataset.themeChoice));
document.querySelector('#start').addEventListener('click', () => { setup.hidden = true; document.querySelector('.frame').inert = false; next.focus(); });
themeToggle.addEventListener('click', () => setTheme(theme === 'dark' ? 'light' : 'dark'));
previous.addEventListener('click', () => showSlide(current - 1));
next.addEventListener('click', () => showSlide(current + 1));
window.addEventListener('resize', resize);
window.addEventListener('keydown', event => {
  if (!setup.hidden || !document.querySelector('#transcript').hidden || event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable=true]')) return;
  if (event.key === 'ArrowRight' || event.key === 'PageDown') { event.preventDefault(); showSlide(current + 1); }
  if (event.key === 'ArrowLeft' || event.key === 'PageUp') { event.preventDefault(); showSlide(current - 1); }
});
resize();
setTheme('dark');

for (const button of document.querySelectorAll('.fullscreen-toggle')) button.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch (error) {
    button.textContent = 'Pantalla completa no disponible';
  }
});
document.addEventListener('fullscreenchange', () => {
  for (const button of document.querySelectorAll('.fullscreen-toggle')) {
    button.textContent = document.fullscreenElement ? 'SALIR DE PANTALLA COMPLETA' : 'PANTALLA COMPLETA';
  }
  resize();
});

const transcript = document.querySelector('#transcript');
let transcriptTrigger;
for (const button of document.querySelectorAll('[data-transcript]')) button.addEventListener('click', () => {
  transcriptTrigger = button;
  const topic = button.dataset.transcript;
  document.querySelector('#transcript-title').textContent = topic === 'webb' ? 'James Webb' : 'Raptor 3';
  for (const item of transcript.querySelectorAll('pre')) item.hidden = item.id !== `transcript-${topic}`;
  transcript.hidden = false;
  document.querySelector('.frame').inert = true;
  transcript.querySelector('.transcript-body').scrollTop = 0;
  document.querySelector('#transcript-close').focus();
});
function closeTranscript() {
  transcript.hidden = true;
  document.querySelector('.frame').inert = false;
  transcriptTrigger?.focus();
}
document.querySelector('#transcript-close').addEventListener('click', closeTranscript);
window.addEventListener('keydown', event => {
  if (!transcript.hidden && event.key === 'Escape') { event.preventDefault(); closeTranscript(); }
});
