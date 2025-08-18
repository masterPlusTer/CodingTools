let filaActual = 0;
let ultimaFila = [1n];
let bloque = 20;
let cargando = false;
let contenedor = document.getElementById('triangulo');
let mensaje = document.getElementById('mensajeCopiado');
let propiedadesActivas = {};

// Colores base por propiedad
const colores = {
  par:'magenta', impar:'cyan', primo:'gold', fibo:'lime',
  cuadrado:'violet', triangular:'coral', multiplo3:'green', 
  multiplo5:'blue', multiplo7:'red' 
};


// Funciones matemáticas
function esPrimo(n){
  if(n<2n) return false;
  if(n===2n) return true;
  if(n%2n===0n) return false;
  for(let i=3n;i*i<=n;i+=2n) if(n%i===0n) return false;
  return true;
}
function esFibo(n){
  let a=0n,b=1n,c;
  while(b<n){ c=a+b; a=b; b=c; }
  return n===0n || b===n;
}
function esCuadrado(n){ 
  let r = BigInt(Math.floor(Math.sqrt(Number(n))));
  return r*r === n;
}
function esTriangular(n){
  let x = BigInt(Math.floor(Math.sqrt(2*Number(n))));
  return x*(x+1n)/2n === n;
}

// Crear gradiente para múltiples propiedades
function crearGradiente(coloresActivos){
  if(coloresActivos.length===0) return '';
  if(coloresActivos.length===1) return coloresActivos[0];
  return `linear-gradient(to right, ${coloresActivos.join(',')})`;
}

// Generar bloque de filas
function generarBloque(){
  if(cargando) return;
  cargando = true;
  for(let b=0;b<bloque;b++){
    let nuevaFila = [1n];
    for(let j=1;j<ultimaFila.length;j++) nuevaFila[j] = ultimaFila[j-1]+ultimaFila[j];
    if(ultimaFila.length>0) nuevaFila.push(1n);
    let divFila = document.createElement('div'); divFila.className='fila';
    nuevaFila.forEach(num=>{
      let span = document.createElement('span'); 
      span.className='celda';
      span.setAttribute('data-num', num.toString()); // guardar número completo
      let coloresActivos = [];
      if(propiedadesActivas['par'] && num%2n===0n) coloresActivos.push(colores['par']);
      if(propiedadesActivas['impar'] && num%2n!==0n) coloresActivos.push(colores['impar']);
      if(propiedadesActivas['primo'] && esPrimo(num)) coloresActivos.push(colores['primo']);
      if(propiedadesActivas['fibo'] && esFibo(num)) coloresActivos.push(colores['fibo']);
      if(propiedadesActivas['cuadrado'] && esCuadrado(num)) coloresActivos.push(colores['cuadrado']);
      if(propiedadesActivas['triangular'] && esTriangular(num)) coloresActivos.push(colores['triangular']);
      if(propiedadesActivas['multiplo3'] && num%3n===0n) coloresActivos.push(colores['multiplo3']);
      if(propiedadesActivas['multiplo5'] && num%5n===0n) coloresActivos.push(colores['multiplo5']);
      if(propiedadesActivas['multiplo7'] && num%7n===0n) coloresActivos.push(colores['multiplo7']);

      span.style.background = crearGradiente(coloresActivos);
      let maxChars=8; let numStr=num.toString();
      span.textContent = numStr.length>maxChars?numStr.slice(0,maxChars)+'…':numStr;
      span.addEventListener('click',()=>{
        navigator.clipboard.writeText(numStr).then(()=>{
          span.classList.add('copiado');
         mensaje.textContent = `${numStr}\ncopiado`;

          setTimeout(()=>{span.classList.remove('copiado');},1500);
        });
      });
      divFila.appendChild(span);
    });
    contenedor.appendChild(divFila);
    ultimaFila = nuevaFila;
    filaActual++;
  }
  cargando = false;
}

// Scroll infinito
window.addEventListener('scroll',()=>{
  if((window.innerHeight+window.scrollY)>=document.body.offsetHeight-50) generarBloque();
});

// Ir a fila marcada
function irAFila(){
  let filaMeta = parseInt(document.getElementById('filaInicio').value);
  if(isNaN(filaMeta)||filaMeta<0) return;
  while(filaActual+bloque<=filaMeta) generarBloque();
  generarBloque();
  let filas = contenedor.querySelectorAll('.fila');
  if(filas[filaMeta]){
    let filaPos = filas[filaMeta].getBoundingClientRect().top + window.scrollY;
    window.scrollTo({top: filaPos - window.innerHeight/2 + filas[filaMeta].offsetHeight/2, behavior:'smooth'});
  }
}

// Actualizar colores sin perder scroll
function actualizarPropiedades() {
  propiedadesActivas = {};
  document.querySelectorAll('.prop').forEach(cb => {
    propiedadesActivas[cb.value] = cb.checked;
  });
  document.querySelectorAll('.celda').forEach(span => {
    let num = BigInt(span.getAttribute('data-num'));
    let coloresActivos = [];
    if(propiedadesActivas['par'] && num%2n===0n) coloresActivos.push(colores['par']);
    if(propiedadesActivas['impar'] && num%2n!==0n) coloresActivos.push(colores['impar']);
    if(propiedadesActivas['primo'] && esPrimo(num)) coloresActivos.push(colores['primo']);
    if(propiedadesActivas['fibo'] && esFibo(num)) coloresActivos.push(colores['fibo']);
    if(propiedadesActivas['cuadrado'] && esCuadrado(num)) coloresActivos.push(colores['cuadrado']);
    if(propiedadesActivas['triangular'] && esTriangular(num)) coloresActivos.push(colores['triangular']);
    if(propiedadesActivas['multiplo3'] && num%3n===0n) coloresActivos.push(colores['multiplo3']);
    if(propiedadesActivas['multiplo5'] && num%5n===0n) coloresActivos.push(colores['multiplo5']);
    if(propiedadesActivas['multiplo7'] && num%7n===0n) coloresActivos.push(colores['multiplo7']);

    span.style.background = crearGradiente(coloresActivos);
  });
  actualizarLeyenda();
}

// Leyenda dinámica mostrando colores y mezclas
function actualizarLeyenda(){
  let leyenda=document.getElementById('leyenda'); leyenda.innerHTML='';
  let keys=Object.keys(colores);
  keys.forEach(prop=>{
    if(propiedadesActivas[prop]){
      let span=document.createElement('span');
      span.style.background = colores[prop];
      span.textContent = prop;
      leyenda.appendChild(span);
    }
  });
  if(keys.filter(k=>propiedadesActivas[k]).length>1){
    let mezcla = document.createElement('span');
    let activos = keys.filter(k=>propiedadesActivas[k]).map(k=>colores[k]);
    mezcla.style.background = crearGradiente(activos);
    mezcla.textContent = 'Mezcla de propiedades';
    leyenda.appendChild(mezcla);
  }
}

// Eventos checkboxes
document.querySelectorAll('.prop').forEach(cb=>cb.addEventListener('change', actualizarPropiedades));

// Bloque inicial
actualizarPropiedades();

// Zoom dinámico
const zoomSlider = document.getElementById('zoomSlider');
const zoomValue = document.getElementById('zoomValue');

zoomSlider.addEventListener('input', () => {
  let scale = zoomSlider.value/100;
  contenedor.style.transform = `scale(${scale})`;
  zoomValue.textContent = `${zoomSlider.value}%`;
});