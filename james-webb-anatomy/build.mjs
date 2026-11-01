import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as k from '../.agents/skills/anatomy/kit/iso-kit.mjs';
import * as G from '../.agents/skills/anatomy/kit/lathe.mjs';
import * as A from '../.agents/skills/anatomy/kit/audit.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes('--light') ? 'light' : 'dark';
const W = 600, H = 490;
const shield=[[-155,0],[-108,-66],[-22,-95],[92,-64],[155,0],[92,64],[-22,95],[-108,66]];
const P = k.fitProjection([
  ...shield.map(([x,y])=>[x,y,0]),
  [-60,-90,178], [-60,90,178], [-60,0,275], [-60,0,75],
  [100,0,178], [170,34.64,178], [-85,-68,-32], [-85,68,-32],
], W, H, {pad: 32, azimuth: 38, elevation: 26});
const at = p => k.iso(p,P);
const S = (paths, style={}) => k.solidSvg(paths, style);
const D = (p, opts={}) => k.dotsSvg(p.map(at),opts);
const R = A.recorder(P);
const axis = G.frameOf([0,0,0], [1,0,0], [0,1,0], [0,0,1]);
let id = 0;

function put(name, piece, center, svg, shape) {
  const key = `${piece}.${name}.${id++}`;
  shape.name = key;
  R.put({ name:key, piece, at:center, svg:`<g data-component="${piece}">${svg}</g>`, shapes:[R.solid(shape)] });
}
function floor(name, piece, ring, z, height, style={}, meta={}, detail='') {
  const center = [ring.reduce((a,p)=>a+p[0],0)/ring.length,ring.reduce((a,p)=>a+p[1],0)/ring.length,z+height/2];
  put(name,piece,center,S(k.extrude(ring,z,height,P),style)+detail,A.extruded(ring,z,height,meta));
}
function slab(name, piece, plan, z, height, style={}, meta={}) {
  const center=[plan.x+plan.w/2, plan.y+plan.d/2, z+height/2];
  put(name,piece,center,S(k.slabOf(plan,z,height,P,4,0.35),style),A.slab(plan,z,height,meta,4));
}
function plane(name,piece, polygon,s0,s1,style={},meta={},detail='') {
  const mid=[(s0+s1)/2,polygon.reduce((a,p)=>a+p[0],0)/polygon.length,polygon.reduce((a,p)=>a+p[1],0)/polygon.length];
  put(name,piece,mid,S(G.prismOf(axis,polygon,s0,s1,P),style)+detail,A.prism(axis,polygon,s0,s1,meta));
}
function beam(name,piece,a,b,half,style={},meta={}) {
  const v=G.sub3(b,a), len=Math.hypot(...v), F=G.frameAlong(a,v);
  const polygon=[[-half,-half],[half,-half],[half,half],[-half,half]];
  put(name,piece,G.add3(a,G.mul3(G.unit3(v),len/2)),S(G.prismOf(F,polygon,0,len,P),style),A.prism(F,polygon,0,len,meta));
}
function disc(name,piece,origin,r,s0,s1,style={},meta={}) {
  const F=G.frameOf(origin,[1,0,0],[0,1,0],[0,0,1]);
  put(name,piece,[origin[0]+(s0+s1)/2,origin[1],origin[2]],S(G.disc(s0,s1,r,F,P),style),A.disc(F,s0,s1,r,meta));
}

