const filas = 12;
const columnas = 12;
const contenedorMarco = document.getElementById("contenedor-marco");
const textoDefinicionActiva = document.getElementById("texto-definicion-activa");
const divTeclado = document.getElementById("teclado-virtual");

let direccionHorizontal = true; // Por defecto siempre horizontal
let celdaActiva = null;
let ultimaCasillaClickada = null;
let definicionesCargadas = [];
const tablero = [];

// --- CONFIGURACIÓN DE VARIABLES PÚBLICAS DEL TECLADO VIRTUAL ---
const CONFIG_TECLADO = {
  alturaFila: "48px",        
  colorTeclaBg: "#ffffff",   
  colorTeclaTexto: "#000000",
  colorBorde: "#333333",     
  colorPulsada: "#d0ebff"    
};

document.documentElement.style.setProperty('--teclado-altura', CONFIG_TECLADO.alturaFila);
document.documentElement.style.setProperty('--tecla-bg', CONFIG_TECLADO.colorTeclaBg);
document.documentElement.style.setProperty('--tecla-color', CONFIG_TECLADO.colorTeclaTexto);
document.documentElement.style.setProperty('--tecla-borde', CONFIG_TECLADO.colorBorde);
document.documentElement.style.setProperty('--tecla-pulsada', CONFIG_TECLADO.colorPulsada);

// --- CRONÓMETRO ---
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

// --- CONSTRUCCIÓN DEL TECLADO VIRTUAL ---
function construirTecladoVirtual() {
  if (!divTeclado) return;
  divTeclado.innerHTML = "";

  const filasTeclas = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
    ["Z", "X", "C", "V", "B", "N", "M", "⌫"]
  ];

  filasTeclas.forEach(fLetras => {
    const filaDiv = document.createElement("div");
    filaDiv.classList.add("teclado-fila");

    fLetras.forEach(simbolo => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.textContent = simbolo;
      boton.classList.add("tecla");
      if (simbolo === "⌫") {
        boton.classList.add("tecla-especial");
      }

      boton.addEventListener("touchstart", (e) => {
        e.preventDefault();
        manejarPulsacionTeclaVirtual(simbolo);
      }, { passive: false });

      boton.addEventListener("click", (e) => {
        e.preventDefault();
        manejarPulsacionTeclaVirtual(simbolo);
      });

      filaDiv.appendChild(boton);
    });

    divTeclado.appendChild(filaDiv);
  });
}

function mostrarTecladoVirtual() {
  if (divTeclado) divTeclado.style.display = "flex";
}

function ocultarTecladoVirtual() {
  if (divTeclado) divTeclado.style.display = "none";
}

function manejarPulsacionTeclaVirtual(simbolo) {
  if (!celdaActiva || celdaActiva.classList.contains("bloqueada")) return;

  let fActual = -1, cActual = -1;
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (tablero[f][c] === celdaActiva) {
        fActual = f;
        cActual = c;
        break;
      }
    }
  }

  if (fActual === -1 || cActual === -1) return;

  if (simbolo === "⌫") {
    if (celdaActiva.value !== "") {
      celdaActiva.value = "";
    } else {
      retrocederCasillaAnterior(fActual, cActual);
    }
  } else {
    celdaActiva.value = simbolo;
    manejarAvanceTrasEscritura(fActual, cActual);
    verificarSiEstaCompletoYCorrecto();
  }
}

