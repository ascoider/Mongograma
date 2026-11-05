const filas = 12;
const columnas = 12;

const contenedor = document.getElementById("tablero-crucigrama");
const textoDefinicionActiva = document.getElementById("texto-definicion-activa");

contenedor.style.gridTemplateColumns = `repeat(${columnas}, 40px)`;

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
      if (input.value.length === 1) {
        ultimaCasillaActiva = null;
        avanzarSiguienteCasilla(f, c);
      }
    });

    contenedor.appendChild(input);
  }
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
    // Buscar la palabra horizontal a la que pertenece esta casilla
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'horizontal' && p.fila === f && c >= p.col && c < p.col + p.longitud
    );
  } else {
    // Buscar la palabra vertical a la que pertenece esta casilla
    palabraEncontrada = definicionesCargadas.find(p => 
      p.orientacion === 'vertical' && p.col === c && f >= p.fila && f < p.fila + p.longitud
    );
  }

  if (palabraEncontrada) {
    const sentido = direccionHorizontal ? "Horizontal" : "Vertical";
    textoDefinicionActiva.innerHTML = `
      <div class="definicion-activa">
        <strong>${palabraEncontrada.id} (${sentido} - ${palabraEncontrada.longitud} letras):</strong><br>
        ${palabraEncontrada.textoDefinicion}
      </div>
    `;
  } else {
    textoDefinicionActiva.textContent = "No hay definición asociada a esta casilla.";
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

    if (sigFila >= filas || sigCol >= columnas) break;

    const siguienteInput = tablero[sigFila][sigCol];
    if (!siguienteInput.classList.contains("bloqueada")) {
      siguienteInput.focus();
      actualizarResaltadoYDefinicion(sigFila, sigCol);
      break;
    }
  }
}

// 2. Cargar automáticamente el archivo JSON del crucigrama desde el servidor
function cargarCrucigramaInicial() {
  // Hacemos una petición fetch al archivo .json físico en la web
  fetch("Crucigramas resueltos/crucigrama001.json") // Ajusta la ruta si la carpeta tiene otro nombre exacto
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