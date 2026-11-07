const filas = 12;
const columnas = 12;
const contenedorMarco = document.getElementById("contenedor-marco");
const textoDefinicionActiva = document.getElementById("texto-definicion-activa");

let direccionHorizontal = true;
let ultimaCasillaActiva = null;
let definicionesCargadas = [];
const tablero = [];

// --- VARIABLES Y FUNCIONES DEL CRONÓMETRO (EN ÁMBITO GLOBAL) ---
let segundosTotales = 0;
let intervaloCronometro = null;
let cronometroIniciado = false;

function iniciarCronometro() {
  if (!cronometroIniciado) {
    cronometroIniciado = true;
    intervaloCronometro = setInterval(() => {
      segundosTotales++;
      actualizarVisualizadorTiempo();
    }, 1000);
  }
}

function detenerCronometro() {
  clearInterval(intervaloCronometro);
  intervaloCronometro = null;
}

function reiniciarCronometro() {
  detenerCronometro();
  segundosTotales = 0;
  cronometroIniciado = false;
  actualizarVisualizadorTiempo();
}

function actualizarVisualizadorTiempo() {
  const horas = String(Math.floor(segundosTotales / 3600)).padStart(2, '0');
  const minutos = String(Math.floor((segundosTotales % 3600) / 60)).padStart(2, '0');
  const segundos = String(segundosTotales % 60).padStart(2, '0');
  
  const relojEl = document.getElementById("cronometro");
  if (relojEl) {
    relojEl.textContent = `Tiempo: ${horas}:${minutos}:${segundos}`;
  }
}

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
      input.setAttribute("inputmode", "latin");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocorrect", "off");
      input.setAttribute("autocapitalize", "characters");
      input.maxLength = 1;
      input.classList.add("casilla");
      
      tablero[f][c] = input;
      contenedorCelda.appendChild(input);

      const seleccionarTexto = () => {
        setTimeout(() => input.select(), 0);
      };

      input.addEventListener("contextmenu", (e) => e.preventDefault());

      // --- DENTRO DE LA CREACIÓN DE CADA INPUT (en el bucle de casillas) ---
      input.addEventListener("click", () => {
        if (input.classList.contains("bloqueada")) return;

        // Si la celda estaba marcada en rojo por error, al hacer clic se le quita
        input.classList.remove("casilla-incorrecta");

        iniciarCronometro(); 

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
          limpiarSeleccionYDefinicion();
          return;
        }
        
        // Si la celda estaba marcada en rojo por error, al enfocar se le quita
        input.classList.remove("casilla-incorrecta");

        iniciarCronometro(); 
        seleccionarTexto();
        actualizarResaltadoYDefinicion(f, c);
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      input.addEventListener("input", () => {
        if (input.value.length > 1) {
          input.value = input.value.slice(-1);
        }

        if (input.value.length === 1) {
          ultimaCasillaActiva = null;
          avanzarSiguienteCasilla(f, c);
        }
        
        verificarSiEstaCompletoYCorrecto();
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

// Limpiar resaltados y dejar el recuadro de definición completamente vacío
function limpiarSeleccionYDefinicion() {
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const inp = tablero[f][c];
      if (inp) {
        inp.classList.remove("celda-resaltada", "celda-activa-palabra");
      }
    }
  }
  if (textoDefinicionActiva) {
    textoDefinicionActiva.innerHTML = "";
  }
}

// Detectar clics fuera del crucigrama para limpiar el cuadro de definición
document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("casilla") && !e.target.classList.contains("referencia-borde")) {
    limpiarSeleccionYDefinicion();
    ultimaCasillaActiva = null;
  }
});

