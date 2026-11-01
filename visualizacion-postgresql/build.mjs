import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from './kit/iso-kit.mjs';
const kitScript = () => readFileSync(new URL('./kit/iso-kit.mjs', import.meta.url), 'utf8').replace(/^export /gm, '');

const here = dirname(fileURLToPath(import.meta.url));
const light = process.argv.includes('--light');
const W = 720, H = 440;
const base = { x: -78, y: -48, w: 156, d: 96, r: 3 };
const P = k.fitProjection([...k.boxCorners({x:-82,y:-53,w:164,d:175,r:0},-14,133)], W, H, {pad:38, azimuth:58, elevation:30});
const S = (plan,z,h,tone='mid',options={}) => k.solidSvg(k.slabOf(plan,z,h,P,4,0.55), {tone,...options});
const L = (path,tone='lo',options={}) => k.lineSvg(path,{tone,...options});
const D = (points,tone='lo',size=.6) => k.dotsSvg(points.map(p=>k.iso(p,P)),{tone,size});
const plan = (x,y,w,d,r=.6) => ({x,y,w,d,r});
const sketch = [];

// Base, with four short, square feet and the furniture plinth.
sketch.push(`<path class="iso-halo" d="${k.haloOf(base,-14,4,P)}"/>`);
for (const [x,y] of [[-65,-37],[56,-37],[-65,29],[56,29]]) sketch.push(S(plan(x,y,9,8,1),-14,6,'lo'));
sketch.push(S(base,-8,8,'lo'));
sketch.push(L(k.planOutline(k.insetPlan(base,4),0,P,4),'lo'));
sketch.push(D([[-72,-42,0],[72,-42,0],[-72,42,0],[72,42,0]],'mid',.65));

// Carcass: panels stand on the base and the top is capped, like an open-front card file.
sketch.push(S(plan(-66,-36,132,73,1),0,4,'mid'));
sketch.push(S(plan(-70,-40,140,4,1),0,125,'mid'));
sketch.push(S(plan(-70,-36,4,73,1),0,125,'mid'));
sketch.push(S(plan(66,-36,4,73,1),0,125,'mid'));
sketch.push(S(plan(-72,-42,144,81,2),125,6,'mid'));
sketch.push(L(k.planOutline(plan(-67,-37,134,71,1),131,P,4),'lo'));
sketch.push(D([[-65,-35,131],[65,-35,131],[-65,32,131],[65,32,131]],'mid',.65));
// Small ventilation slots are closed outlines rather than free-ending marks.
for (let y=-27; y<=21; y+=8) sketch.push(L(k.planOutline(plan(68,y,1.1,4.5,.4),131,P,3),'faint'));

const names = ['piezas','usuarios','categorias','megusta','guardados'];
const labels = ['Pieza','Dueño','Categoría','Me gusta','Guardados'];
const data = [
  {label:'Pieza',table:'piezas',title:'Una fila para cada pieza',description:'La ficha principal reúne los datos de la pieza y dos claves que apuntan a su dueño y su categoría.', rows:[['id','3'],['nombre','Game Boy DMG-01 con Tetris'],['descripcion','Consola con su cartucho de Tetris'],['usuario_id','5 → usuarios.id'],['categoria_id','2 → categorias.id'],['imagen_datos / imagen_tipo','bytes / image/jpeg'],['creado_en / actualizado_en','fecha de creación / última edición']],note:'Si la foto se sube, la API valida JPEG, PNG o WebP de hasta 2 MB y guarda sus bytes y su tipo. Si se entrega una URL o ruta, guarda esa dirección. La API devuelve una URL corta para servir una imagen almacenada.'},
  {label:'Dueño',table:'usuarios',title:'Una pieza tiene un dueño',description:'La clave foránea usuario_id conecta la pieza con la fila de su propietario. Un usuario puede tener muchas piezas.',rows:[['usuarios.id','5'],['usuarios.username','diego_8bit'],['piezas.usuario_id','5 → usuarios.id']],note:'El backend comprueba la identidad de quien hace la solicitud antes de permitir que edite o elimine una pieza. La clave foránea cuida la relación; por sí sola no autoriza acciones.'},
  {label:'Categoría',table:'categorias',title:'Una categoría se comparte',description:'categoria_id conecta la pieza con una categoría, sin repetir su nombre en cada registro.',rows:[['categorias.id','2'],['categorias.slug','videojuegos'],['categorias.nombre','Videojuegos'],['piezas.categoria_id','2 → categorias.id']],note:'Las categorías de Vitrina son cartas, videojuegos, juguetes y vinilos. En este ejemplo, el 2 identifica videojuegos.'},
  {label:'Me gusta',table:'megusta',title:'Una fila por cada me gusta',description:'Cada fila une un usuario con una pieza. La clave primaria compuesta impide registrar dos veces el mismo par.',rows:[['usuario_id','8'],['pieza_id','3'],['creado_en','fecha del me gusta'],['clave primaria','(usuario_id, pieza_id)']],note:'El contador de la pieza se calcula contando sus filas en megusta. Dar me gusta y guardar son acciones independientes.'},
  {label:'Guardados',table:'guardados',title:'Una fila por cada guardado',description:'Los favoritos se almacenan en una tabla de unión independiente de los me gusta.',rows:[['usuario_id','8'],['pieza_id','3'],['creado_en','fecha en que se guardó'],['clave primaria','(usuario_id, pieza_id)']],note:'Favoritos se ordena por fecha de guardado. Al eliminar la pieza, ON DELETE CASCADE elimina sus filas asociadas en megusta y guardados.'},
];

