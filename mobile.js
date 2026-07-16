/* =============================================
   mobile.js — Lógica de la terminal móvil
   =============================================

   ESTRUCTURA:
   1. DATOS         — artículos y logo ASCII
   2. ESTADO        — historial de comandos
   3. COMANDOS      — objeto CMDS con cada comando
   4. HELPERS       — funciones para añadir líneas al output
   5. EJECUTAR      — parseo y despacho de comandos
   6. TECLADO       — Enter y flechas arriba/abajo
   7. RENDERERS     — artículos renderizados en terminal
   8. BOOT          — secuencia de arranque animada
   ============================================= */


// ─────────────────────────────────────────────
// 1. DATOS
// ─────────────────────────────────────────────

// Agrega aquí cada artículo nuevo que publiques.
// La clave (ej: 'guatemala') es el nombre que el
// usuario escribe en: open guatemala
//
// render: true  → el artículo se muestra directo
//                 en la terminal (sin navegar)
// url: 'x.html' → navega a una página externa
const ARTICULOS = {
  guatemala: {
    titulo: 'Golpe de Estado en Guatemala — 1954',
    desc:   'Descripción breve',
    render: true,
    tags:   ['imperialismo', 'latinoamerica', 'cia'],
  },
};

const ASCII_LOGO = `
      _-o#&&*''''?d:>b\\_
  _o/\`"''  '',, dMF9MMMHo_
 .o&#'        \`"MbHMMMMMHo.
 ,'              vodM*$&&HML
/               ,MMMMMMM#b?#\\
&              ?MMMMMMMMMMM7M
?$.           :MMMMMMMMMMMM/H
|             |MMMMMMMMMMMMbM
]MMH#          \`*MMMMMMMMMMb
MMMMMb_               |MMMMM
HMMMMMHo              \`MMMMT`;


// ─────────────────────────────────────────────
// 2. ESTADO
// ─────────────────────────────────────────────

let historial = [];
let histIdx   = -1;


// ─────────────────────────────────────────────
// 3. COMANDOS
// ─────────────────────────────────────────────

