// Estado
    let rows = 5, cols = 5;
    let modeEl = document.getElementById('mode');
    let modeLabel = document.getElementById('modeLabel');
    let gridEl = document.getElementById('grid');
    let lastEl = document.getElementById('last');
    let countEl = document.getElementById('count');
    let coordsListEl = document.getElementById('coordsList');
    let robotPosEl = document.getElementById('robotPos');
    let boxPosEl = document.getElementById('boxPos');
    let distEl = document.getElementById('dist');

    let robot = { r:0, c:0 };
    let box = null; // {r,c}
    let selected = new Set(); // store "r,c"

    function coordKey(r,c){ return r+','+c }

    function renderGrid(){
      gridEl.innerHTML = '';
      gridEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
      gridEl.style.gridTemplateRows = `repeat(${rows}, var(--cell-size))`;
      gridEl.className = 'grid';

      for(let r=0;r<rows;r++){
        for(let c=0;c<cols;c++){
          const div = document.createElement('div');
          div.className = 'cell';
          div.dataset.r = r; div.dataset.c = c;
          div.title = `(${r},${c})`;
          div.innerHTML = `<div class="coord">${r},${c}</div>`;

          // apply states
          const key = coordKey(r,c);
          if(selected.has(key)) div.classList.add('selected');
          if(robot.r===r && robot.c===c) div.classList.add('robot');
          if(box && box.r===r && box.c===c) div.classList.add('box');

          div.addEventListener('click', onCellClick);
          gridEl.appendChild(div);
        }
      }

      updateInfo();
    }

    function onCellClick(e){
      const r = Number(this.dataset.r);
      const c = Number(this.dataset.c);
      lastEl.textContent = `(${r},${c})`;

      const mode = modeEl.value;
      if(mode==='select'){
        const key = coordKey(r,c);
        if(selected.has(key)) selected.delete(key);
        else selected.add(key);
      } else if(mode==='robot'){
        // remove previous robot class visually by updating state
        robot = { r,c };
      } else if(mode==='box'){
        box = { r,c };
      }
      renderGrid();
    }

    function updateInfo(){
      countEl.textContent = selected.size;
      // coords list
      if(selected.size===0) coordsListEl.textContent = '—';
      else{
        coordsListEl.innerHTML = Array.from(selected).map(k=>{
          return `<div>${k}</div>`;
        }).join('');
      }
      robotPosEl.textContent = `(${robot.r},${robot.c})`;
      boxPosEl.textContent = box ? `(${box.r},${box.c})` : '—';

      if(box){
        const dr = Math.abs(box.r - robot.r);
        const dc = Math.abs(box.c - robot.c);
        distEl.textContent = `${dr + dc} = |${box.r}-${robot.r}| + |${box.c}-${robot.c}|`;
      } else distEl.textContent = '—';

      modeLabel.textContent = modeEl.selectedOptions[0].text;
    }

    // Controls
    document.getElementById('gen').addEventListener('click', ()=>{
      const rIn = Number(document.getElementById('rows').value) || 1;
      const cIn = Number(document.getElementById('cols').value) || 1;
      rows = Math.max(1, Math.floor(rIn));
      cols = Math.max(1, Math.floor(cIn));
      // reset selection if out of range
      selected = new Set(Array.from(selected).filter(k=>{
        const [rr,cc] = k.split(',').map(Number);
        return rr < rows && cc < cols;
      }));
      if(robot.r >= rows) robot.r = 0;
      if(robot.c >= cols) robot.c = 0;
      if(box && (box.r >= rows || box.c >= cols)) box = null;
      renderGrid();
    });

    document.getElementById('clear').addEventListener('click', ()=>{ selected.clear(); renderGrid(); });
    document.getElementById('reset').addEventListener('click', ()=>{
      rows = 5; cols = 5; document.getElementById('rows').value = rows; document.getElementById('cols').value = cols;
      robot = {r:0,c:0}; box = null; selected.clear(); renderGrid();
    });

    // init
    renderGrid();