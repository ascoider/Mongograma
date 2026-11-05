const filas = 12;
const columnas = 12;

const contenedor = document.getElementById("tablero-crucigrama");
const btnGuardar = document.getElementById("btn-guardar");
const selectGuardados = document.getElementById("select-guardados");
const listaHorizontales = document.getElementById("lista-horizontales");
const listaVerticales = document.getElementById("lista-verticales");

const btnAbrirGestion = document.getElementById("btn-abrir-gestion");
const modalGestion = document.getElementById("modal-gestion");
const btnCerrarGestion = document.getElementById("btn-cerrar-gestion");
const listaGestion = document.getElementById("lista-gestion");

contenedor.style.gridTemplateColumns = `repeat(${columnas}, 40px)`;

let direccionHorizontal = true;
let ultimaCasillaActiva = null;
let definicionesActuales = [];

const tablero = [];

for (let f = 0; f < filas; f++) {
  tablero[f] = [];
  
  for (let c = 0; c < columnas; c++) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 1;
    input.classList.add("casilla");

    tablero[f][c] = input;

    const seleccionarTexto = () => {
      setTimeout(() => {
        input.select();
      }, 0);
    };

    input.addEventListener("mousedown", (evento) => {
      if (input.classList.contains("bloqueada")) {
        evento.preventDefault();
      }
    });

    input.addEventListener("click", () => {
      if (input.classList.contains("bloqueada")) return;

      if (ultimaCasillaActiva === input) {
        direccionHorizontal = !direccionHorizontal;
      } else {
        ultimaCasillaActiva = input;
      }

      seleccionarTexto();
      actualizarResaltadoLinea(f, c);
    });

    input.addEventListener("focus", () => {
      if (input.classList.contains("bloqueada")) {
        input.blur();
        return;
      }
      seleccionarTexto();
      actualizarResaltadoLinea(f, c);
    });

    input.addEventListener("contextmenu", (evento) => {
      evento.preventDefault();
      input.classList.toggle("bloqueada");

      if (input.classList.contains("bloqueada")) {
        input.value = "";
        input.readOnly = true;
        
        if (ultimaCasillaActiva === input) {
          ultimaCasillaActiva = null;
        }
      } else {
        input.readOnly = false;
      }
      
      actualizarResaltadoLinea(f, c);
      actualizarDefiniciones();
    });

    input.addEventListener("input", () => {
      if (input.value.length === 1) {
        ultimaCasillaActiva = null;
        avanzarSiguienteCasilla(f, c);
      }
    });

    contenedor.appendChild(input);
  }
}

function actualizarResaltadoLinea(fActiva, cActiva) {
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const casilla = tablero[f][c];
      casilla.classList.remove("en-linea");

      if (casilla.classList.contains("bloqueada")) continue;

      if (direccionHorizontal && f === fActiva) {
        casilla.classList.add("en-linea");
      } else if (!direccionHorizontal && c === cActiva) {
        casilla.classList.add("en-linea");
      }
    }
  }
}

function avanzarSiguienteCasilla(f, c) {
  let sigFila = f;
  let sigCol = c;

  while (true) {
    if (direccionHorizontal) {
      sigCol++;
      if (sigCol >= columnas) {
        sigCol = 0;
        sigFila++;
      }
    } else {
      sigFila++;
      if (sigFila >= filas) {
        sigFila = 0;
        sigCol++;
      }
    }

    if (sigFila >= filas || sigCol >= columnas) {
      break;
    }

    const siguienteInput = tablero[sigFila][sigCol];

    if (!siguienteInput.classList.contains("bloqueada")) {
      siguienteInput.focus();
      actualizarResaltadoLinea(sigFila, sigCol);
      break;
    }
  }
}

// --- DETECCIÓN AUTOMÁTICA DE PALABRAS ---