const CMDS = {

  help() {
    addHead('COMANDOS DISPONIBLES');
    const cmds = [
      ['ls',            'lista los artículos disponibles'],
      ['open <nombre>', 'abre un artículo  (ej: open guatemala)'],
      ['about',         'información sobre esta página'],
      ['whoami',        'identidad del sistema'],
      ['ascii',         'muestra el logo ASCII'],
      ['tags <tag>',    'filtra artículos por etiqueta'],
      ['clear',         'limpia la terminal'],
      ['help',          'muestra esta ayuda'],
    ];
    cmds.forEach(([cmd, desc]) => {
      addRaw(
        `<span style="color:var(--green);padding-left:14px;">${cmd.padEnd(18)}</span>` +
        `<span style="color:var(--muted);">${desc}</span>`
      );
    });
    addBlank();
  },

  ls() {
    addHead('./articulos');
    const bloque = document.createElement('div');
    bloque.className = 'section-block';

    Object.entries(ARTICULOS).forEach(([key]) => {
      const a = document.createElement('a');
      a.className   = 't-link';
      a.textContent = key + '.html';
      a.onclick     = () => runCmd('open ' + key);
      bloque.appendChild(a);
    });

    document.getElementById('output').appendChild(bloque);
    addOut(`${Object.keys(ARTICULOS).length} archivo(s) encontrado(s)`);
    addBlank();
  },

  about() {
    addHead('ACERCA DE');
    addInfo('En esta página subo pequeños artículos relacionados');
    addInfo('con los reels que subo en Instagram.');
    addBlank();
    addInfo('Refresca la página para restablecer el estado.');
    addBlank();
  },

  ascii() {
    const pre = document.createElement('pre');
    pre.style.cssText = 'color:var(--cyan-dim);font-size:11px;line-height:1.2;padding-left:14px;margin:4px 0;';
    pre.textContent = ASCII_LOGO;
    document.getElementById('output').appendChild(pre);
    addBlank();
  },

  clear() {
    document.getElementById('output').innerHTML = '';
  },

  open(args) {
    const key = (args[0] || '').toLowerCase();

    if (!key) {
      addErr('uso: open <nombre>  (ej: open guatemala)');
      return;
    }

    const art = ARTICULOS[key];
    if (!art) {
      addErr(`archivo "${key}" no encontrado. Usa "ls" para ver opciones.`);
      return;
    }

    // Si el artículo tiene render:true, lo mostramos
    // directo en la terminal sin navegar a otro HTML
    if (art.render) {
      addHead('CARGANDO');
      addInfo(`▸ ${art.titulo}`);
      addOut(art.desc);
      addBlank();

      let dots = 0;
      const loadLine = document.createElement('div');
      loadLine.className   = 'line out';
      loadLine.textContent = 'Cargando';
      document.getElementById('output').appendChild(loadLine);
      scrollDown();

      const iv = setInterval(() => {
        dots++;
        loadLine.textContent = 'Cargando' + '.'.repeat(dots % 4);
        if (dots >= 6) {
          clearInterval(iv);
          loadLine.remove();
          // Llama al renderer cuyo nombre coincide con la clave
          RENDERERS[key]();
        }
      }, 200);

      return;
    }

    // Si tiene url, navegamos
    addHead('ABRIENDO ARCHIVO');
    addInfo(`▸ ${art.titulo}`);
    addOut(art.desc);
    addBlank();

    let dots = 0;
    const loadLine = document.createElement('div');
    loadLine.className   = 'line out';
    loadLine.textContent = 'Cargando';
    document.getElementById('output').appendChild(loadLine);
    scrollDown();

    const iv = setInterval(() => {
      dots++;
      loadLine.textContent = 'Cargando' + '.'.repeat(dots % 4);
      if (dots >= 8) {
        clearInterval(iv);
        if (art.url && art.url !== '#') {
          window.location.href = art.url;
        } else {
          loadLine.textContent = 'Artículo en construcción.';
          addErr('Este artículo aún no está disponible.');
          addBlank();
        }
      }
    }, 220);
  },

  tags(args) {
    const tag = (args[0] || '').toLowerCase();

    if (!tag) {
      addErr('uso: tags <etiqueta>  (ej: tags marxismo)');
      const todas = [...new Set(Object.values(ARTICULOS).flatMap(a => a.tags))];
      addOut('etiquetas disponibles: ' + todas.join(', '));
      return;
    }

    const filtrados = Object.entries(ARTICULOS)
      .filter(([, art]) => art.tags.includes(tag));

    if (!filtrados.length) {
      addErr(`ningún artículo con etiqueta "${tag}"`);
      return;
    }

    addHead(`ETIQUETA: ${tag}`);
    const bloque = document.createElement('div');
    bloque.className = 'section-block';

    filtrados.forEach(([key]) => {
      const a = document.createElement('a');
      a.className   = 't-link';
      a.textContent = key + '.html';
      a.onclick     = () => runCmd('open ' + key);
      bloque.appendChild(a);
    });

    document.getElementById('output').appendChild(bloque);
    addBlank();
  },
};


// ─────────────────────────────────────────────
// 4. HELPERS DE OUTPUT
// ─────────────────────────────────────────────

function addLine(cls, text) {
  const d = document.createElement('div');
  d.className   = 'line ' + cls;
  d.textContent = text;
  document.getElementById('output').appendChild(d);
  scrollDown();
}

function addRaw(html) {
  const d = document.createElement('div');
  d.className = 'line';
  d.innerHTML = html;
  document.getElementById('output').appendChild(d);
  scrollDown();
}

function addPrompt(t) { addLine('prompt', t); }
function addOut(t)    { addLine('out', t);    }
function addInfo(t)   { addLine('info', t);   }
function addErr(t)    { addLine('err', '✕ ' + t); }
function addHead(t)   { addLine('head', '── ' + t + ' ──'); }

function addBlank() {
  const d = document.createElement('div');
  d.className = 'line blank';
  document.getElementById('output').appendChild(d);
}

function scrollDown() {
  const o = document.getElementById('output');
  o.scrollTop = o.scrollHeight;
}

// Imprime un array de líneas con delay entre cada una.
// Cada elemento puede ser string o [string, clase].
function printSec(lineas, stepMs = 35) {
  return new Promise(async resolve => {
    for (const item of lineas) {
      const [texto, clase] = Array.isArray(item) ? item : [item, 'info'];
      await new Promise(r => setTimeout(r, stepMs));
      if (texto === '') addBlank();
      else addLine(clase, texto);
    }
    resolve();
  });
}


// ─────────────────────────────────────────────
// 5. EJECUTAR COMANDO
// ─────────────────────────────────────────────

