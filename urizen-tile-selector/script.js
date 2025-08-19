document.addEventListener('DOMContentLoaded', function() {
            // Configuración
            const TILE_SIZE = 12;
            const TILESET_URL = 'https://cors-anywhere.herokuapp.com/https://upload.wikimedia.org/wikipedia/commons/e/ea/Urizen_onebit_tileset_v2d0.png';
            
            // Configuración de color
            const COLOR_SETTINGS = {
                mode: 'color',
                bwThreshold: 128,
                palette: [
                    { name: 'white',   value: 0, rgb: [255, 255, 255] },
                    { name: 'black',   value: 1, rgb: [0, 0, 0] },
                    { name: 'green',   value: 2, rgb: [0, 255, 0] },
                    { name: 'red',     value: 3, rgb: [255, 0, 0] },
                    { name: 'blue',    value: 4, rgb: [0, 0, 255] },
                    { name: 'other',   value: 5, rgb: [128, 128, 128] }
                ],
                colorTolerance: 30
            };
            
            // Elementos del DOM
            const tilesetCanvas = document.getElementById('tileset');
            const tilesetCtx = tilesetCanvas.getContext('2d');
            const previewCanvas = document.getElementById('tile-preview');
            const previewCtx = previewCanvas.getContext('2d');
            const tileDataTextarea = document.getElementById('tile-data');
            const tilePositionSpan = document.getElementById('tile-position');
            const tileIndexSpan = document.getElementById('tile-index');
            const dataFormatSelect = document.getElementById('data-format');
            const copyDataBtn = document.getElementById('copy-data');
            const exportPngBtn = document.getElementById('export-png');
            const zoomInBtn = document.getElementById('zoom-in');
            const zoomOutBtn = document.getElementById('zoom-out');
            const zoomLevelSpan = document.getElementById('zoom-level');
            const selectionWidthInput = document.getElementById('selection-width');
            const selectionHeightInput = document.getElementById('selection-height');
            const colorModeSelect = document.getElementById('color-mode');
            const bwThresholdInput = document.getElementById('bw-threshold');
            const thresholdValueSpan = document.getElementById('threshold-value');
            const detectColorsBtn = document.getElementById('detect-colors');
            
            // Variables de estado
            let selectedX = 0;
            let selectedY = 0;
            let zoomLevel = 1;
            let tilesetImage = new Image();
            let tilesetWidth = 0;
            let tilesetHeight = 0;
            let tilesetCols = 0;
            let tilesetRows = 0;
            let selectionWidth = TILE_SIZE;
            let selectionHeight = TILE_SIZE;
            let isDragging = false;
            let dragStartX = 0;
            let dragStartY = 0;
            let keyRepeatTimer = null;
            let isKeyRepeating = false;
            
            // Solución CORS
            tilesetImage.crossOrigin = "Anonymous";
            
            // Cargar el tileset
            tilesetImage.onload = function() {
                tilesetWidth = tilesetImage.width;
                tilesetHeight = tilesetImage.height;
                tilesetCols = Math.floor(tilesetWidth / TILE_SIZE);
                tilesetRows = Math.floor(tilesetHeight / TILE_SIZE);
                
                updateCanvasSize();
                tilesetCtx.imageSmoothingEnabled = false;
                tilesetCtx.drawImage(tilesetImage, 0, 0, tilesetCanvas.width, tilesetCanvas.height);
                
                drawGrid();
                updateSelection(0, 0);
            };
            
            tilesetImage.onerror = function() {
                alert("Error al cargar el tileset. Puedes subir la imagen a otro servidor que permita CORS o descargarla y usarla localmente.");
            };
            
            tilesetImage.src = TILESET_URL;
            
            // Funciones auxiliares
            function updateCanvasSize() {
                tilesetCanvas.width = tilesetWidth * zoomLevel;
                tilesetCanvas.height = tilesetHeight * zoomLevel;
            }
            
            function getColorIndex(r, g, b, a) {
                if (a < 128) return 0;
                
                if (COLOR_SETTINGS.mode === 'bw') {
                    const grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
                    return grayValue > COLOR_SETTINGS.bwThreshold ? 0 : 1;
                }
                
                for (let i = 0; i < COLOR_SETTINGS.palette.length - 1; i++) {
                    const color = COLOR_SETTINGS.palette[i];
                    const diff = Math.abs(r - color.rgb[0]) + 
                                Math.abs(g - color.rgb[1]) + 
                                Math.abs(b - color.rgb[2]);
                    
                    if (diff <= COLOR_SETTINGS.colorTolerance) {
                        return color.value;
                    }
                }
                
                return COLOR_SETTINGS.palette[COLOR_SETTINGS.palette.length - 1].value;
            }
            
            function detectMainColors() {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = selectionWidth;
                tempCanvas.height = selectionHeight;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                
                tempCtx.drawImage(
                    tilesetImage,
                    selectedX, selectedY, selectionWidth, selectionHeight,
                    0, 0, selectionWidth, selectionHeight
                );
                
                const imageData = tempCtx.getImageData(0, 0, selectionWidth, selectionHeight);
                const data = imageData.data;
                const colorMap = {};
                
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i+3] < 128) continue;
                    
                    const colorKey = `${data[i]},${data[i+1]},${data[i+2]}`;
                    colorMap[colorKey] = (colorMap[colorKey] || 0) + 1;
                }
                
                const sortedColors = Object.entries(colorMap)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6);
                
                COLOR_SETTINGS.palette = [
                    { name: 'white', value: 0, rgb: [255, 255, 255] },
                    { name: 'black', value: 1, rgb: [0, 0, 0] }
                ];
                
                sortedColors.forEach(([colorStr], index) => {
                    const [r, g, b] = colorStr.split(',').map(Number);
                    COLOR_SETTINGS.palette.push({
                        name: `color${index+1}`,
                        value: index + 2,
                        rgb: [r, g, b]
                    });
                });
                
                COLOR_SETTINGS.palette.push({ 
                    name: 'other', 
                    value: COLOR_SETTINGS.palette.length, 
                    rgb: [128, 128, 128] 
                });
                
                alert(`Nueva paleta detectada con ${sortedColors.length} colores principales`);
                generateTileData();
            }
            
            function updateSelection(x, y) {
                x = Math.max(0, Math.min(x, tilesetWidth - selectionWidth));
                y = Math.max(0, Math.min(y, tilesetHeight - selectionHeight));
                
                selectedX = x;
                selectedY = y;
                
                tilePositionSpan.textContent = `X: ${x}px, Y: ${y}px, W: ${selectionWidth}px, H: ${selectionHeight}px`;
                const tileX = Math.floor(x / TILE_SIZE);
                const tileY = Math.floor(y / TILE_SIZE);
                tileIndexSpan.textContent = `Tile: ${tileY * tilesetCols + tileX} (${tileX},${tileY})`;
                
                drawPreview();
                generateTileData();
                drawGrid();
            }
            
            function drawPreview() {
                previewCanvas.width = selectionWidth;
                previewCanvas.height = selectionHeight;
                previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
                previewCtx.drawImage(
                    tilesetImage,
                    selectedX, selectedY, selectionWidth, selectionHeight,
                    0, 0, selectionWidth, selectionHeight
                );
            }
            
            function drawGrid() {
                tilesetCtx.clearRect(0, 0, tilesetCanvas.width, tilesetCanvas.height);
                tilesetCtx.drawImage(tilesetImage, 0, 0, tilesetCanvas.width, tilesetCanvas.height);
                
                tilesetCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                tilesetCtx.lineWidth = 1;
                
                for (let x = 0; x <= tilesetCols; x++) {
                    tilesetCtx.beginPath();
                    tilesetCtx.moveTo(x * TILE_SIZE * zoomLevel, 0);
                    tilesetCtx.lineTo(x * TILE_SIZE * zoomLevel, tilesetCanvas.height);
                    tilesetCtx.stroke();
                }
                
                for (let y = 0; y <= tilesetRows; y++) {
                    tilesetCtx.beginPath();
                    tilesetCtx.moveTo(0, y * TILE_SIZE * zoomLevel);
                    tilesetCtx.lineTo(tilesetCanvas.width, y * TILE_SIZE * zoomLevel);
                    tilesetCtx.stroke();
                }
                
                tilesetCtx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
                tilesetCtx.lineWidth = 2;
                tilesetCtx.strokeRect(
                    selectedX * zoomLevel,
                    selectedY * zoomLevel,
                    selectionWidth * zoomLevel,
                    selectionHeight * zoomLevel
                );
            }
            
            function generateTileData() {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = selectionWidth;
                tempCanvas.height = selectionHeight;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                
                tempCtx.drawImage(
                    tilesetImage,
                    selectedX, selectedY, selectionWidth, selectionHeight,
                    0, 0, selectionWidth, selectionHeight
                );

                try {
                    const imageData = tempCtx.getImageData(0, 0, selectionWidth, selectionHeight);
                    const data = imageData.data;
                    const pixelArray = [];
                    
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i+1];
                        const b = data[i+2];
                        const a = data[i+3];
                        
                        pixelArray.push(getColorIndex(r, g, b, a));
                    }

                    const format = dataFormatSelect.value;
                    let output = '';

                    switch (format) {
                        case 'array1d':
                            output = `[${pixelArray.join(', ')}]`;
                            break;

                        case 'array2d':
                            output = '[\n';
                            for (let y = 0; y < selectionHeight; y++) {
                                const rowStart = y * selectionWidth;
                                const rowEnd = rowStart + selectionWidth;
                                output += `  [${pixelArray.slice(rowStart, rowEnd).join(', ')}]`;
                                if (y < selectionHeight - 1) output += ',';
                                output += '\n';
                            }
                            output += ']';
                            break;

                        case 'hex-packed':
                            const hexBytes = [];
                            for (let i = 0; i < pixelArray.length; i += 8) {
                                let byte = 0;
                                for (let bit = 0; bit < 8; bit++) {
                                    if (i + bit < pixelArray.length) {
                                        byte |= (pixelArray[i + bit] << (7 - bit));
                                    }
                                }
                                hexBytes.push(`0x${byte.toString(16).padStart(2, '0')}`);
                            }
                            output = `[${hexBytes.join(', ')}]`;
                            break;

                        case 'palette-index':
                            output = `{\n  "palette": [\n`;
                            COLOR_SETTINGS.palette.forEach((color, index) => {
                                const rgbHex = color.rgb.map(v => v.toString(16).padStart(2, '0')).join('');
                                output += `    "${rgbHex}", // ${index}: ${color.name}\n`;
                            });
                            output += `  ],\n  "width": ${selectionWidth},\n  "height": ${selectionHeight},\n`;
                            output += `  "data": [\n    ${pixelArray.join(', ')}\n  ]\n}`;
                            break;

                        default:
                            output = "Formato no reconocido";
                    }

                    tileDataTextarea.value = output;
                } catch (e) {
                    console.error('Error al generar datos:', e);
                    tileDataTextarea.value = `Error: ${e.message}`;
                }
            }
            
            function updateZoom() {
                updateCanvasSize();
                tilesetCtx.imageSmoothingEnabled = false;
                tilesetCtx.drawImage(tilesetImage, 0, 0, tilesetCanvas.width, tilesetCanvas.height);
                drawGrid();
                zoomLevelSpan.textContent = `Zoom: ${zoomLevel}x`;
            }
            
            // Event listeners
            tilesetCanvas.addEventListener('mousedown', function(e) {
                const rect = tilesetCanvas.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left) / zoomLevel);
                const y = Math.floor((e.clientY - rect.top) / zoomLevel);
                
                isDragging = true;
                dragStartX = x;
                dragStartY = y;
                updateSelection(x, y);
            });
            
            tilesetCanvas.addEventListener('mousemove', function(e) {
                if (!isDragging) return;
                
                const rect = tilesetCanvas.getBoundingClientRect();
                const x = Math.floor((e.clientX - rect.left) / zoomLevel);
                const y = Math.floor((e.clientY - rect.top) / zoomLevel);
                
                selectionWidth = Math.abs(x - dragStartX) + 1;
                selectionHeight = Math.abs(y - dragStartY) + 1;
                
                selectionWidth = Math.min(selectionWidth, tilesetWidth - selectedX);
                selectionHeight = Math.min(selectionHeight, tilesetHeight - selectedY);
                
                selectionWidthInput.value = selectionWidth;
                selectionHeightInput.value = selectionHeight;
                
                updateSelection(dragStartX, dragStartY);
            });
            
            tilesetCanvas.addEventListener('mouseup', function() {
                isDragging = false;
            });
            
            tilesetCanvas.addEventListener('mouseleave', function() {
                isDragging = false;
            });
            
            selectionWidthInput.addEventListener('change', function() {
                selectionWidth = parseInt(this.value) || TILE_SIZE;
                updateSelection(selectedX, selectedY);
            });
            
            selectionHeightInput.addEventListener('change', function() {
                selectionHeight = parseInt(this.value) || TILE_SIZE;
                updateSelection(selectedX, selectedY);
            });
            
            document.addEventListener('keydown', function(e) {
                const step = e.shiftKey ? TILE_SIZE : 1;
                
                if (keyRepeatTimer) return;
                
                function handleMovement() {
                    switch(e.key) {
                        case 'ArrowLeft':
                            updateSelection(Math.max(0, selectedX - step), selectedY);
                            break;
                        case 'ArrowRight':
                            updateSelection(Math.min(tilesetWidth - selectionWidth, selectedX + step), selectedY);
                            break;
                        case 'ArrowUp':
                            updateSelection(selectedX, Math.max(0, selectedY - step));
                            break;
                        case 'ArrowDown':
                            updateSelection(selectedX, Math.min(tilesetHeight - selectionHeight, selectedY + step));
                            break;
                        default:
                            return;
                    }
                    
                    keyRepeatTimer = setTimeout(handleMovement, isKeyRepeating ? 50 : 300);
                    isKeyRepeating = true;
                    e.preventDefault();
                }
                
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    handleMovement();
                    e.preventDefault();
                }
            });
            
            document.addEventListener('keyup', function(e) {
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
                    clearTimeout(keyRepeatTimer);
                    keyRepeatTimer = null;
                    isKeyRepeating = false;
                    e.preventDefault();
                }
            });
            
            copyDataBtn.addEventListener('click', function() {
                tileDataTextarea.select();
                document.execCommand('copy');
                alert('Datos copiados al portapapeles');
            });
            
            exportPngBtn.addEventListener('click', function() {
                const link = document.createElement('a');
                link.download = `selection_${selectedX}x${selectedY}_${selectionWidth}x${selectionHeight}.png`;
                link.href = previewCanvas.toDataURL('image/png');
                link.click();
            });
            
            dataFormatSelect.addEventListener('change', generateTileData);
            
            zoomInBtn.addEventListener('click', function() {
                if (zoomLevel < 8) {
                    zoomLevel *= 2;
                    updateZoom();
                }
            });
            
            zoomOutBtn.addEventListener('click', function() {
                if (zoomLevel > 1) {
                    zoomLevel /= 2;
                    updateZoom();
                }
            });
            
            colorModeSelect.addEventListener('change', function() {
                COLOR_SETTINGS.mode = this.value;
                document.getElementById('bw-threshold-control').style.display = 
                    this.value === 'bw' ? 'block' : 'none';
                generateTileData();
            });

            bwThresholdInput.addEventListener('input', function() {
                COLOR_SETTINGS.bwThreshold = parseInt(this.value);
                thresholdValueSpan.textContent = this.value;
                generateTileData();
            });

            detectColorsBtn.addEventListener('click', detectMainColors);
        });