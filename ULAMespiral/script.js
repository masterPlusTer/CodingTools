const colores = {
  par:'#a0e7e5', impar:'#fbb1b1', primo:'#fff176', fibo:'#ba68c8',
  cuadrado:'#4fc3f7', triangular:'#ffb74d', multiplo3:'green',
  multiplo5:'blue', multiplo7:'red'
};

let propiedadesActivas = {};
let grid = document.getElementById('grid');
let gridContainer = document.getElementById('gridContainer');
let mensaje = document.getElementById('mensajeCopiado');
let zoomSlider = document.getElementById('zoomSlider');
let zoomValue = document.getElementById('zoomValue');

let cellSize = 40;
let map = new Map();
let minX=0,maxX=0,minY=0,maxY=0;
let centerX=0, centerY=0;
let currentNum=1;

// Funciones matemáticas
function esPrimo(n){
  if(n<2) return false;
  if(n===2) return true;
  if(n%2===0) return false;
  for(let i=3;i*i<=n;i+=2) if(n%i===0) return false;
  return true;
}
function esFibo(n){ let a=0,b=1; while(b<n){ [a,b]=[b,a+b]; } return n===0 || b===n; }
function esCuadrado(n){ let r=Math.floor(Math.sqrt(n)); return r*r===n; }
function esTriangular(n){ let x=Math.floor(Math.sqrt(2*n)); return x*(x+1)/2===n; }

// Crear gradiente
function crearGradiente(coloresActivos){
  if(coloresActivos.length===0) return '';
  if(coloresActivos.length===1) return coloresActivos[0];
  return `linear-gradient(to right, ${coloresActivos.join(',')})`;
}

// Dibujar celda
function dibujarCelda(x,y,num){
  let key = `${x},${y}`;
  if(map.has(key)) return;
  let div=document.createElement('div');
  div.className='cell';
  div.setAttribute('data-num',num);
  div.textContent=num;
  let coloresActivos=[];
  if(propiedadesActivas['par'] && num%2===0) coloresActivos.push(colores['par']);
  if(propiedadesActivas['impar'] && num%2!==0) coloresActivos.push(colores['impar']);
  if(propiedadesActivas['primo'] && esPrimo(num)) coloresActivos.push(colores['primo']);
  if(propiedadesActivas['fibo'] && esFibo(num)) coloresActivos.push(colores['fibo']);
  if(propiedadesActivas['cuadrado'] && esCuadrado(num)) coloresActivos.push(colores['cuadrado']);
  if(propiedadesActivas['triangular'] && esTriangular(num)) coloresActivos.push(colores['triangular']);
  if(propiedadesActivas['multiplo3'] && num%3===0) coloresActivos.push(colores['multiplo3']);
  if(propiedadesActivas['multiplo5'] && num%5===0) coloresActivos.push(colores['multiplo5']);
  if(propiedadesActivas['multiplo7'] && num%7===0) coloresActivos.push(colores['multiplo7']);
  div.style.background = crearGradiente(coloresActivos);
  div.style.position='absolute';
  div.style.left=`${(x)*cellSize}px`;
  div.style.top=`${(y)*cellSize}px`;
  div.style.width=`${cellSize}px`;
  div.style.height=`${cellSize}px`;
  div.addEventListener('click',()=>{
    navigator.clipboard.writeText(num.toString()).then(()=>{
      div.classList.add('copiado');
      mensaje.textContent=`${num}\ncopiado al portapapeles`;
      mensaje.style.display='block';
      setTimeout(()=>{div.classList.remove('copiado'); mensaje.style.display='none';},1500);
    });
  });
  grid.appendChild(div);
  map.set(key, div);
  minX=Math.min(minX,x); maxX=Math.max(maxX,x);
  minY=Math.min(minY,y); maxY=Math.max(maxY,y);
}