function detectarPalabras() {
  const palabras = [];
  let numHorizontal = 1;
  let numVertical = 1;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (!tablero[f][c].classList.contains("bloqueada")) {
        const esInicioHorizontal = (c === 0 || tablero[f][c - 1].classList.contains("bloqueada"));
        
        if (esInicioHorizontal) {
          let longitud = 0;
          let palabraSolucion = "";
          while (c + longitud < columnas && !tablero[f][c + longitud].classList.contains("bloqueada")) {
            palabraSolucion += tablero[f][c + longitud].value;
            longitud++;
          }

          if (longitud >= 1) {
            palabras.push({
              id: `H${numHorizontal}`,
              orientacion: 'horizontal',
              num: numHorizontal++,
              fila: f,
              col: c,
              longitud: longitud,
              solucion: palabraSolucion,
              textoDefinicion: ""
            });
          }
        }
      }
    }
  }

  for (let c = 0; c < columnas; c++) {
    for (let f = 0; f < filas; f++) {
      if (!tablero[f][c].classList.contains("bloqueada")) {
        const esInicioVertical = (f === 0 || tablero[f - 1][c].classList.contains("bloqueada"));
        
        if (esInicioVertical) {
          let longitud = 0;
          let palabraSolucion = "";
          while (f + longitud < filas && !tablero[f + longitud][c].classList.contains("bloqueada")) {
            palabraSolucion += tablero[f + longitud][c].value;
            longitud++;
          }

          if (longitud >= 1) {
            palabras.push({
              id: `V${numVertical}`,
              orientacion: 'vertical',
              num: numVertical++,
              fila: f,
              col: c,
              longitud: longitud,
              solucion: palabraSolucion,
              textoDefinicion: ""
            });
          }
        }
      }
    }
  }

  return palabras;
}

function actualizarDefiniciones() {
  const palabrasNuevas = detectarPalabras();
  listaHorizontales.innerHTML = "";
  listaVerticales.innerHTML = "";

  palabrasNuevas.forEach(p => {
    const div = document.createElement("div");
    div.classList.add("item-definicion");

    const label = document.createElement("label");
    label.textContent = `${p.id} (${p.longitud} letras):`;

    const inputDef = document.createElement("input");
    inputDef.type = "text";
    inputDef.placeholder = "Escribe la definición aquí...";
    inputDef.dataset.id = p.id;

    const existente = definicionesActuales.find(d => d.id === p.id && d.fila === p.fila && d.col === p.col);
    if (existente) {
      inputDef.value = existente.textoDefinicion;
      p.textoDefinicion = existente.textoDefinicion;
    }

    inputDef.addEventListener("input", (e) => {
      p.textoDefinicion = e.target.value;
    });

    div.appendChild(label);
    div.appendChild(inputDef);

    if (p.orientacion === 'horizontal') {
      listaHorizontales.appendChild(div);
    } else {
      listaVerticales.appendChild(div);
    }
  });

  definicionesActuales = palabrasNuevas;
}

// --- SISTEMA DE GUARDADO, CARGA, REORDENAMIENTO Y ELIMINACIÓN ---

function obtenerClavesGuardadas() {
  return Object.keys(localStorage).filter(k => k.startsWith("crucigrama")).sort();
}

function actualizarListaGuardados() {
  selectGuardados.innerHTML = '<option value="">-- Cargar crucigrama resuelto --</option>';
  const keys = obtenerClavesGuardadas();
  
  keys.forEach(key => {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = key;
    selectGuardados.appendChild(option);
  });
}

// Reindexar todas las claves ordenadas para mantener secuencia limpia (crucigrama001, 002...)
function reindexarClaves() {
  const keys = obtenerClavesGuardadas();
  const datosTemporales = keys.map(k => localStorage.getItem(k));
  
  // Limpiar claves antiguas de crucigramas
  keys.forEach(k => localStorage.removeItem(k));
  
  // Volver a guardar con orden secuencial estricto
  datosTemporales.forEach((dato, index) => {
    const nuevaClave = "crucigrama" + String(index + 1).padStart(3, '0');
    localStorage.setItem(nuevaClave, dato);
  });

  actualizarListaGuardados();
  actualizarModalGestion();
}

