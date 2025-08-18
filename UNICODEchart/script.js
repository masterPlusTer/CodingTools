const tbody=document.getElementById("tbody");
const container=document.getElementById("container");
const q=document.getElementById("q");
const btnGo=document.getElementById("go");
const btnHome=document.getElementById("home");

let batchSize=256;
let current=0;
const MAX=0x10FFFF;

const emojiRanges=[[0x1F300,0x1F5FF],[0x1F600,0x1F64F],[0x1F680,0x1F6FF],[0x1F900,0x1F9FF],[0x1FA70,0x1FAFF],[0x2600,0x26FF],[0x2700,0x27BF]];
const isEmoji=cp=>emojiRanges.some(([a,b])=>cp>=a&&cp<=b);
const toBin21=cp=>cp.toString(2).padStart(21,"0");
const toHex=cp=>cp.toString(16).toUpperCase().padStart(4,"0");

function clearTable(){
  tbody.innerHTML="";
  current=0;
}

function createRow(cp){
  let char;
  try{char=String.fromCodePoint(cp);}catch{char="";}
  const hex=toHex(cp);
  const bin=toBin21(cp);
  const tr=document.createElement("tr");
  tr.dataset.cp=String(cp);
  tr.innerHTML=`
    <td>${cp}</td>
    <td>U+${hex}</td>
    <td>${bin}</td>
    <td class="char">${char}</td>
    <td>0x${hex}</td>
  `;
  if(isEmoji(cp)){
    const cell=tr.querySelector(".char");
    cell.innerHTML=twemoji.parse(char,{folder:"72x72",ext:".png"});
  }
  return tr;
}

function addBatch(startCp=current, endCp=startCp+batchSize){
  const end=Math.min(endCp, MAX);
  for(let cp=startCp; cp<end; cp++){
    const tr=createRow(cp);
    tbody.appendChild(tr);
  }
  current=end;
}

// Carga inicial alrededor del punto 0
addBatch(0, batchSize*3);

container.addEventListener("scroll",()=>{
  if(container.scrollTop + container.clientHeight >= container.scrollHeight -100){
    if(current<MAX) addBatch();
  }
});

/**
 * Función corregida para analizar la entrada del usuario.
 * Ahora comprueba los formatos específicos (U+, 0x, 0b) antes de
 * los formatos genéricos (decimal, carácter literal).
 */
function parseQueryToCodePoint(input) {
  if (!input) return null;

  const trimmedInput = input.trim();
  if (trimmedInput === "") return null;

  const lowercasedInput = trimmedInput.toLowerCase();

  // 1. Comprobar formato U+HEX (ej: "U+1F923")
  if (lowercasedInput.startsWith("u+")) {
    const hexValue = lowercasedInput.slice(2);
    if (/^[0-9a-f]+$/.test(hexValue)) {
      const cp = parseInt(hexValue, 16);
      return isNaN(cp) ? null : cp;
    }
  }

  // 2. Comprobar formato 0xHEX (ej: "0x1f923")
  if (lowercasedInput.startsWith("0x")) {
    // parseInt maneja el prefijo "0x" automáticamente
    const cp = parseInt(lowercasedInput, 16);
    return isNaN(cp) ? null : cp;
  }
  
  // 3. Comprobar formato 0b... BINARIO (ej: "0b1111100100100011")
  if (lowercasedInput.startsWith("0b")) {
    const binValue = lowercasedInput.slice(2);
    if (/^[01]+$/.test(binValue)) {
      const cp = parseInt(binValue, 2);
      return isNaN(cp) ? null : cp;
    }
  }

  // 4. Comprobar formato decimal puro (ej: "129315")
  if (/^\d+$/.test(trimmedInput)) {
    const cp = parseInt(trimmedInput, 10);
    return isNaN(cp) ? null : cp;
  }

  // 5. Como último recurso, tratarlo como un carácter literal (ej: "🤣")
  return trimmedInput.codePointAt(0);
}


function jumpTo(cp){
  if(cp === null || cp < 0) cp=0;
  if(cp > MAX) cp=MAX;

  // Limpiar la tabla y cargar alrededor del punto buscado
  clearTable();
  const start = Math.max(0, cp - batchSize);
  const end = Math.min(MAX, cp + batchSize * 2); // Cargar un poco más para tener contexto
  addBatch(start, end);
  
  // Esperar a que se renderice la tabla
  requestAnimationFrame(()=>{
    const target=tbody.querySelector(`tr[data-cp="${cp}"]`);
    if(target){
      target.classList.add("highlight");
      target.scrollIntoView({block:"center", behavior: "smooth"});
      setTimeout(()=>target.classList.remove("highlight"), 1500);
    }
  });
}

function handleSearch(){
  const cp=parseQueryToCodePoint(q.value);
  // Solo saltar si se encontró un punto de código válido
  if(cp !== null) {
    jumpTo(cp);
  }
}

btnGo.addEventListener("click",handleSearch);
q.addEventListener("keydown",(e)=>{if(e.key==="Enter") handleSearch();});
btnHome.addEventListener("click",()=>{q.value=""; jumpTo(0);});