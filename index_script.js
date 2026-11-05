const filas = 12;
const columnas = 12;

// Usamos el contenedor unificado del Código 1
const contenedorMarco = document.getElementById("contenedor-marco"); 
const textoDefinicionActiva = document.getElementById("texto-definicion-activa");

let direccionHorizontal = true;
let ultimaCasillaActiva = null;
let definicionesCargadas = [];
const tablero = []; // Matriz bidimensional lógica para el juego

// Limpiar el contenedor por seguridad al iniciar
if (contenedorMarco) {
  contenedorMarco.innerHTML = "";

  // 0. Esquina superior izquierda vacía
  const esquinaVacia = document.createElement("div");
  esquinaVacia.classList.add("referencia-borde");
  contenedorMarco.appendChild(esquinaVacia);

  // 1. Números de la cabecera superior (1 al 12)
  for (let c = 0; c < columnas; c++) {
    const refCol = document.createElement("div");
    refCol.classList.add("referencia-borde");
    refCol.textContent = c + 1;
    contenedorMarco.appendChild(refCol);
  }

  // 2. Construir filas con su número lateral izquierdo y las casillas del tablero
  for (let f = 0; f < filas; f++) {
    tablero[f] = [];

    // Número lateral izquierdo (1 al 12)
    const refFila = document.createElement("div");
    refFila.classList.add("referencia-borde");
    refFila.textContent = f + 1;
    contenedorMarco.appendChild(refFila);

    for (let c = 0; c < columnas; c++) {
      const contenedorCelda = document.createElement("div");
      contenedorCelda.classList.add("celda-contenedor");

      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("inputmode", "text");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocorrect", "off");
      input.setAttribute("autocapitalize", "characters");
      input.maxLength = 1;
      input.classList.add("casilla");
      
      tablero[f][c] = input; // Guardamos el input en la matriz lógica
      contenedorCelda.appendChild(input);

      const seleccionarTexto = () => {
        setTimeout(() => input.select(), 0);
      };

      input.addEventListener("contextmenu", (e) => e.preventDefault());

      input.addEventListener("click", () => {
        if (input.classList.contains("bloqueada")) return;

        if (ultimaCasillaActiva === input) {
          direccionHorizontal = !direccionHorizontal;
        } else {
          ultimaCasillaActiva = input;
        }

        seleccionarTexto();
        mostrarDefinicionActiva(f, c);
      });

      input.addEventListener("focus", () => {
        if (input.classList.contains("bloqueada")) {
          input.blur();
          return;
        }
        seleccionarTexto();
        mostrarDefinicionActiva(f, c);
      });

      input.addEventListener("input", () => {
        if (input.value.length > 1) {
          input.value = input.value.slice(-1);
        }

        if (input.value.length === 1) {
          ultimaCasillaActiva = null;
          avanzarSiguienteCasilla(f, c);
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace') {
          e.preventDefault(); 

          if (input.value !== '') {
            input.value = '';
          } else {
            retrocederCasillaAnterior(f, c);
          }
        }
      });

      contenedorMarco.appendChild(contenedorCelda);
    }
  }
}

// Función para mostrar la definición activa
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

  if (palabraEncontrada && textoDefinicionActiva) {
    const sentido = direccionHorizontal ? "Horizontal" : "Vertical";
    textoDefinicionActiva.innerHTML = `
      <div class="definicion-activa">
        <strong>${palabraEncontrada.id} (${sentido} - ${palabraEncontrada.longitud} letras):</strong><br>
        ${palabraEncontrada.textoDefinicion}
      </div>
    `;
  } else if (textoDefinicionActiva) {
    textoDefinicionActiva.textContent = "Haz clic en una casilla para ver su definición.";
  }
}

function avanzarSiguienteCasilla(f, c) {
  let siguienteF = f;
  let siguienteC = c;
  if (direccionHorizontal) { siguienteC++; } else { siguienteF++; }
  if (siguienteF < filas && siguienteC < columnas) {
    const siguienteInput = tablero[siguienteF][siguienteC];
    if (siguienteInput && !siguienteInput.classList.contains("bloqueada")) {
      siguienteInput.focus();
    }
  }
}

function retrocederCasillaAnterior(f, c) {
  let anteriorF = f;
  let anteriorC = c;
  if (direccionHorizontal) { anteriorC--; } else { anteriorF--; }
  if (anteriorF >= 0 && anteriorC >= 0) {
    const anteriorInput = tablero[anteriorF][anteriorC];
    if (anteriorInput && !anteriorInput.classList.contains("bloqueada")) {
      anteriorInput.value = '';
      anteriorInput.focus();
    }
  }
}

// Cargar el crucigrama inicial leyendo el formato plano por índice del JSON
function cargarCrucigramaInicial() {
  fetch("solutions/crucigrama001.json")
    .then(response => {
      if (!response.ok) throw new Error("No se pudo cargar el archivo del crucigrama.");
      return response.json();
    })
    .then(datosGuardados => {
      if (!datosGuardados || !datosGuardados.tablero) {
        throw new Error("El archivo JSON no tiene la propiedad 'tablero'.");
      }

      let index = 0; // Índice plano para recorrer los 144 elementos del JSON[cite: 4]
      for (let f = 0; f < filas; f++) {
        for (let c = 0; c < columnas; c++) {
          const celdaDatos = datosGuardados.tablero[index];
          const input = tablero[f][c];

          if (input) {
            input.value = "";
            if (celdaDatos && celdaDatos.bloqueada) {
              input.classList.add("bloqueada");
              input.readOnly = true;
            } else {
              input.classList.remove("bloqueada");
              input.readOnly = false;
            }
          }
          index++;
        }
      }

      definicionesCargadas = datosGuardados.definiciones || [];
    })
    .catch(error => {
      console.error("Error al cargar el crucigrama:", error);
      alert("Hubo un error al cargar el crucigrama inicial: " + error.message);
    });
}

// Ejecutar la carga al iniciar
cargarCrucigramaInicial();