// --- CREACIÓN DEL TABLERO ---
if (contenedorMarco) {
  contenedorMarco.innerHTML = "";

  const esquinaVacia = document.createElement("div");
  esquinaVacia.classList.add("referencia-borde");
  contenedorMarco.appendChild(esquinaVacia);

  for (let c = 0; c < columnas; c++) {
    const refCol = document.createElement("div");
    refCol.classList.add("referencia-borde");
    refCol.textContent = c + 1;
    contenedorMarco.appendChild(refCol);
  }

  for (let f = 0; f < filas; f++) {
    tablero[f] = [];

    const refFila = document.createElement("div");
    refFila.classList.add("referencia-borde");
    refFila.textContent = f + 1;
    contenedorMarco.appendChild(refFila);

    for (let c = 0; c < columnas; c++) {
      const contenedorCelda = document.createElement("div");
      contenedorCelda.classList.add("celda-contenedor");

      const input = document.createElement("input");
      input.type = "text";
      input.setAttribute("inputmode", "none");
      input.setAttribute("autocomplete", "off");
      input.setAttribute("autocorrect", "off");
      input.setAttribute("autocapitalize", "characters");
      input.maxLength = 1;
      input.classList.add("casilla");
      
      tablero[f][c] = input;
      contenedorCelda.appendChild(input);

      // Desactivar menús y barras de selección de texto en Android
      input.addEventListener("contextmenu", (e) => e.preventDefault());
      input.addEventListener("select", (e) => e.preventDefault());
      input.addEventListener("selectstart", (e) => e.preventDefault());

      input.addEventListener("pointerdown", () => {
        if (input.classList.contains("bloqueada")) return;

        input.classList.remove("casilla-incorrecta");
        iniciarCronometro(); 
        mostrarTecladoVirtual();

        if (ultimaCasillaClickada === input) {
          direccionHorizontal = !direccionHorizontal;
        } else {
          if (ultimaCasillaClickada === null) {
            direccionHorizontal = true;
          }
        }

        ultimaCasillaClickada = input;
        celdaActiva = input;

        input.focus();
        setTimeout(() => input.select(), 0);
        actualizarResaltadoYDefinicion(f, c);
        
        setTimeout(() => {
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);
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

document.addEventListener("click", (e) => {
  if (!e.target.classList.contains("casilla") && 
      !e.target.classList.contains("referencia-borde") && 
      !e.target.closest("#teclado-virtual")) {
    limpiarSeleccionYDefinicion();
    ultimaCasillaClickada = null;
    celdaActiva = null;
    ocultarTecladoVirtual();
  }
});

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

// --- LÓGICA DE AVANCE Y SALTO AUTOMÁTICO DE PALABRA ---
function manejarAvanceTrasEscritura(f, c) {
  let palabraActual = null;
  if (direccionHorizontal) {
    palabraActual = definicionesCargadas.find(p => 
      p.orientacion === 'horizontal' && p.fila === f && c >= p.col && c < p.col + p.longitud
    );
  } else {
    palabraActual = definicionesCargadas.find(p => 
      p.orientacion === 'vertical' && p.col === c && f >= p.fila && f < p.fila + p.longitud
    );
  }

  if (palabraActual) {
    let palabraCompleta = true;
    for (let i = 0; i < palabraActual.longitud; i++) {
      let rf = palabraActual.orientacion === 'horizontal' ? palabraActual.fila : palabraActual.fila + i;
      let rc = palabraActual.orientacion === 'horizontal' ? palabraActual.col + i : palabraActual.col;
      if (!tablero[rf][rc].value || tablero[rf][rc].value.trim() === "") {
        palabraCompleta = false;
        break;
      }
    }

    if (palabraCompleta) {
      let siguienteNum = palabraActual.num + 1;
      let siguientePalabra = definicionesCargadas.find(p => p.num === siguienteNum);

      if (!siguientePalabra && definicionesCargadas.length > 0) {
        siguientePalabra = definicionesCargadas[0]; 
      }

      if (siguientePalabra) {
        let casillaInicio = tablero[siguientePalabra.fila][siguientePalabra.col];
        if (casillaInicio) {
          direccionHorizontal = (siguientePalabra.orientacion === 'horizontal');
          ultimaCasillaClickada = casillaInicio;
          celdaActiva = casillaInicio;

          casillaInicio.focus();
          setTimeout(() => casillaInicio.select(), 0);
          actualizarResaltadoYDefinicion(siguientePalabra.fila, siguientePalabra.col);

          setTimeout(() => {
            casillaInicio.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 150);
          return;
        }
      }
    }
  }

  avanzarSiguienteCasilla(f, c);
}

function avanzarSiguienteCasilla(f, c) {
  let siguienteF = f;
  let siguienteC = c;
  if (direccionHorizontal) { siguienteC++; } else { siguienteF++; }
  if (siguienteF < filas && siguienteC < columnas) {
    const siguienteInput = tablero[siguienteF][siguienteC];
    if (siguienteInput && !siguienteInput.classList.contains("bloqueada")) {
      siguienteInput.focus();
      celdaActiva = siguienteInput;
      ultimaCasillaClickada = siguienteInput;
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
      celdaActiva = anteriorInput;
      ultimaCasillaClickada = anteriorInput;
    }
  }
}

// --- VALIDACIÓN DE VICTORIA ---
function comprobarConSolucionReal() {
  let esTodoCorrecto = true;

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (tablero[f][c]) tablero[f][c].classList.remove("casilla-incorrecta");
    }
  }

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

    for (let i = 0; i < p.longitud; i++) {
      let letraEscrita = palabraEscrita[i] || "";
      let letraReal = solucionReal[i] || "";
      
      if (letraEscrita !== letraReal) {
        esTodoCorrecto = false;
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
      ocultarTecladoVirtual();
      alert(`¡Enhorabuena! Has completado el crucigrama correctamente en ${document.getElementById("cronometro").textContent}`);
    }
  }
}

// --- DEBUG (TECLA 1) ---
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
  }
});

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
      reiniciarCronometro();
      ocultarTecladoVirtual();
      
      direccionHorizontal = true;
      ultimaCasillaClickada = null;
      celdaActiva = null;
    })
    .catch(error => {
      console.error("Error al cargar el crucigrama:", error);
    });
}

construirTecladoVirtual();
cargarCrucigramaInicial();