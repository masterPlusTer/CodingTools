// Variables globales
        let loadedImage = null;
        let loadedImageData = null;
        let matrix = [
            [0,1,0,1,0],
            [1,1,1,1,1],
            [1,1,1,1,1],
            [0,1,1,1,0],
            [0,0,1,0,0]
        ];
        
        let customSeparator = ", ";

        // Inicializar la aplicación
        function init() {
            displayMatrix();
            updateResult();
            
            document.getElementById("threshold").addEventListener("input", function() {
                document.getElementById("thresholdValue").textContent = this.value;
                const threshold = parseInt(this.value);
                if (loadedImageData) {
                    generateMatrixFromImage(threshold);
                }
            });
            
            document.getElementById("customFormat").addEventListener("input", function() {
                updateResult();
            });
            
            // Actualizar el tamaño de la matriz
            updateMatrixSize();
        }

        // Funciones para manipular la matriz
        function addColumn() {
            for(let i = 0; i < matrix.length; i++) {
                matrix[i].push(0);
            }
            updateMatrix();
        }

        function deleteColumn() {
            if(matrix[0].length > 1) {
                for(let i = 0; i < matrix.length; i++) {
                    matrix[i].pop();
                }
                updateMatrix();
            }
        }

        function addRow() {
            let newRow = [];
            for (let i = 0; i < matrix[0].length; i++) {
                newRow.push(0);
            }
            matrix.push(newRow);
            updateMatrix();
        }

        function deleteRow() {
            if(matrix.length > 1) {
                matrix.pop();
                updateMatrix();
            }
        }
        
        function clearMatrix() {
            if(confirm("¿Estás seguro de que quieres limpiar la matriz? Todos los datos se perderán.")) {
                for (let i = 0; i < matrix.length; i++) {
                    for (let j = 0; j < matrix[i].length; j++) {
                        matrix[i][j] = 0;
                    }
                }
                updateMatrix();
            }
        }

        function toggleCell(row, col) {
            matrix[row][col] = matrix[row][col] === 1 ? 0 : 1;
            updateMatrix();
        }

        function rotate() {
            const numRows = matrix.length;
            const numCols = matrix[0].length;
            let rotated = [];
            
            for (let col = 0; col < numCols; col++) {
                let newRow = [];
                for (let row = numRows - 1; row >= 0; row--) {
                    newRow.push(matrix[row][col]);
                }
                rotated.push(newRow);
            }
            
            matrix = rotated;
            updateMatrix();
        }
        
        function updateMatrix() {
            displayMatrix();
            updateResult();
        }

        function displayMatrix() {
            const matrixContainer = document.getElementById("matrixContainer");
            matrixContainer.innerHTML = "";

            for (let j = 0; j < matrix.length; j++) {
                let row = matrix[j];
                let rowDiv = document.createElement("div");
                rowDiv.className = "matrix-row";
                matrixContainer.appendChild(rowDiv);

                for (let i = 0; i < row.length; i++) {
                    let cellDiv = document.createElement("div");
                    cellDiv.className = "matrix-cell";
                    cellDiv.textContent = row[i];
                    if (row[i] === 1) {
                        cellDiv.classList.add("active");
                    }
                    cellDiv.addEventListener("click", () => toggleCell(j, i));
                    rowDiv.appendChild(cellDiv);
                }
            }
            
            updateMatrixSize();
        }
        
        function updateMatrixSize() {
            const rows = matrix.length;
            const cols = matrix[0].length;
            document.getElementById("matrixSize").textContent = `${rows}x${cols}`;
        }

        // Funciones para procesar imágenes
        function resetPreviewImage() {
            const previewImage = document.getElementById("previewImage");
            previewImage.style.transform = "none";
        }

        function convertToMatrix() {
            resetPreviewImage();
            const previewContainer = document.querySelector(".image-preview");
            previewContainer.style.display = "flex";

            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            const imageInput = document.getElementById("imageInput");

            if (!imageInput.files || imageInput.files.length === 0) {
                alert("Por favor, selecciona una imagen PNG.");
                return;
            }

            const file = imageInput.files[0];
            const reader = new FileReader();

            reader.onload = function(e) {
                const img = new Image();

                img.onload = function() {
                    loadedImage = img;

                    const previewImage = document.getElementById("previewImage");
                    previewImage.src = img.src;

                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    loadedImageData = ctx.getImageData(0, 0, img.width, img.height);
                    const threshold = parseInt(document.getElementById("threshold").value);
                    generateMatrixFromImage(threshold);
                };

                img.onerror = function() {
                    alert("Error al cargar la imagen. Asegúrate de que sea un PNG válido.");
                };

                img.src = e.target.result;
            };

            reader.readAsDataURL(file);
        }

        function generateMatrixFromImage(threshold) {
            if (!loadedImageData) return;

            const data = loadedImageData.data;
            const width = loadedImageData.width;
            const height = loadedImageData.height;

            matrix = [];

            for (let y = 0; y < height; y++) {
                const row = [];
                for (let x = 0; x < width; x++) {
                    const offset = (y * width + x) * 4;
                    const r = data[offset];
                    const g = data[offset + 1];
                    const b = data[offset + 2];
                    const a = data[offset + 3];

                    if (a < 128) {
                        row.push(0); // Transparente
                    } else {
                        const gray = (r + g + b) / 3;
                        row.push(gray <= threshold ? 1 : 0);
                    }
                }
                matrix.push(row);
            }

            updateMatrix();
        }

        // Funciones para formateo personalizado
        function formatWithCustomTemplate(template) {
            let result = "";
            let rows = [];
            
            // Procesar cada fila
            for (let i = 0; i < matrix.length; i++) {
                let row = matrix[i];
                let rowBinary = row.join('');
                let rowHex = parseInt(rowBinary, 2).toString(16).toUpperCase();
                let rowDecimal = parseInt(rowBinary, 2);
                
                let rowText = template;
                
                // Reemplazar marcadores específicos de fila
                rowText = rowText.replace(/{row}/g, formatArrayWithSeparator(row));
                rowText = rowText.replace(/{row_binary}/g, rowBinary);
                rowText = rowText.replace(/{row_hex}/g, '0x' + rowHex);
                rowText = rowText.replace(/{row_decimal}/g, rowDecimal.toString());
                rowText = rowText.replace(/{i}/g, i);
                rowText = rowText.replace(/{i1}/g, i + 1);
                
                rows.push(rowText);
            }
            
            // Unir todas las filas
            result = rows.join('\n');
            
            // Reemplazar marcadores globales
            result = result.replace(/{matrix}/g, formatMatrixWithSeparator());
            result = result.replace(/{width}/g, matrix[0].length);
            result = result.replace(/{height}/g, matrix.length);
            
            return result;
        }
        
        function formatArrayWithSeparator(arr) {
            return arr.join(customSeparator);
        }
        
        function formatMatrixWithSeparator() {
            let result = [];
            for (let i = 0; i < matrix.length; i++) {
                result.push(formatArrayWithSeparator(matrix[i]));
            }
            return result.join(customSeparator);
        }
        
        function updateCustomSeparator() {
            customSeparator = document.getElementById("customSeparator").value;
            updateResult();
        }

        function updateResult() {
            const customFormat = document.getElementById("customFormat").value;
            const formattedMatrix = formatWithCustomTemplate(customFormat);
            
            const resultDisplay = document.getElementById("resultDisplay");
            resultDisplay.textContent = formattedMatrix;
            resultDisplay.style.display = "block";
            
            return formattedMatrix;
        }

        function copyCustomToClipboard() {
            const formattedMatrix = updateResult();
            
            const copyText = document.createElement("textarea");
            copyText.value = formattedMatrix;
            document.body.appendChild(copyText);
            copyText.select();
            document.execCommand("copy");
            document.body.removeChild(copyText);

            const copyMessage = document.getElementById("copyMessage");
            copyMessage.style.display = "block";
            setTimeout(function() {
                copyMessage.style.display = "none";
            }, 4000);
        }

        // Cargar formatos predefinidos
        function loadPreset(presetName) {
            let formatTemplate = "";
            
            switch(presetName) {
                case "brackets":
                    formatTemplate = "  [{row}]";
                    customSeparator = ", ";
                    break;
                case "compact":
                    formatTemplate = "[{row_binary}]";
                    customSeparator = "";
                    break;
                case "arduino":
                    formatTemplate = "  B{row_binary}";
                    customSeparator = ", ";
                    break;
                case "c_array":
                    formatTemplate = "  {{row}}";
                    customSeparator = ", ";
                    break;
                case "python":
                    formatTemplate = "  [{row}]";
                    customSeparator = ", ";
                    break;
                case "ascii_art":
                    formatTemplate = "{row_binary}";
                    customSeparator = "";
                    break;
            }
            
            // Actualizar el separador personalizado en la UI
            document.getElementById("customSeparator").value = customSeparator;
            
            // Para formatos que necesitan un wrapper
            if (presetName === "brackets" || presetName === "python") {
                document.getElementById("customFormat").value = "[\n" + formatTemplate + "\n]";
            } else if (presetName === "arduino") {
                document.getElementById("customFormat").value = "const byte bitmap[] = {\n" + formatTemplate + "\n};";
            } else if (presetName === "c_array") {
                document.getElementById("customFormat").value = "int matrix[" + matrix.length + "][" + matrix[0].length + "] = {\n" + formatTemplate + "\n};";
            } else {
                document.getElementById("customFormat").value = formatTemplate;
            }
            
            updateResult();
        }

        // Mostrar/ocultar panel de personalización
        function toggleCustomizationPanel() {
            const panel = document.getElementById("customizationPanel");
            const formatHelp = document.getElementById("formatHelp");
            const separatorContainer = document.getElementById("customSeparatorContainer");
            
            if (panel.style.display === "block") {
                panel.style.display = "none";
                formatHelp.style.display = "none";
                separatorContainer.style.display = "flex"; // Mostrar separador
            } else {
                panel.style.display = "block";
                formatHelp.style.display = "block";
                separatorContainer.style.display = "none"; // Ocultar separador
                panel.classList.add("highlight");
                setTimeout(() => {
                    panel.classList.remove("highlight");
                }, 2000);
            }
        }

        // Inicializar la aplicación cuando se carga la página
        window.onload = init;