// Generar anillos infinitos
let directions=[[1,0],[0,1],[-1,0],[0,-1]];
let step=1,dir=0,x=0,y=0,stepsTaken=0,stepLimit=1,turns=0;
function generarAnillos(n=100){
  for(let i=0;i<n;i++){
    dibujarCelda(x,y,currentNum);
    currentNum++;
    x+=directions[dir][0]; y+=directions[dir][1]; stepsTaken++;
    if(stepsTaken===stepLimit){
      stepsTaken=0; dir=(dir+1)%4; turns++;
      if(turns%2===0) stepLimit++;
    }
  }
}

// Detectar scroll cerca de borde
gridContainer.addEventListener('scroll',()=>{
  let rect = gridContainer.getBoundingClientRect();
  let scrollX = gridContainer.scrollLeft;
  let scrollY = gridContainer.scrollTop;
  let limitX = grid.scrollWidth - gridContainer.clientWidth - 50;
  let limitY = grid.scrollHeight - gridContainer.clientHeight - 50;
  if(scrollX>limitX || scrollY>limitY || scrollX<50 || scrollY<50){
    generarAnillos(200);
  }
});

// Zoom
zoomSlider.addEventListener('input',()=>{
  let scale = zoomSlider.value/100;
  grid.style.transform=`scale(${scale})`;
  zoomValue.textContent=`${zoomSlider.value}%`;
});

// Propiedades
function actualizarPropiedades(){
  propiedadesActivas={};
  document.querySelectorAll('.prop').forEach(cb=>propiedadesActivas[cb.value]=cb.checked);
  // actualizar colores
  map.forEach((div,key)=>{
    let val = parseInt(div.getAttribute('data-num'));
    let coloresActivos=[];
    if(propiedadesActivas['par'] && val%2===0) coloresActivos.push(colores['par']);
    if(propiedadesActivas['impar'] && val%2!==0) coloresActivos.push(colores['impar']);
    if(propiedadesActivas['primo'] && esPrimo(val)) coloresActivos.push(colores['primo']);
    if(propiedadesActivas['fibo'] && esFibo(val)) coloresActivos.push(colores['fibo']);
    if(propiedadesActivas['cuadrado'] && esCuadrado(val)) coloresActivos.push(colores['cuadrado']);
    if(propiedadesActivas['triangular'] && esTriangular(val)) coloresActivos.push(colores['triangular']);
    if(propiedadesActivas['multiplo3'] && val%3===0) coloresActivos.push(colores['multiplo3']);
    if(propiedadesActivas['multiplo5'] && val%5===0) coloresActivos.push(colores['multiplo5']);
    if(propiedadesActivas['multiplo7'] && val%7===0) coloresActivos.push(colores['multiplo7']);
    div.style.background = crearGradiente(coloresActivos);
  });
  actualizarLeyenda();
}

// Leyenda
function actualizarLeyenda(){
  let leyenda=document.getElementById('leyenda'); leyenda.innerHTML='';
  Object.keys(colores).forEach(prop=>{
    if(propiedadesActivas[prop]){
      let span=document.createElement('span');
      span.style.background=colores[prop];
      span.textContent=prop;
      leyenda.appendChild(span);
    }
  });
  let activos = Object.keys(colores).filter(k=>propiedadesActivas[k]).map(k=>colores[k]);
  if(activos.length>1){
    let mezcla = document.createElement('span');
    mezcla.style.background = crearGradiente(activos);
    mezcla.textContent='Mezcla';
    leyenda.appendChild(mezcla);
  }
}

// Ir a fila (aprox)
function irAFila(){
  let fila = parseInt(document.getElementById('filaInicio').value);
  if(isNaN(fila)||fila<0) return;
  gridContainer.scrollTo({top: (fila+centerY)*cellSize - gridContainer.clientHeight/2, behavior:'smooth'});
}

// Inicial
document.querySelectorAll('.prop').forEach(cb=>cb.addEventListener('change', actualizarPropiedades));
actualizarPropiedades();
generarAnillos(500); // bloque inicial
gridContainer.scrollTo(grid.scrollWidth/2 - gridContainer.clientWidth/2, grid.scrollHeight/2 - gridContainer.clientHeight/2);