function runCmd(raw) {
  const txt = (raw || '').trim();
  if (!txt) return;

  historial.unshift(txt);
  histIdx = -1;

  addPrompt(txt);

  const parts = txt.toLowerCase().split(/\s+/);
  const cmd   = parts[0];
  const args  = parts.slice(1);

  if (CMDS[cmd]) {
    CMDS[cmd](args);
  } else {
    addErr(`comando desconocido: "${cmd}"`);
    addOut('escribe "help" para ver los comandos disponibles.');
    addBlank();
  }

  const inp = document.getElementById('cmd-input');
  if (inp) inp.value = '';
}

function submitCmd() {
  const inp = document.getElementById('cmd-input');
  runCmd(inp.value);
}


// ─────────────────────────────────────────────
// 6. TECLADO
// ─────────────────────────────────────────────

document.getElementById('cmd-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitCmd();
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    histIdx = Math.min(histIdx + 1, historial.length - 1);
    if (historial[histIdx]) e.target.value = historial[histIdx];
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    histIdx = Math.max(histIdx - 1, -1);
    e.target.value = histIdx >= 0 ? historial[histIdx] : '';
  }
});


// ─────────────────────────────────────────────
// 7. RENDERERS
// ─────────────────────────────────────────────
// Cada función aquí corresponde a un artículo con
// render:true en ARTICULOS. El nombre de la función
// debe coincidir exactamente con la clave del artículo.
//
// Para agregar un artículo nuevo:
//   1. Agrégalo en ARTICULOS con render:true
//   2. Crea aquí una función async con su nombre
//   3. Usa printSec() para el contenido
//   4. Termina con el bloque "volver al inicio"

const RENDERERS = {

  async guatemala() {

    addLine('head', '════════════════════════════════════');
    addLine('head', '  OPERACIÓN PBSUCCESS');
    addLine('head', '  Golpe de Estado en Guatemala — 1954');
    addLine('head', '════════════════════════════════════');
    addBlank();

    await printSec([
      ['CONTEXTO', 'head'],
      'Pendiente',
    ]);

    addBlank();


    addBlank();
    addLine('head', '════════════════════════════════════');
    addLine('head', '  FIN DEL DOCUMENTO');
    addLine('head', '════════════════════════════════════');
    addBlank();

    // Enlace para volver al inicio
    const volver = document.createElement('a');
    volver.className   = 't-link';
    volver.textContent = 'volver al inicio';
    volver.onclick     = () => {
      document.getElementById('output').innerHTML = '';
      boot();
    };
    document.getElementById('output').appendChild(volver);
    scrollDown();
  },

  // ── PLANTILLA PARA ARTÍCULOS FUTUROS ──────────
  // async nombre_clave() {
  //   addLine('head', '════════════════════════');
  //   addLine('head', '  TÍTULO');
  //   addLine('head', '════════════════════════');
  //   addBlank();
  //   await printSec([
  //     ['SECCIÓN', 'head'],
  //     'Contenido...',
  //   ]);
  //   addBlank();
  //   // volver al inicio (copiar bloque de arriba)
  // },
};


// ─────────────────────────────────────────────
// 8. BOOT SEQUENCE
// ─────────────────────────────────────────────

async function boot() {
  const lines = [
    { fn: addOut,   t: 'iniciando SYS://daniel.io...', delay: 0   },
    { fn: addOut,   t: 'kernel v1.0 cargado.',          delay: 280 },
    { fn: addOut,   t: 'montando sistema de archivos...', delay: 180 },
    { fn: addOut,   t: 'OK',                             delay: 220 },
    { fn: addBlank, t: '',                               delay: 120 },
    { fn: addHead,  t: 'BIENVENIDO',                     delay: 80  },
    { fn: addInfo,  t: 'Artículos de política, teoría e historia.', delay: 100 },
    { fn: addInfo,  t: 'Escribe "help" para ver los comandos.',     delay: 80  },
    { fn: addInfo,  t: 'O toca los accesos rápidos de abajo.',      delay: 80  },
    { fn: addBlank, t: '',                               delay: 100 },
  ];

  for (const l of lines) {
    await new Promise(r => setTimeout(r, l.delay));
    if (l.fn === addBlank) addBlank();
    else l.fn(l.t);
  }

  await new Promise(r => setTimeout(r, 200));
  CMDS.ls();

  document.getElementById('cmd-input').focus();
}

boot();
