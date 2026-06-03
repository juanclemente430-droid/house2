/* =============================================
   ventanas.js — Sistema de ventanas
   =============================================

   CONCEPTO CENTRAL:
   Cada ventana tiene position:absolute dentro
   de #escritorio (position:relative).
   Mover una ventana = cambiar su left y top.

   ESTRUCTURA DE DATOS:
   `registroVentanas` es un objeto donde cada
   clave es el id de una ventana, y el valor
   guarda su estado (elemento DOM, minimizada,
   maximizada, posición anterior, etc.)
   ============================================= */

// --------------------------------------------------
// 1. REGISTRO DE ESTADO DE CADA VENTANA
// --------------------------------------------------

const registroVentanas = {};
// Ejemplo de cómo queda después de inicializar:
// {
//   "win-menu": {
//     el: <div.ventana>,       ← el elemento DOM
//     minimizada: false,
//     maximizada: false,
//     rectAnterior: null       ← guarda pos/tamaño antes de maximizar
//   }
// }


// --------------------------------------------------
// 2. Z-INDEX — QUIÉN QUEDA ENCIMA
// --------------------------------------------------

// Cada ventana tiene un z-index. Cuando haces click
// en una, subimos este contador y se lo asignamos.
// Así la última en recibir click siempre queda encima.
let zSuperior = 10;

function traerAlFrente(id) {
  zSuperior++;
  registroVentanas[id].el.style.zIndex = zSuperior;
}


// --------------------------------------------------
// 3. INICIALIZAR LAS VENTANAS DEL HTML
// --------------------------------------------------

// Buscamos todas las ventanas que ya existen en el HTML
// y las registramos.
document.querySelectorAll('.ventana').forEach(el => {
  const id = el.id;

  registroVentanas[id] = {
    el,
    minimizada: false,
    maximizada: false,
    rectAnterior: null
  };

  inicializarVentana(id);
  agregarBotonTaskbar(id);
});


// --------------------------------------------------
// 4. INICIALIZAR UNA VENTANA (drag, resize, botones)
// --------------------------------------------------