// Thermal shield: separate, held layers with a bus below and small edge attachments.
const foilFolds = shield.map(([x,y]) => k.fadeLineSvg(
  [at([x,y,8.71]), at([x*.69,y*.69,8.71]), at([x*.43,y*.43,8.71])],
  {fade:[0,18],tone:'lo'}
)).join('');
for(let i=0;i<5;i++) floor(`membrane-${i+1}`,'shield',shield,i*2,0.7,{tone:'lo'},{owner:'thermal-shield'},i===4?foilFolds:'');
const bus={x:-53,y:-27,w:70,d:54,r:3};
slab('bus','bus',bus,-30,30,{tone:'mid'},{ground:true});
slab('bus-rim','bus',{x:-55,y:-29,w:74,d:58,r:3},-32,2,{tone:'mid'});
for (const [j, [x,y]] of shield.entries()) {
  slab(`edge-clamp-${j}`,'shield',{x:x-1.5,y:y-1.5,w:3,d:3,r:.4},8.7,.7,{tone:'mid'},{owner:'thermal-shield'});
}
for(let i=0;i<4;i++) slab(`layer-spacer-${i}`,'shield',{x:0,y:0,w:4,d:4,r:.2},i*2+.7,1.3,{tone:'lo'},{owner:'thermal-shield'});
// Ribs on the exposed warm-side bus and two framed solar panels.
for(let i=0;i<5;i++) slab(`bus-panel-${i}`,'bus',{x:-47+i*12,y:26.9,w:9,d:1.1,r:.3},-25,17,{tone:'lo'},{owner:'bus'});
for (const [j,sign] of [-1,1].entries()) {
  const solar={x:-51,y:sign<0?-68:30,w:68,d:35,r:1};
  const bridge={x:-35,y:sign<0?-33:27,w:9,d:sign<0?6:3,r:0};
  slab(`solar-bridge-${j}`,'bus',bridge,-26,1.2,{tone:'mid'});
  slab(`solar-frame-${j}`,'bus',solar,-26,1.2,{tone:'mid'});
  for(let n=0;n<4;n++) {
    const cell={x:solar.x+2+n*16.3,y:solar.y+2,w:14.8,d:31,r:.3};
    slab(`solar-cell-${j}-${n}`,'bus',cell,-24.8,0.35,{tone:'lo'},{owner:'bus'});
  }
}
// The deployable tower and mirror backplane.
slab('tower','structure',{x:-60,y:-6,w:10,d:12,r:1},11.7,63.3,{tone:'mid'});
slab('tower-foot','structure',{x:-65,y:-11,w:20,d:22,r:2},8.7,3,{tone:'mid'},{owner:'tower'});
// Six trapezia make a genuine open centre in the supporting ring.
const centerZ=178, outer=103, inner=19;
const hex=(r,angle)=>[r*Math.cos(angle),centerZ+r*Math.sin(angle)];
for(let i=0;i<6;i++) {
  const a=Math.PI/6+i*Math.PI/3, b=a+Math.PI/3;
  plane(`backplane-${i}`,'structure',[hex(inner,a),hex(outer,a),hex(outer,b),hex(inner,b)],-58,-54,{tone:'mid'},{owner:'backplane'});
}
// 18 individually supported mirrors, radius-two honeycomb with a central aperture.
const radius=20, tileRadius=19.72;
const centers=[];
for(let q=-2;q<=2;q++) for(let r=-2;r<=2;r++) {
  if(Math.abs(q+r)>2 || (q===0&&r===0)) continue;
  centers.push([Math.sqrt(3)*radius*(q+r/2),centerZ+1.5*radius*r,q,r]);
}
for (const [j,[cy,cz,q,r]] of centers.entries()) {
  const poly=Array.from({length:6},(_,n)=>{
    const a=Math.PI/6+n*Math.PI/3;
    return [cy+tileRadius*Math.cos(a),cz+tileRadius*Math.sin(a)];
  });
  const inset=Array.from({length:6},(_,n)=>{
    const a=Math.PI/6+n*Math.PI/3;
    return at([-51.49,cy+(tileRadius-.75)*Math.cos(a),cz+(tileRadius-.75)*Math.sin(a)]);
  });
  const bevel=k.lineSvg(k.pathOf(inset,true),{tone:'faint'});
  plane(`segment-${j+1}`,'mirror',poly,-54,-51.5,{tone:'hi',crease:'lo'},{owner:'mirror'},bevel);
}
// Three structural arms; their ends converge on the rim of the secondary.
const legStarts=[[-53,-72,133],[-53,72,133],[-53,0,265]];
const legEnds=[[93,-8,174],[93,8,174],[93,0,187]];
legStarts.forEach((a,i)=>beam(`secondary-arm-${i}`,'struts',a,legEnds[i],1.65,{tone:'mid'},{owner:'secondary'}));
disc('secondary-housing','secondary',[93,0,178],10.5,0,2.8,{tone:'mid'},{owner:'secondary'});
disc('secondary-optic','secondary',[93,0,178],8.9,2.8,3.8,{tone:'hi'},{owner:'secondary'});
// Six wedges leave a real central aperture and seat the instrument case on the backplane.
for(let i=0;i<6;i++) {
  const a=Math.PI/6+i*Math.PI/3, b=a+Math.PI/3;
  plane(`aperture-rim-${i}`,'aperture',[hex(5.3,a),hex(19,a),hex(19,b),hex(5.3,b)],-60,-54,{tone:'hi'},{owner:'instrument'});
}
// A compact instrument housing behind the primary. Its covers are schematic.
slab('instrument-casing','instrument',{x:-85,y:-17,w:25,d:34,r:1.5},151,54,{tone:'mid'},{owner:'instrument'});
for(let i=0;i<4;i++) slab(`instrument-cover-${i}`,'instrument',{x:-84,y:-15+i*7.5,w:23,d:6.3,r:.6},205,2,{tone:'hi'},{owner:'instrument'});

A.settle(R,P);
R.items.sort((a,b)=>a.key-b.key);
const parts=R.items.map(item=>item.svg).join('');

// One illustrative light path. The markers are intentionally not a physical-speed simulation.
const path3=[[170,34.64,178],[-51.5,34.64,178],[93,0,178],[-54,0,178],[-75,0,178]];
const path=path3.map(at);
const coords=path.map(p=>p.map(n=>Number(n.toFixed(3))));
const pathSvg=k.pathOf(path);
const beamSvg=`<g class="optical-ray" aria-hidden="true"><path class="ray-track" d="${pathSvg}"/><path class="ray-active" data-ray d="${pathSvg}"/><circle class="photon-halo" data-halo r="6.5"/><circle class="photon" data-photon r="2.3"/></g>`;
const svg=k.figureSvg({width:W,height:H,label:'Modelo isométrico del telescopio James Webb: dieciocho segmentos del espejo principal, un espejo secundario sostenido por tres brazos y un parasol de cinco capas. Un punto representa la luz que se refleja en los espejos y viaja hacia los instrumentos.',body:[parts,beamSvg]});