// Actualizar resaltado de palabra y mostrar definición limpia
function actualizarResaltadoYDefinicion(f, c) {
  for (let row = 0; row < filas; row++) {
    for (let col = 0; col < columnas; col++) {
      const inp = tablero[row][col];
      if (inp) inp.classList.remove("celda-resaltada", "celda-activa-palabra");
    }
  }

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
    for (let i = 0; i < palabraEncontrada.longitud; i++) {
      let rf = palabraEncontrada.orientacion === 'horizontal' ? palabraEncontrada.fila : palabraEncontrada.fila + i;
      let rc = palabraEncontrada.orientacion === 'horizontal' ? palabraEncontrada.col + i : palabraEncontrada.col;
      
      const celdaPalabra = tablero[rf][rc];
      if (celdaPalabra) {
        if (rf === f && rc === c) {
          celdaPalabra.classList.add("celda-activa-palabra");
        } else {
          celdaPalabra.classList.add("celda-resaltada");
        }
      }
    }
  }

  if (palabraEncontrada && textoDefinicionActiva) {
    const sentido = direccionHorizontal ? "Horizontal" : "Vertical";
    textoDefinicionActiva.innerHTML = `
      <div class="definicion-activa">
        <strong>${palabraEncontrada.num} - ${sentido}</strong><br>
        ${palabraEncontrada.textoDefinicion}
      </div>
    `;
  } else if (textoDefinicionActiva) {
    textoDefinicionActiva.innerHTML = "";
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

// --- VALIDACIÓN DE VICTORIA Y MARCADO DE ERRORES ---
function comprobarConSolucionReal() {
  let esTodoCorrecto = true;

  // Limpiamos marcas de error anteriores en todo el tablero
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (tablero[f][c]) tablero[f][c].classList.remove("casilla-incorrecta");
    }
  }

  // Comparamos palabra por palabra y letra por letra
  for (let p of definicionesCargadas) {
    let palabraEscrita = "";
    let indicesPalabra = [];
    
    for (let i = 0; i < p.longitud; i++) {
      let rf = p.orientacion === 'horizontal' ? p.fila : p.fila + i;
      let rc = p.orientacion === 'horizontal' ? p.col + i : p.col;
      indicesPalabra.push({ f: rf, c: rc });
      palabraEscrita += (tablero[rf][rc].value || "").toUpperCase().trim();
    }
    
    const solucionReal = p.solucion ? p.solucion.toUpperCase().trim() : "";

    // Verificar letra por letra para marcar individualmente las incorrectas
    for (let i = 0; i < p.longitud; i++) {
      let letraEscrita = palabraEscrita[i] || "";
      let letraReal = solucionReal[i] || "";
      
      if (letraEscrita !== letraReal) {
        esTodoCorrecto = false;
        // Colorear de rojo la celda exacta que falló
        tablero[indicesPalabra[i].f][indicesPalabra[i].c].classList.add("casilla-incorrecta");
      }
    }
  }

  return esTodoCorrecto;
}

function verificarSiEstaCompletoYCorrecto() {
  let todoRelleno = true;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const input = tablero[f][c];
      if (!input.classList.contains("bloqueada")) {
        if (input.value.trim() === "") {
          todoRelleno = false;
        }
      }
    }
  }

  if (todoRelleno) {
    const esCorrecto = comprobarConSolucionReal();
    if (esCorrecto) {
      detenerCronometro();
      alert(`¡Enhorabuena! Has completado el crucigrama correctamente en ${document.getElementById("cronometro").textContent}`);
    }
  }
}

// --- FUNCIÓN EXTRA DE DEBUG (TECLA 1) ---
document.addEventListener("keydown", (e) => {
  if (e.key === "1") {
    for (let f = 0; f < filas; f++) {
      for (let c = 0; c < columnas; c++) {
        const input = tablero[f][c];
        if (input && !input.classList.contains("bloqueada")) {
          input.value = "T";
        }
      }
    }
    verificarSiEstaCompletoYCorrecto();
    console.log("Modo Debug: Tablero rellenado con 'T' para testear.");
  }
});

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

      let index = 0;
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
      reiniciarCronometro(); // Reinicia el tiempo al cargar un nuevo crucigrama
    })
    .catch(error => {
      console.error("Error al cargar el crucigrama:", error);
      alert("Hubo un error al cargar el crucigrama inicial: " + error.message);
    });
}

// Ejecutar la carga al iniciar
cargarCrucigramaInicial();