function inicializarVentana(id) {
  const s = registroVentanas[id];
  const el = s.el;

  // Traer al frente al hacer click en cualquier parte
  el.addEventListener('mousedown', () => traerAlFrente(id));

  // ---- DRAG (arrastrar) ----
  const barra = el.querySelector('.ventana-barra');

  // Variables locales del drag (no necesitan ser globales)
  let arrastrando = false;
  let offsetX = 0;  // distancia del cursor al borde izq de la ventana
  let offsetY = 0;  // distancia del cursor al borde sup de la ventana

  barra.addEventListener('mousedown', e => {
    // Si el click fue en un botón de control, ignoramos
    if (e.target.classList.contains('btn-ventana')) return;
    // Si está maximizada, no arrastramos
    if (s.maximizada) return;

    arrastrando = true;

    // Calculamos el offset: dónde dentro de la ventana hizo click
    // getBoundingClientRect() da coordenadas relativas a la ventana del navegador
    const rectVentana = el.getBoundingClientRect();
    const rectEscritorio = document.getElementById('escritorio').getBoundingClientRect();

    // Posición de la ventana relativa al escritorio
    const ventanaX = rectVentana.left - rectEscritorio.left;
    const ventanaY = rectVentana.top  - rectEscritorio.top;

    // Offset = posición del cursor - posición de la ventana
    // Esto nos dice "el cursor está N px desde la esquina izquierda de la ventana"
    offsetX = e.clientX - rectVentana.left;
    offsetY = e.clientY - rectVentana.top;

    e.preventDefault(); // evita seleccionar texto
  });

  // mousemove va en document para no perder el drag si el cursor sale de la ventana
  document.addEventListener('mousemove', e => {
    if (!arrastrando) return;

    const rectEscritorio = document.getElementById('escritorio').getBoundingClientRect();

    // Nueva posición = posición del cursor - offset - borde del escritorio
    let nuevoX = e.clientX - rectEscritorio.left - offsetX;
    let nuevoY = e.clientY - rectEscritorio.top  - offsetY;

    // Limitamos para que no salga del escritorio
    const maxX = rectEscritorio.width  - 40;  // deja 40px visible
    const maxY = rectEscritorio.height - 32;  // 32 = altura de la barra

    nuevoX = Math.max(-el.offsetWidth + 40, Math.min(nuevoX, maxX));
    nuevoY = Math.max(0, Math.min(nuevoY, maxY));

    el.style.left = nuevoX + 'px';
    el.style.top  = nuevoY + 'px';
  });

  document.addEventListener('mouseup', () => {
    arrastrando = false;
  });

  // Doble click en la barra = toggle maximizar
  barra.addEventListener('dblclick', e => {
    if (e.target.classList.contains('btn-ventana')) return;
    toggleMaximizar(id);
  });

  // ---- BOTONES DE CONTROL ----
  el.querySelector('.btn-close').addEventListener('click', () => cerrarVentana(id));
  el.querySelector('.btn-min').addEventListener('click',   () => toggleMinimizar(id));
  el.querySelector('.btn-max').addEventListener('click',   () => toggleMaximizar(id));

  // ---- RESIZE (redimensionar) ----
  const handle = el.querySelector('.resize-handle');
  if (!handle) return;

  let redimensionando = false;
  let anchoInicial = 0;
  let altoInicial  = 0;
  let cursorXInicial = 0;
  let cursorYInicial = 0;

  handle.addEventListener('mousedown', e => {
    redimensionando = true;
    anchoInicial   = el.offsetWidth;
    altoInicial    = el.offsetHeight;
    cursorXInicial = e.clientX;
    cursorYInicial = e.clientY;
    e.stopPropagation(); // evita que también dispare el drag
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!redimensionando) return;
    // Delta = cuánto se movió el cursor desde que empezó el resize
    const deltaX = e.clientX - cursorXInicial;
    const deltaY = e.clientY - cursorYInicial;
    // Nuevo tamaño = tamaño original + delta (con mínimos)
    el.style.width  = Math.max(200, anchoInicial + deltaX) + 'px';
    el.style.height = Math.max(100, altoInicial  + deltaY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    redimensionando = false;
  });
}


// --------------------------------------------------
// 5. CERRAR, MINIMIZAR, MAXIMIZAR
// --------------------------------------------------

function cerrarVentana(id) {
  const s = registroVentanas[id];
  if (!s) return;

  // Eliminamos el elemento del DOM
  s.el.remove();

  // Eliminamos su botón de la taskbar
  document.getElementById('taskbar-btn-' + id)?.remove();

  // Eliminamos del registro
  delete registroVentanas[id];
}
function toggleMinimizar(id) {
  const s = registroVentanas[id];
  if (!s) return;

  s.minimizada = !s.minimizada;

  // Ocultar/mostrar la ventana completa
  s.el.style.display = s.minimizada ? 'none' : 'flex';

  const btnTaskbar = document.getElementById('taskbar-btn-' + id);
  if (btnTaskbar) btnTaskbar.classList.toggle('minimizada', s.minimizada);

  if (!s.minimizada) traerAlFrente(id);
}

