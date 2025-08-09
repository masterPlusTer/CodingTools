const textInput = document.getElementById("textInput");
const pasteBtn = document.getElementById("pasteBtn");
const readBtn = document.getElementById("readBtn");
const stopBtn = document.getElementById("stopBtn");
const voiceSelect = document.getElementById("voiceSelect");
const rateInput = document.getElementById("rate");
const pitchInput = document.getElementById("pitch");
const rateValue = document.getElementById("rateValue");
const pitchValue = document.getElementById("pitchValue");

let voices = [];
let queue = [];
let currentIndex = 0;
let reading = false;

// Cargar voces
function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = "";
  voices.forEach((voice, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${voice.name} (${voice.lang})`;
    voiceSelect.appendChild(option);
  });
}

speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Actualizar valores
rateInput.addEventListener("input", () => rateValue.textContent = rateInput.value);
pitchInput.addEventListener("input", () => pitchValue.textContent = pitchInput.value);

// Dividir texto en fragmentos
function splitText(text, maxLength = 250) {
  const parts = [];
  const sentences = text.split(/(?<=[.?!])\s+/); // divide por oraciones
  let current = "";

  for (let sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      parts.push(current.trim());
      current = sentence + " ";
    } else {
      current += sentence + " ";
    }
  }
  if (current.trim().length > 0) {
    parts.push(current.trim());
  }
  return parts;
}

// Leer el siguiente fragmento
function readNext() {
  if (currentIndex >= queue.length) {
    reading = false;
    return;
  }

  const utterance = new SpeechSynthesisUtterance(queue[currentIndex]);
  utterance.voice = voices[voiceSelect.value] || null;
  utterance.rate = parseFloat(rateInput.value);
  utterance.pitch = parseFloat(pitchInput.value);

  utterance.onend = () => {
    currentIndex++;
    readNext();
  };

  speechSynthesis.speak(utterance);
}

// Botón pegar
pasteBtn.addEventListener("click", async () => {
  try {
    const text = await navigator.clipboard.readText();
    textInput.value = text;
  } catch (err) {
    alert("Error al leer el portapapeles. Permite el acceso.");
  }
});

// Botón leer
readBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  const text = textInput.value.trim();
  if (!text) {
    alert("No hay texto para leer.");
    return;
  }
  queue = splitText(text);
  currentIndex = 0;
  reading = true;
  readNext();
});

// Botón detener
stopBtn.addEventListener("click", () => {
  speechSynthesis.cancel();
  reading = false;
});