// The drawers are built once and translate together with their index card.
function drawer(i) {
  const z = 5 + (4-i)*23.2;
  const out=[];
  // Bottom, side walls, rear wall and the standing index card.
  out.push(S(plan(-64,-34,128,68,1),z,2,'lo'));
  out.push(S(plan(-64,-34,2.5,68,.5),z+2,13.5,'mid'));
  out.push(S(plan(61.5,-34,2.5,68,.5),z+2,13.5,'mid'));
  out.push(S(plan(-61.5,-34,123,2.5,.5),z+2,13.5,'mid'));
  out.push(S(plan(-47,-4,94,1.2,.2),z+2,12.5,'hi'));
  // Lines are printed on the index card's front, ending like real printed text.
  for (const dz of [5,7.7,10.4]) {
    out.push(L(k.segment([-38,-2.78,z+dz],[22-dz,-2.78,z+dz],P),'lo',{free:true}));
  }
  // Only the pulled-out drawer exposes its interior; closed drawer contents are hidden.
  const inside = out.splice(0).join('');
  const clip = k.slabOf(plan(-64,37,128,60,0),z,18,P,1).fill;
  out.push(`<defs><clipPath id="drawer-clip-${i}" clipPathUnits="userSpaceOnUse"><path data-clip="${i}" d="${clip}" transform="${k.translateAlong(P,[0,i===0?-60:0,0])}"/></clipPath></defs><g class="drawer-inside" clip-path="url(#drawer-clip-${i})">${inside}</g>`);
  // Full-width front, inset label and an actual grip, all fixed to the drawer.
  out.push(`<g class="drawer-front">${S(plan(-64,34,128,3,0.6),z,18,'hi')}</g>`);
  const plate = plan(-24,37,48,1.1,.2);
  out.push(S(plate,z+10,4,'mid'));
  out.push(L(k.segment([-18,38.12,z+12],[-4,38.12,z+12],P),'mid',{free:true}));
  out.push(L(k.segment([0,38.12,z+12],[16,38.12,z+12],P),'mid',{free:true}));
  // Two mounts and a bridge make a usable square drawer pull.
  out.push(S(plan(-13,37,2,4,.4),z+4,3,'mid'));
  out.push(S(plan(11,37,2,4,.4),z+4,3,'mid'));
  out.push(S(plan(-13,41,26,2,.6),z+4,3,'hi'));
  out.push(D([[-12,43,z+5.5],[12,43,z+5.5]],'hi',.55));
  return `<g class="drawer" data-drawer="${i}" data-active="${i===0}" transform="${k.translateAlong(P,[0,i===0?60:0,0])}">${out.join('')}</g>`;
}
// The stationary frame is behind the leading face of any pulled-out drawer.
sketch.push(S(plan(-70,34,5,5,.8),0,125,'mid'));
sketch.push(S(plan(65,34,5,5,.8),0,125,'mid'));
for (const x of [-67.5,67.5]) for (const z of [7,30,53,76,99,122]) sketch.push(D([[x,39,z]],'lo',.5));
// Paint from the bottom up so each raised drawer rests above the one below it.
for(let i=4;i>=0;i--) sketch.push(drawer(i));

