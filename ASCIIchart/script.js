// === Utilidades ===
  const pad2 = n => n.toString(16).toUpperCase().padStart(2,'0');
  const bin8 = n => n.toString(2).padStart(8,'0');
  const oct3 = n => n.toString(8).padStart(3,'0');
  const ucode = n => "U+"+n.toString(16).toUpperCase().padStart(4,'0');

  // Nombres de controles ASCII (C0) y DEL
  const C0 = {
    0:"NUL (Null)",1:"SOH (Start of Header)",2:"STX (Start of Text)",3:"ETX (End of Text)",
    4:"EOT (End of Transmission)",5:"ENQ (Enquiry)",6:"ACK (Acknowledge)",7:"BEL (Bell)",
    8:"BS (Backspace)",9:"TAB (Horizontal Tab)",10:"LF (Line Feed)",11:"VT (Vertical Tab)",
    12:"FF (Form Feed)",13:"CR (Carriage Return)",14:"SO (Shift Out)",15:"SI (Shift In)",
    16:"DLE (Data Link Escape)",17:"DC1 (Device Control 1)",18:"DC2 (Device Control 2)",19:"DC3 (Device Control 3)",
    20:"DC4 (Device Control 4)",21:"NAK (Negative Acknowledge)",22:"SYN (Synchronous Idle)",23:"ETB (End of Block)",
    24:"CAN (Cancel)",25:"EM (End of Medium)",26:"SUB (Substitute)",27:"ESC (Escape)",
    28:"FS (File Separator)",29:"GS (Group Separator)",30:"RS (Record Separator)",31:"US (Unit Separator)",
    127:"DEL (Delete)"
  };
  // C1 (128–159) – nombres detallados varían; marcamos genérico
  const isC0 = n => (n >= 0 && n <= 31) || n === 127;
  const isC1 = n => (n >= 128 && n <= 159);

  function buildRow(n){
    const hex = pad2(n);
    const bin = bin8(n);
    const oct = oct3(n);
    const uni = ucode(n);
    const isControl = isC0(n) || isC1(n);
    const category = isControl ? (isC1(n) ? "Control C1" : "Control C0") : "Imprimible";
    const desc = C0[n] ?? (isC1(n) ? "C1 (ISO/IEC 6429)" : "Carácter imprimible");
    // Latin-1 usa directamente U+0000..U+00FF
    const ch = isControl ? "•" : String.fromCharCode(n); // marcador para invisibles
    const htmlDec = `&#${n};`;
    const htmlHex = `&#x${hex};`;

    return {
      dec:n, hex:`0x${hex}`, bin, oct:`0o${oct}`, char:ch, uni:uni, cat:category, desc, htmlDec, htmlHex,
      // texto para búsqueda
      search:`${n} ${hex} ${bin} ${oct} ${uni} ${category} ${desc} ${isControl ? "" : ch}`
    };
  }

  // Construir la tabla (0-255)
  const DATA = Array.from({length:256}, (_,i)=>buildRow(i));

  const tbody = document.querySelector("#t tbody");
  const q = document.getElementById("q");
  const toggleControls = document.getElementById("toggleControls");
  const btnDownload = document.getElementById("download");

  function render(){
    const term = q.value.trim().toLowerCase();
    const showControls = toggleControls.checked;
    tbody.innerHTML = "";
    for(const r of DATA){
      if(!showControls && (r.cat.startsWith("Control"))) continue;
      if(term && !r.search.toLowerCase().includes(term)) continue;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.dec}</td>
        <td>${r.hex}</td>
        <td>${r.bin}</td>
        <td>${r.oct}</td>
        <td class="${r.cat.startsWith('Control') ? (r.cat.includes('C1') ? 'c1' : 'control') : 'print'}">
          <span class="char" title="${r.cat.startsWith('Control') ? 'control: mostrado como punto' : 'imprimible'}">${r.char}</span>
        </td>
        <td>${r.uni}</td>
        <td><span class="pill">${r.cat}</span></td>
        <td>${r.desc}</td>
        <td class="small">${r.htmlDec}</td>
        <td class="small">${r.htmlHex}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  // CSV
  function toCSV(rows){
    const head = ["DEC","HEX","BIN","OCT","CHAR","UNICODE","CATEGORIA","DESCRIPCION","HTML_DEC","HTML_HEX"];
    const escape = v => `"${String(v).replace(/"/g,'""')}"`;
    const lines = [head.map(escape).join(",")];
    for(const r of rows){
      lines.push([r.dec,r.hex,r.bin,r.oct, r.cat.startsWith('Control') ? '' : r.char, r.uni, r.cat, r.desc, r.htmlDec, r.htmlHex].map(escape).join(","));
    }
    return lines.join("\n");
  }
  function downloadCSV(){
    const term = q.value.trim().toLowerCase();
    const showControls = toggleControls.checked;
    const filtered = DATA.filter(r=>{
      if(!showControls && r.cat.startsWith("Control")) return false;
      if(term && !r.search.toLowerCase().includes(term)) return false;
      return true;
    });
    const blob = new Blob([toCSV(filtered)],{type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {href:url, download:"ascii_latin1_0_255.csv"});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // eventos
  q.addEventListener("input", render);
  toggleControls.addEventListener("change", render);
  btnDownload.addEventListener("click", downloadCSV);

  render();