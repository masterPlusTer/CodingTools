const canvas = document.getElementById("ledMatrix");
const ctx = canvas.getContext("2d");
const codeInput = document.getElementById("codeInput");
const colorPicker = document.getElementById("colorPicker");
const clearBtn = document.getElementById("clearBtn");

const size = 16;
const pixelSize = canvas.width / size;
// Cambiado el color inicial de cada píxel a null para indicar vacío
let pixels = Array(size).fill().map(() => Array(size).fill(null));

// Dibuja la matriz LED
function drawMatrix() {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      ctx.fillStyle = pixels[y][x] || "#000"; // Si es null, pinta negro
      ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      ctx.strokeStyle = "#222";
      ctx.strokeRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
  }
}

// Limpia la matriz
function clearMatrix() {
  pixels = Array(size).fill().map(() => Array(size).fill(null));
}

// Función para encender un pixel desde el código
function setPixel(x, y, color) {
  if (x >= 0 && x < size && y >= 0 && y < size) {
    pixels[y][x] = color;
  }
}

// Ejecuta el código del textarea
function runCode() {
  try {
    clearMatrix();
    new Function("setPixel", "size", codeInput.value)(setPixel, size);
    drawMatrix();
  } catch (err) {
    console.error(err);
  }
}

// Convierte la matriz actual a código JS
function generateCodeFromPixels() {
  let code = `// Generado automáticamente\n`;
  let coordsByColor = {};

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let col = pixels[y][x];
      if (col) { // Solo píxeles con color definido
        if (!coordsByColor[col]) coordsByColor[col] = [];
        coordsByColor[col].push([x, y]);
      }
    }
  }

  for (let col in coordsByColor) {
    code += `let c_${col.replace("#", "")} = "${col}";\n`;
    code += `[\n  ${coordsByColor[col].map(([x, y]) => `[${x},${y}]`).join(",\n  ")}\n].forEach(([x,y]) => setPixel(x,y,c_${col.replace("#", "")}));\n\n`;
  }

  codeInput.value = code;
}

// Autoejecutar cuando cambia el código
let timeout;
codeInput.addEventListener("input", () => {
  clearTimeout(timeout);
  timeout = setTimeout(runCode, 300);
});

// Evitar menú contextual al hacer clic derecho en el canvas
canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

// Detectar clicks para pintar píxeles manualmente
canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);

  if (e.button === 0) {
    // Clic izquierdo pinta
    pixels[y][x] = colorPicker.value;
  } else if (e.button === 2) {
    // Clic derecho borra (vacío)
    pixels[y][x] = null;
  }

  drawMatrix();
  generateCodeFromPixels();
});

// Botón limpiar matriz
function clearAll() {
  clearMatrix();
  drawMatrix();
  generateCodeFromPixels();
}
clearBtn.addEventListener("click", clearAll);

// Dibujo inicial con código optimizado para corazón
codeInput.value = `let red = "red";

// Por fila: [y, inicioX, finX]
const rows = [
  [3, 3, 6],
  [3, 9, 12],
  [4, 2, 13],
  [5, 1, 14],
  [6, 1, 14],
  [7, 1, 14],
  [8, 1, 14],
  [9, 2, 13],
  [10, 3, 12],
  [11, 4, 11],
  [12, 5, 10],
  [13, 6, 9],
  [14, 7, 8]
];

rows.forEach(([y, startX, endX]) => {
  for (let x = startX; x <= endX; x++) {
    setPixel(x, y, red);
  }
});
`;

runCode();