function toggleMaximizar(id) {
  const s = registroVentanas[id];
  const el = s.el;
  const escritorio = document.getElementById('escritorio');

  if (s.maximizada) {
    // RESTAURAR: volvemos a las dimensiones guardadas en rectAnterior
    const r = s.rectAnterior;
    el.style.left   = r.left   + 'px';
    el.style.top    = r.top    + 'px';
    el.style.width  = r.width  + 'px';
    el.style.height = r.height + 'px';
    s.maximizada = false;
  } else {
    // MAXIMIZAR: guardamos estado actual antes de cambiar
    s.rectAnterior = {
      left:   parseInt(el.style.left)  || el.offsetLeft,
      top:    parseInt(el.style.top)   || el.offsetTop,
      width:  el.offsetWidth,
      height: el.offsetHeight
    };
    // Ocupar todo el escritorio
    el.style.left   = '0px';
    el.style.top    = '0px';
    el.style.width  = escritorio.offsetWidth  + 'px';
    el.style.height = escritorio.offsetHeight + 'px';
    s.maximizada = true;
    traerAlFrente(id);
  }
}


// --------------------------------------------------
// 6. TASKBAR — botón por ventana
// --------------------------------------------------

function agregarBotonTaskbar(id) {
  const s = registroVentanas[id];
  const titulo = s.el.querySelector('.ventana-titulo')?.textContent || id;

  const btn = document.createElement('button');
  btn.className = 'taskbar-btn';
  btn.id = 'taskbar-btn-' + id;

  // Truncar título largo
  btn.textContent = titulo.length > 12 ? titulo.slice(0, 11) + '…' : titulo;

  btn.addEventListener('click', () => {
    const estado = registroVentanas[id];
    if (!estado) return;

    if (estado.minimizada) {
      // Restaurar si estaba minimizada
      toggleMinimizar(id);
    } else {
      // Si ya es visible, traer al frente
      traerAlFrente(id);
    }
  });

  document.getElementById('taskbar-botones').appendChild(btn);
}


// --------------------------------------------------
// 7. CREAR VENTANA DINÁMICAMENTE (notas)
// --------------------------------------------------

let contadorNotas = 0;

function crearNota() {
  contadorNotas++;
  const id = 'nota-' + contadorNotas;

  // Creamos el elemento ventana
  const el = document.createElement('div');
  el.className = 'ventana';
  el.id = id;

  // Posición escalonada para que no se apilen exactamente
  const xInicial = 80 + (contadorNotas % 6) * 30;
  const yInicial = 80 + (contadorNotas % 4) * 30;

  el.style.cssText = `left:${xInicial}px; top:${yInicial}px; width:280px; height:200px; z-index:${++zSuperior}`;

  el.innerHTML = `
    <div class="ventana-barra" data-id="${id}">
      <span class="ventana-titulo">NOTA_${contadorNotas}</span>
      <div class="ventana-controles">
        <button class="btn-ventana btn-min" title="Minimizar">_</button>
        <button class="btn-ventana btn-max" title="Maximizar">□</button>
        <button class="btn-ventana btn-close" title="Cerrar">✕</button>
      </div>
    </div>
    <div class="ventana-cuerpo">
      <textarea class="nota-textarea" placeholder="Escribe algo..."></textarea>
      <div class="resize-handle" data-id="${id}"></div>
    </div>
  `;

  document.getElementById('escritorio').appendChild(el);

  // Registrar y activar
  registroVentanas[id] = {
    el,
    minimizada: false,
    maximizada: false,
    rectAnterior: null
  };

  inicializarVentana(id);
  agregarBotonTaskbar(id);
  traerAlFrente(id);
}

//Sonido de boton
const ctx = new (window.AudioContext || window.webkitAudioContext)();

function sonidoHover() {
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

osc.frequency.value = 400;
osc.type = 'square';
  gain.gain.setValueAtTime(0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

  osc.start();
  osc.stop(ctx.currentTime + 0.12);
}

function sonidoClick() {
  if (ctx.state === 'suspended') ctx.resume();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = 440;   // más grave que el hover
  osc.type = 'square';         // más "duro"
  gain.gain.setValueAtTime(0.7, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.start();
  osc.stop(ctx.currentTime + 0.2);
}

document.querySelectorAll('.menu_boton').forEach(btn => {
  btn.addEventListener('mouseenter', sonidoHover);
  btn.addEventListener('mousedown', sonidoClick);
});