const svg = k.figureSvg({width:W,height:H,label:'Archivador isométrico con cinco cajones. Cada cajón representa una tabla relacionada con las piezas de Vitrina y el seleccionado se desliza hacia el lector.',body:sketch});
const stage = `<div class="iso-stage" tabindex="0" role="group" aria-label="Archivador interactivo. Usa las flechas izquierda y derecha para elegir una tabla.">${svg}</div>`;
const plate = k.plateHtml({fig:'Fig. 01',title:'PostgreSQL / Vitrina',hint:'Elige un cajón',readout:'01 / 05 · piezas',body:stage,keys:[{mark:'lit',label:'Cajón seleccionado: tabla que estamos examinando'},{mark:'raised',label:'Cada ficha representa una fila de ejemplo'}],caption:'Cinco tablas intervienen directamente en esta pieza. El cajón es una metáfora: una base de datos guarda filas relacionadas, no fichas físicas.'});
const buttons = labels.map((label,i)=>`<button type="button" class="mode" data-mode="${i}" aria-pressed="${i===0}"><span class="mode-index">0${i+1}</span>${label}</button>`).join('');
const rows = data[0].rows.map(([key,value])=>`<div class="row"><dt>${key}</dt><dd>${value}</dd></div>`).join('');
const body = `<header class="intro"><p class="eyebrow">ANATOMÍA DE UNA PIEZA <span> / </span> VITRINA</p><h1>Una colección,<br><em>muchas conexiones.</em></h1><p>Recorre una pieza de ejemplo y descubre cómo PostgreSQL relaciona su ficha, su dueño y las personas que interactúan con ella.</p></header>${plate}<section class="explorer" aria-label="Tablas relacionadas con una pieza"><div class="section-head"><span>EXPLORA EL ARCHIVO</span><span>ELIGE UNA TABLA</span></div><div class="modes" role="group" aria-label="Seleccionar una tabla">${buttons}</div><article class="detail" aria-live="polite"><div class="detail-top"><div><p class="detail-kicker">TABLA <span data-table>piezas</span></p><h2 data-heading>Una fila para cada pieza</h2></div><span class="detail-number" data-number>01</span></div><p class="description" data-description>${data[0].description}</p><dl class="rows" data-rows>${rows}</dl><p class="note" data-note>${data[0].note}</p></article></section><section class="how"><p class="eyebrow">EL RECORRIDO COMPLETO</p><h2>De la pantalla a la base</h2><div class="steps"><div><strong>01 · Enviar</strong><p>Angular envía los datos y la foto a la API de FastAPI.</p></div><div><strong>02 · Guardar</strong><p>La API valida, relaciona los datos y confirma la escritura en PostgreSQL.</p></div><div><strong>03 · Mostrar</strong><p>La API consulta las tablas, calcula los totales y devuelve JSON para la pantalla.</p></div></div><p class="last-note">Los identificadores y el registro de este recorrido son un ejemplo ilustrativo. La tabla <code>seguimientos</code> completa el modelo y permite construir el feed.</p></section>`;
const custom = `
<style>
body { --display:Georgia, 'Times New Roman',serif; }
.iso-page { width:min(880px,calc(100% - 36px)); margin:70px auto 100px; }
.intro { max-width:680px; margin:0 0 38px; }
.eyebrow,.section-head,.detail-kicker { font:600 10px/1.2 var(--anatomy-mono); letter-spacing:.15em; color:var(--anatomy-muted); }
.eyebrow span { margin:0 5px; color:var(--anatomy-lo); }
h1 { margin:18px 0 18px; color:var(--anatomy-strong); font:500 clamp(42px,7.2vw,70px)/1.02 var(--display); letter-spacing:-.045em; }
h1 em { font-weight:400; }
.intro > p:last-child { max-width:560px; font-size:15px; line-height:1.7; margin:0; }
.iso-plate { box-shadow:0 0 0 1px var(--anatomy-faint); padding:36px 24px 43px; }
.iso-stage { outline-offset:4px; }
.iso-stage:focus-visible { outline:2px solid var(--anatomy-mid); }
.iso-plate .iso-svg { max-width:720px; }
.drawer-inside { opacity:0; transition:opacity .18s ease; }
.drawer[data-active="true"] .drawer-inside { opacity:1; }
.drawer[data-active="true"] .drawer-front .iso-edge { stroke:var(--anatomy-lit); stroke-width:1.05; }
.drawer[data-active="true"] .drawer-front .iso-top { fill:var(--anatomy-lit-top); }
.iso-legend { margin:18px 0 0; }
.explorer { margin:40px 0 0; }
.section-head { display:flex; justify-content:space-between; gap:12px; padding:0 0 13px; border-bottom:1px solid var(--anatomy-faint); }
.modes { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:1px; background:var(--anatomy-faint); border:1px solid var(--anatomy-faint); margin:0 0 18px; }
.mode { display:flex; align-items:center; gap:8px; justify-content:center; min-height:56px; background:var(--anatomy-page); color:var(--anatomy-text); border:0; cursor:pointer; font:600 12px/1.3 system-ui,sans-serif; transition:background .18s,color .18s; }
.mode:hover,.mode:focus-visible { background:var(--anatomy-card); color:var(--anatomy-strong); outline-offset:-3px; }
.mode[aria-pressed="true"] { background:var(--anatomy-strong); color:var(--anatomy-page); }
.mode-index { font:10px var(--anatomy-mono); opacity:.6; }
.detail { background:var(--anatomy-card); border:1px solid var(--anatomy-faint); padding:28px 32px 30px; }
.detail-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; }
.detail-kicker { margin:0 0 10px; text-transform:uppercase; }
.detail-kicker span { color:var(--anatomy-text); }
h2 { color:var(--anatomy-strong); font:500 29px/1.14 var(--display); letter-spacing:-.025em; margin:0; }
.detail-number { font:38px/.9 var(--display); color:var(--anatomy-faint); }
.description { max-width:650px; margin:14px 0 20px; }
.rows { border-top:1px solid var(--anatomy-faint); margin:0; }
.row { display:grid; grid-template-columns:minmax(165px,.9fr) 1.5fr; gap:14px; padding:8px 0; border-bottom:1px solid var(--anatomy-faint); }
dt { font:11px/1.6 var(--anatomy-mono); color:var(--anatomy-muted); overflow-wrap:anywhere; }
dd { margin:0; color:var(--anatomy-strong); font:12px/1.6 var(--anatomy-mono); overflow-wrap:anywhere; }
.note { margin:20px 0 0; color:var(--anatomy-text); font-size:13px; }
.how { margin-top:60px; }
.how h2 { margin:13px 0 22px; }
.steps { display:grid; grid-template-columns:repeat(3,1fr); gap:28px; }
.steps div { border-top:1px solid var(--anatomy-faint); padding-top:14px; }
.steps strong { font:600 11px var(--anatomy-mono); color:var(--anatomy-strong); }
.steps p,.last-note { font-size:13px; line-height:1.7; }
.last-note { margin-top:24px; color:var(--anatomy-muted); }
code { font-family:var(--anatomy-mono); }
@media(max-width:600px) { .iso-page{margin-top:42px} .iso-plate{padding:42px 9px 58px} .intro{margin-bottom:27px} .modes{grid-template-columns:repeat(3,1fr)} .mode{min-height:48px} .detail{padding:23px 20px} .row{grid-template-columns:1fr;gap:1px} .steps{grid-template-columns:1fr;gap:9px} .section-head span:last-child{display:none} }
@media(prefers-reduced-motion:reduce){.mode,.drawer-inside{transition:none}}
</style>`;
const live = `
const P = ${JSON.stringify(P)};
const models = ${JSON.stringify(data)};
const stage = document.querySelector('.iso-stage');
const drawers = [...document.querySelectorAll('[data-drawer]')].sort((a,b)=>Number(a.dataset.drawer)-Number(b.dataset.drawer));
const buttons = [...document.querySelectorAll('[data-mode]')];
const readout = document.querySelector('[data-readout]');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const positions = [60,0,0,0,0];
const clips = drawers.map(drawer=>drawer.querySelector('[data-clip]'));
let selected = 0, openIndex = 0, frame = 0, previous = 0, visible = false, tour = !reduced.matches, idleSeconds = 0;
function bringForward(index) {
  for (let i = drawers.length - 1; i >= 0; i--) {
    drawers[i].dataset.active = String(i === index);
    if (i !== index) drawers[i].parentNode.appendChild(drawers[i]);
  }
  drawers[index].parentNode.appendChild(drawers[index]);
}
const table = document.querySelector('[data-table]');
const heading = document.querySelector('[data-heading]');
const number = document.querySelector('[data-number]');
const description = document.querySelector('[data-description]');
const rows = document.querySelector('[data-rows]');
const note = document.querySelector('[data-note]');
function choose(index, manual=false) {
  selected = (index + models.length) % models.length;
  if (manual) { tour=false; idleSeconds=0; }
  const item = models[selected];
  readout.textContent = String(selected+1).padStart(2,'0') + ' / 05 · ' + item.table;
  table.textContent = item.table; heading.textContent = item.title; number.textContent = String(selected+1).padStart(2,'0');
  description.textContent = item.description; note.textContent = item.note;
  rows.replaceChildren(...item.rows.map(([key,value])=>{
    const div=document.createElement('div'), dt=document.createElement('dt'), dd=document.createElement('dd');
    div.className='row'; dt.textContent=key; dd.textContent=value; div.append(dt,dd); return div;
  }));
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===selected)));
  run();
}
function tick(now) {
  const dt=previous ? Math.min((now-previous)/1000,.05):.016; previous=now;
  if(tour) { idleSeconds+=dt; if(idleSeconds>12) { idleSeconds=0; choose(selected+1); } }
  // Only one drawer moves: close it completely before opening the next one.
  if (reduced.matches) {
    positions.fill(0);
    if (openIndex !== selected) { openIndex=selected; bringForward(openIndex); }
    positions[openIndex]=60;
  } else {
    const target = openIndex === selected ? 60 : 0;
    const seconds = target === 0 ? .12 : .18;
    positions[openIndex] += (target-positions[openIndex])*(1-Math.exp(-dt/seconds));
    if (Math.abs(positions[openIndex]-target)<.2) positions[openIndex]=target;
    if (target === 0 && positions[openIndex] === 0) {
      openIndex=selected;
      bringForward(openIndex);
    }
  }
  positions.forEach((value,i)=>{
    drawers[i].setAttribute('transform',translateAlong(P,[0,value,0]));
    clips[i].setAttribute('transform',translateAlong(P,[0,-value,0]));
  });
  const moving = openIndex !== selected || positions[openIndex] !== 60;
  frame = visible && (tour || moving) ? requestAnimationFrame(tick) : 0;
}
function run(){ if(visible && !frame){ previous=0; frame=requestAnimationFrame(tick); } }
buttons.forEach((button,i)=>button.addEventListener('click',()=>choose(i,true)));
stage.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowDown'){event.preventDefault();choose(selected+1,true)}else if(event.key==='ArrowLeft'||event.key==='ArrowUp'){event.preventDefault();choose(selected-1,true)}else if(event.key==='Home'){event.preventDefault();choose(0,true)}else if(event.key==='End'){event.preventDefault();choose(4,true)}});
stage.addEventListener('pointerdown',event=>{ const part=event.target.closest('[data-drawer]'); if(part) choose(Number(part.dataset.drawer),true); });
reduced.addEventListener('change',()=>{if(reduced.matches)tour=false;run()});
new IntersectionObserver(entries=>{visible=entries.at(-1).isIntersecting;if(visible)run();else if(frame){cancelAnimationFrame(frame);frame=0;}},{rootMargin:'80px'}).observe(stage);
`;
let html = k.pageHtml({title:'Cómo guarda Vitrina sus piezas · PostgreSQL',theme:light?'light':'dark',body,script:kitScript()+live,width:880});
html = html.replace('<html lang="en">','<html lang="es">').replace('</head>',`${custom}</head>`);
const output = join(here,light?'index.html':'oscuro.html');
writeFileSync(output,html);
console.log('wrote',output);
