const points = __PATH__;
const stage = document.querySelector('.iso-stage');
const ray = document.querySelector('[data-ray]');
const photon = document.querySelector('[data-photon]');
const halo = document.querySelector('[data-halo]');
const readout = document.querySelector('[data-readout]');
const kicker = document.querySelector('[data-step-kicker]');
const title = document.querySelector('[data-step-title]');
const copy = document.querySelector('[data-step-copy]');
const buttons = [...document.querySelectorAll('[data-step]')];
const controls = document.querySelector('.controls');
const description = document.querySelector('.step-description');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const lengths = points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));
const total = lengths.reduce((a,b)=>a+b,0);
const stops = [0, lengths[0], lengths[0]+lengths[1], total];
const descriptions = [
  {kicker:'01 · RECOGER',title:'Un espejo gigante para señales débiles',copy:'Los 18 segmentos hexagonales, ajustados para funcionar como una sola superficie de 6,5 metros, recogen la luz que llega desde el espacio.',readout:'01 / luz entrante',focus:'mirror'},
  {kicker:'02 · REFLEJAR',title:'La luz rebota hacia el secundario',copy:'El espejo principal concentra la luz en un espejo secundario, sostenido por tres brazos. Este la devuelve hacia la abertura central del primario.',readout:'02 / espejo secundario',focus:'secondary'},
  {kicker:'03 · MEDIR',title:'Los instrumentos convierten luz en datos',copy:'Después de atravesar la abertura, otros espejos dirigen la luz a los instrumentos. Sus detectores forman imágenes y sus espectrógrafos separan la luz en longitudes de onda.',readout:'03 / instrumentos',focus:'instrument'},
  {kicker:'04 · ENFRIAR',title:'El parasol protege la parte fría',copy:'Cinco membranas frenan el calor del Sol, la Tierra y la Luna. La sombra permite que los espejos y los instrumentos mantengan la sensibilidad necesaria para detectar infrarrojo débil.',readout:'04 / 5 capas',focus:'shield'}
];
let selected=0, distance=0, desired=0, visible=false, raf=0, previous=0, clock=0, touring=!reduced.matches, timer=0;
function pointAt(d) {
  let remaining=Math.max(0,Math.min(total,d));
  for(let i=0;i<lengths.length;i++) {
    if(remaining<=lengths[i] || i===lengths.length-1) {
      const t=Math.max(0,Math.min(1,remaining/lengths[i]));
      return [points[i][0]+(points[i+1][0]-points[i][0])*t,points[i][1]+(points[i+1][1]-points[i][1])*t];
    }
    remaining-=lengths[i];
  }
  return points.at(-1);
}
function draw() {
  const [x,y]=pointAt(distance);
  for(const dot of [photon,halo]) { dot.setAttribute('cx',x); dot.setAttribute('cy',y); }
  let remaining=Math.max(0,Math.min(total,distance));
  const trace=[points[0]];
  for(let i=0;i<lengths.length;i++) {
    if(remaining>=lengths[i]) { trace.push(points[i+1]); remaining-=lengths[i]; }
    else { trace.push([x,y]); break; }
  }
  ray.setAttribute('d',trace.map((p,i)=>`${i?'L':'M'}${p[0]} ${p[1]}`).join(' '));
  ray.style.opacity=selected===3 ? '.12' : '.75';
  photon.style.opacity=selected===3 ? '.15' : '1';
  halo.style.opacity=selected===3 ? '0' : '.14';
}
function select(index, automatic=false) {
  selected=index; desired=[stops[1],stops[2],stops[3],stops[3]][index];
  const d=descriptions[index];
  description.setAttribute('aria-live', automatic ? 'off' : 'polite');
  kicker.textContent=d.kicker; title.textContent=d.title; copy.textContent=d.copy;
  readout.textContent=d.readout; stage.dataset.focus=d.focus;
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  if(!automatic) { touring=false; resumeLater(); }
  if(reduced.matches) {distance=desired;draw();} else run();
}
function tick(now) {
  const dt=previous?Math.min((now-previous)/1000,1/30):1/60; previous=now;
  if(touring) {
    clock+=dt;
    const index=Math.floor(clock/3.8)%4;
    if(index!==selected) select(index,true);
    if(index===0 && distance>stops[2]) distance=0;
  }
  distance+=(desired-distance)*(1-Math.exp(-dt/.72));
  if(Math.abs(distance-desired)<.04) distance=desired;
  draw();
  raf=visible && (touring || distance!==desired) ? requestAnimationFrame(tick) : 0;
}
function run(){ if(visible&&!raf) {previous=0;raf=requestAnimationFrame(tick);} }
buttons.forEach((button,index)=>button.addEventListener('click',()=>select(index)));
function pauseTour() { touring=false; clearTimeout(timer); }
function resumeLater() {
  clearTimeout(timer);
  const held=()=>stage.matches(':hover') || controls.matches(':hover') || controls.contains(document.activeElement);
  if(!reduced.matches && !held()) timer=setTimeout(()=>{if(!held()){touring=true;clock=selected*3.8;run();}},8000);
}
for(const area of [stage,controls]) {
  area.addEventListener('pointerenter',pauseTour);
  area.addEventListener('pointerleave',resumeLater);
  area.addEventListener('focusin',pauseTour);
  area.addEventListener('focusout',event=>{if(!area.contains(event.relatedTarget)) resumeLater();});
}

new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)run();}, {rootMargin:'120px 0px'}).observe(stage);
reduced.addEventListener('change',()=>{if(reduced.matches){touring=false;clearTimeout(timer);distance=desired;draw();}else run();});
select(0,true);
