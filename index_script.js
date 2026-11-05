const filas = 12;
const columnas = 12;

const contenedor = document.getElementById("tablero-crucigrama");
const textoDefinicionActiva = document.getElementById("texto-definicion-activa");

contenedor.style.gridTemplateColumns = `repeat(${columnas}, var(--tamano-casilla))`;
contenedor.style.gridTemplateRows = `repeat(${columnas}, var(--tamano-casilla))`;

let direccionHorizontal = true;
let ultimaCasillaActiva = null;
let definicionesCargadas = [];
const tablero = [];

// 1. Construir la cuadrícula interactiva
for (let f = 0; f < filas; f++) {
  tablero[f] = [];
  for (let c = 0; c < columnas; c++) {
    const input = document.createElement("input");
    input.type = "text";
    input.setAttribute("inputmode", "text"); // Pide el teclado alfabético estándar
    input.setAttribute("autocomplete", "off"); // Desactiva autocompletados molestos
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "characters"); // Fuerza mayúsculas directamente
    input.maxLength = 1;
    input.classList.add("casilla");
    tablero[f][c] = input;

    const seleccionarTexto = () => {
      setTimeout(() => input.select(), 0);
    };

    // Bloquear el clic derecho para que el usuario no pueda alterar las casillas bloqueadas
    input.addEventListener("contextmenu", (e) => {
      e.preventDefault();
    });

    // Clic izquierdo: doble clic en la misma celda cambia la dirección
    input.addEventListener("click", () => {
      if (input.classList.contains("bloqueada")) return;

      if (ultimaCasillaActiva === input) {
        direccionHorizontal = !direccionHorizontal;
      } else {
        ultimaCasillaActiva = input;
      }

      seleccionarTexto();
      actualizarResaltadoYDefinicion(f, c);
    });

    input.addEventListener("focus", () => {
      if (input.classList.contains("bloqueada")) {
        input.blur();
        return;
      }
      seleccionarTexto();
      actualizarResaltadoYDefinicion(f, c);
    });

    input.addEventListener("input", () => {
      // Si el navegador introduce más de un carácter por velocidad, nos quedamos solo con el último
      if (input.value.length > 1) {
        input.value = input.value.slice(-1);
      }

      if (input.value.length === 1) {
        ultimaCasillaActiva = null;
        
        // Buscamos las coordenadas reales de esta casilla exacta en la matriz
        let coordenadaActual = buscarCoordenadasCasilla(input);
        if (coordenadaActual) {
          avanzarSiguienteCasilla(coordenadaActual.f, coordenadaActual.c);
        }
      }
    });

    // Control de la tecla Backspace para ordenador y Android
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault(); 

        if (input.value !== '') {
          // Si la casilla actual tiene letra, la borramos
          input.value = '';
        } else {
          // Si está vacía, retrocedemos a la anterior dentro de la palabra activa
          const casillaAnterior = obtenerCasillaAnteriorEnPalabra(f, c);
          
          if (casillaAnterior) {
            casillaAnterior.value = '';
            casillaAnterior.focus();
          }
        }
      }
    });

    contenedor.appendChild(input);
  }
}

// Función para localizar la casilla anterior exacta dentro de la palabra activa
function obtenerCasillaAnteriorEnPalabra(fActiva, cActiva) {
  let f = fActiva;
  let c = cActiva;

  // Retrocedemos una posición según la dirección actual
  if (direccionHorizontal) {
    c--;
  } else {
    f--;
  }

  // Verificamos límites y si la casilla es válida y no bloqueada
  if (f >= 0 && f < filas && c >= 0 && c < columnas) {
    const casillaPrev = tablero[f][c];
    if (!casillaPrev.classList.contains("bloqueada")) {
      return casillaPrev;
    }
  }
  return null;
}

function actualizarResaltadoYDefinicion(fActiva, cActiva) {
  // 1. Actualizar colores de línea en el tablero
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

  // 2. Buscar y mostrar la definición exacta de la palabra activa según la dirección
  mostrarDefinicionActiva(fActiva, cActiva);
}

function mostrarDefinicionActiva(f, c) {
  let palabraEncontrada = null;

  if (direccionHorizontal) {
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'horizontal' && p.fila === f && c >= p.col && c < p.col + p.longitud
    );
  } else {
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'vertical' && p.col === c && f >= p.fila && f < p.fila + p.longitud
    );
  }

  if (palabraEncontrada) {
    const sentido = direccionHorizontal ? "Horizontal" : "Vertical";
    textoDefinicionActiva.innerHTML = `
      <div class="definicion-activa">
        <strong>${palabraEncontrada.id} (${sentido} ${palabraEncontrada.longitud} letras):</strong><br>
        ${palabraEncontrada.textoDefinicion}
      </div>
    `;
  } else {
    textoDefinicionActiva.textContent = "No hay definición asociada a esta casilla.";
  }
}

// Función auxiliar para encontrar las coordenadas [f, c] de un input concreto de forma segura
function buscarCoordenadasCasilla(inputBuscado) {
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (tablero[f][c] === inputBuscado) {
        return { f, c };
      }
    }
  }
  return null;
}

function avanzarSiguienteCasilla(fActiva, cActiva) {
  let palabraEncontrada = null;

  // 1. Identificar la palabra activa actual según la dirección
  if (direccionHorizontal) {
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'horizontal' && p.fila === fActiva && cActiva >= p.col && cActiva < p.col + p.longitud
    );
  } else {
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'vertical' && p.col === cActiva && fActiva >= p.fila && fActiva < p.fila + p.longitud
    );
  }

  if (!palabraEncontrada) return;

  // 2. Construir la lista ordenada de casillas de esta palabra
  let celdasDePalabra = [];
  for (let i = 0; i < palabraEncontrada.longitud; i++) {
    let rf = palabraEncontrada.orientacion === 'horizontal' ? palabraEncontrada.fila : palabraEncontrada.fila + i;
    let rc = palabraEncontrada.orientacion === 'horizontal' ? palabraEncontrada.col + i : palabraEncontrada.col;
    celdasDePalabra.push({ f: rf, c: rc });
  }

  // 3. Encontrar nuestra posición actual dentro de la palabra
  let indexActual = celdasDePalabra.findIndex(celda => celda.f === fActiva && celda.c === cActiva);

  // 4. Si hay una casilla siguiente en la misma palabra, saltar a ella de forma limpia
  if (indexActual !== -1 && indexActual + 1 < celdasDePalabra.length) {
    let siguiente = celdasDePalabra[indexActual + 1];
    let siguienteInput = tablero[siguiente.f][siguiente.c];
    
    if (!siguienteInput.classList.contains("bloqueada")) {
      siguienteInput.focus();
      actualizarResaltadoYDefinicion(siguiente.f, siguiente.c);
    }
  }
}

// 2. Cargar automáticamente el archivo JSON del crucigrama desde el servidor
function cargarCrucigramaInicial() {
  fetch("solutions/crucigrama001.json")
    .then(response => {
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo del crucigrama.");
      }
      return response.json();
    })
    .then(datosGuardados => {
      let index = 0;
      for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
          const celdaDatos = datosGuardados.tablero[index];
          const input = tablero[f][c];

          input.value = ""; // Ocultar la solución al jugador
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

      definicionesCargadas = datosGuardados.definiciones || [];
    })
    .catch(error => {
      console.error("Error al cargar el crucigrama:", error);
      alert("Hubo un error al cargar el crucigrama inicial. Comprueba la ruta del archivo JSON.");
    });
}

// Inicializar
cargarCrucigramaInicial();