btnGuardar.addEventListener("click", () => {
  const keys = obtenerClavesGuardadas();
  const nuevoNumero = keys.length + 1;
  const nombreClave = "crucigrama" + String(nuevoNumero).padStart(3, '0');

  const datosTablero = [];
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      datosTablero.push({
        letra: tablero[f][c].value,
        bloqueada: tablero[f][c].classList.contains("bloqueada")
      });
    }
  }

  actualizarDefiniciones();

  definicionesActuales.forEach(p => {
    if (!p.textoDefinicion || p.textoDefinicion.trim() === "") {
      p.textoDefinicion = p.id.toLowerCase();
    }
  });

  const datosCompletos = {
    tablero: datosTablero,
    definiciones: definicionesActuales
  };

  localStorage.setItem(nombreClave, JSON.stringify(datosCompletos));
  actualizarListaGuardados();
  actualizarDefiniciones();

  // Descarga del JSON físico
  const contenidoJson = JSON.stringify(datosCompletos, null, 2);
  const blob = new Blob([contenidoJson], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const enlaceTemporal = document.createElement("a");
  enlaceTemporal.href = url;
  enlaceTemporal.download = `${nombreClave}.json`;
  document.body.appendChild(enlaceTemporal);
  enlaceTemporal.click();
  document.body.removeChild(enlaceTemporal);
  URL.revokeObjectURL(url);

  alert(`¡Crucigrama guardado como "${nombreClave}"!`);
});

selectGuardados.addEventListener("change", () => {
  const nombreClave = selectGuardados.value;
  if (!nombreClave) return;

  const datosGuardados = JSON.parse(localStorage.getItem(nombreClave));
  if (!datosGuardados) return;

  let index = 0;
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const celdaDatos = datosGuardados.tablero[index];
      const input = tablero[f][c];

      input.value = celdaDatos.letra;

      if (celdaDatos.bloqueada) {
        input.classList.add("bloqueada");
        input.readOnly = true;
      } else {
        input.classList.remove("bloqueada");
        input.readOnly = false;
      }
      index++;
    }
  }

  definicionesActuales = datosGuardados.definiciones || [];
  actualizarDefiniciones();

  alert(`Crucigrama "${nombreClave}" cargado.`);
  selectGuardados.value = "";
});

// --- LÓGICA DEL MODAL DE GESTIÓN (SUBIR, BAJAR, ELIMINAR) ---

function actualizarModalGestion() {
  listaGestion.innerHTML = "";
  const keys = obtenerClavesGuardadas();

  if (keys.length === 0) {
    listaGestion.innerHTML = "<p>No hay crucigramas guardados.</p>";
    return;
  }

  keys.forEach((key, index) => {
    const div = document.createElement("div");
    div.classList.add("item-gestion");

    const span = document.createElement("span");
    span.textContent = key;

    const divBotones = document.createElement("div");

    // Botón Subir
    const btnSubir = document.createElement("button");
    btnSubir.textContent = "▲";
    btnSubir.disabled = (index === 0);
    btnSubir.addEventListener("click", () => {
      intercambiarGuardados(index, index - 1);
    });

    // Botón Bajar
    const btnBajar = document.createElement("button");
    btnBajar.textContent = "▼";
    btnBajar.disabled = (index === keys.length - 1);
    btnBajar.addEventListener("click", () => {
      intercambiarGuardados(index, index + 1);
    });

    // Botón Eliminar
    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "🗑️";
    btnEliminar.style.backgroundColor = "#f44336";
    btnEliminar.style.color = "white";
    btnEliminar.addEventListener("click", () => {
      if (confirm(`¿Seguro que deseas eliminar "${key}"?`)) {
        localStorage.removeItem(key);
        reindexarClaves();
      }
    });

    divBotones.appendChild(btnSubir);
    divBotones.appendChild(btnBajar);
    divBotones.appendChild(btnEliminar);

    div.appendChild(span);
    div.appendChild(divBotones);
    listaGestion.appendChild(div);
  });
}

function intercambiarGuardados(i1, i2) {
  const keys = obtenerClavesGuardadas();
  const val1 = localStorage.getItem(keys[i1]);
  const val2 = localStorage.getItem(keys[i2]);

  // Intercambiamos los valores en localStorage temporalmente
  localStorage.setItem(keys[i1], val2);
  localStorage.setItem(keys[i2], val1);

  actualizarListaGuardados();
  actualizarModalGestion();
}

btnAbrirGestion.addEventListener("click", () => {
  actualizarModalGestion();
  modalGestion.style.display = "flex";
});

btnCerrarGestion.addEventListener("click", () => {
  modalGestion.style.display = "none";
});

// Inicialización
actualizarListaGuardados();
actualizarDefiniciones();