const figure=k.plateHtml({fig:'Fig. 01',title:'James Webb · cómo observa',hint:'Elige una etapa',readout:'01 / luz entrante',keys:[
  {mark:'lit',label:'Recorrido esquemático de la luz'},
  {mark:'raised',label:'Espejos y estructura'},
  {mark:'dim',label:'Parasol de cinco capas'}
],caption:'La trayectoria se muestra de manera simplificada y la animación está ralentizada. Los tamaños y las distancias de la ilustración no están a escala.',body:`<div class="iso-stage" aria-label="Modelo interactivo del telescopio">${svg}</div>`});
const body=`<style>${readFileSync(join(HERE,'style.css'),'utf8')}</style>
<header class="intro"><p class="eyebrow">Un observatorio para luz invisible <span>·</span> Anatomía 01</p><h1>Cómo funciona el<br><em>James Webb</em></h1><p class="lead">Un gran espejo recoge luz infrarroja muy débil. Para verla, el telescopio debe mantenerse extraordinariamente frío.</p></header>
${figure}
<div class="controls" aria-label="Etapas del funcionamiento">
<button type="button" data-step="0" aria-pressed="true"><span>01</span> Recoger</button>
<button type="button" data-step="1" aria-pressed="false"><span>02</span> Reflejar</button>
<button type="button" data-step="2" aria-pressed="false"><span>03</span> Medir</button>
<button type="button" data-step="3" aria-pressed="false"><span>04</span> Enfriar</button>
</div>
<section class="step-description" aria-live="polite"><p class="step-kicker" data-step-kicker>01 · RECOGER</p><h2 data-step-title>Un espejo gigante para señales débiles</h2><p data-step-copy>Los 18 segmentos hexagonales, ajustados para funcionar como una sola superficie de 6,5 metros, recogen la luz que llega desde el espacio.</p></section>
<div class="facts"><div><strong>18</strong><span>segmentos</span></div><div><strong>6,5 m</strong><span>espejo principal</span></div><div><strong>5</strong><span>capas de protección</span></div><div><strong>≈ 1,5 M km</strong><span>de la Tierra, cerca de L2</span></div></div>
<section class="story"><p class="eyebrow">Lo que el ojo no ve</p><h2>¿Por qué infrarrojo?</h2><p>La luz infrarroja ayuda a estudiar regiones envueltas en polvo y a detectar luz de galaxias muy lejanas que se ha estirado hacia longitudes de onda mayores por la expansión del universo. Webb observa principalmente en infrarrojo, desde unos <strong>0,6 hasta 28,5 micrómetros</strong>, incluyendo una pequeña parte del rojo visible.</p><p>Los detectores registran señales digitales. Para crear imágenes que podamos ver, se combinan observaciones de distintos filtros y se les asignan colores visibles; los espectros, además, permiten estudiar propiedades como la composición de los objetos.</p></section>
<section class="story final-story"><p class="eyebrow">La temperatura importa</p><h2>Una sombra para escuchar al universo</h2><p>Todo objeto caliente emite infrarrojo. Si el propio telescopio estuviera caliente, su resplandor dificultaría detectar señales tenues. El parasol de cinco capas protege la óptica del Sol, la Tierra y la Luna: el telescopio permanece por debajo de <strong>50 K</strong> (aproximadamente −223 °C). El instrumento MIRI necesita refrigeración adicional hasta unos <strong>7 K</strong>.</p><p>Webb viaja alrededor del Sol en una órbita cerca del punto de Lagrange <strong>L2</strong>, a unos 1,5 millones de kilómetros de la Tierra. Esto permite mantener el parasol orientado hacia el Sol, la Tierra y la Luna mientras observa el espacio en la dirección opuesta.</p></section>
<footer><span>Fuentes</span><div><a href="https://science.nasa.gov/mission/webb/optical-telescope-element-ote/">NASA · óptica</a><a href="https://science.nasa.gov/mission/webb/webbs-sunshield/">NASA · parasol y temperatura</a><a href="https://science.nasa.gov/mission/webb/science-overview/science-explainers/spectroscopy-101-invisible-spectroscopy/">NASA · espectroscopía</a><a href="https://science.nasa.gov/mission/webb/science-overview/science-explainers/how-are-webbs-full-color-images-made/">NASA · imágenes a color</a></div></footer>`;
const live=readFileSync(join(HERE,'live.js'),'utf8').replace('__PATH__',JSON.stringify(coords));
let html=k.pageHtml({title:'Cómo funciona el telescopio James Webb',theme,body,script:live,width:900}).replace('<html lang="en">','<html lang="es">');
const output=theme==='light'?'james-webb-light.html':'james-webb.html';
writeFileSync(join(HERE,output),html);
console.log(`wrote ${output}: ${R.items.length} recorded solids, ${centers.length} mirror segments`);
A.auditOrExit(R,P);
