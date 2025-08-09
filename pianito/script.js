const notes = [
            "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
            "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
            "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5",
            "C6", "C#6", "D6"
        ];

        const piano = document.getElementById("piano");
        const codeArea = document.getElementById("codeArea");
        const instrumentSelect = document.getElementById("instrumentSelect");
        const recordBtn = document.getElementById('recordBtn');
        const playBtn = document.getElementById('playCode');
        const clearBtn = document.getElementById('clearCode');

        // --- Creación del Teclado Visual ---
        const createPianoKeys = () => {
            piano.innerHTML = '';
            const whiteNotes = notes.filter(n => !n.includes("#"));
            const blackNotes = notes.filter(n => n.includes("#"));

            whiteNotes.forEach((noteName, i) => {
                const whiteKey = document.createElement("div");
                whiteKey.classList.add("white-key");
                whiteKey.dataset.note = noteName;
                piano.appendChild(whiteKey);

                // Añadir tecla negra si corresponde
                const blackNoteName = noteName.slice(0, 1) + "#" + noteName.slice(1);
                if (i < whiteNotes.length - 1 && blackNotes.includes(blackNoteName) && !noteName.startsWith('E') && !noteName.startsWith('B')) {
                    const blackKey = document.createElement("div");
                    blackKey.classList.add("black-key");
                    blackKey.dataset.note = blackNoteName;
                    blackKey.style.left = `${(i + 1) * 40}px`;
                    piano.appendChild(blackKey);
                }
            });
        };
        createPianoKeys();


        // --- Contexto de Audio y Lógica de Sonido ---
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();

        async function unlockAudioContext() {
            if (audioCtx.state === "suspended") await audioCtx.resume();
        }
        document.addEventListener('click', unlockAudioContext, { once: true });


        function noteToFrequency(note) {
            const A4 = 440;
            const noteIndex = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            const noteStr = note.slice(0, -1);
            const octave = parseInt(note.slice(-1));
            
            let keyNumber = noteIndex.indexOf(noteStr);
            if (keyNumber < 0) return null; // Nota no válida

            keyNumber = keyNumber + (octave + 1) * 12;
            return A4 * Math.pow(2, (keyNumber - 57) / 12);
        }

        const activeOscillators = {};

        function startNote(note) {
            if (!note || activeOscillators[note]) return;

            const freq = noteToFrequency(note);
            if (!freq) return;
            
            unlockAudioContext();

            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = instrumentSelect.value;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.01);

            osc.start();
            activeOscillators[note] = { osc, gain };
            
            activateKey(note);
            handleNoteOn(note); // Para la grabación
        }

        function stopNote(note) {
            if (!activeOscillators[note]) return;

            const { osc, gain } = activeOscillators[note];
            const fadeOutTime = audioCtx.currentTime + 0.1;
            gain.gain.exponentialRampToValueAtTime(0.0001, fadeOutTime);
            osc.stop(fadeOutTime);

            delete activeOscillators[note];
            
            deactivateKey(note);
            handleNoteOff(note); // Para la grabación
        }
        
        function activateKey(note) {
            const key = piano.querySelector(`[data-note="${note}"]`);
            if (key) key.classList.add("active");
        }

        function deactivateKey(note) {
            const key = piano.querySelector(`[data-note="${note}"]`);
            if (key) key.classList.remove("active");
        }


        // --- LÓGICA DE GRABACIÓN MEJORADA ---
        let isRecording = false;
        let recordingStartTime = 0;
        let noteOnEvents = new Map(); // Almacena eventos 'note on' que no han terminado
        let recordedMelody = []; // Almacena la melodía final como objetos {note, start, duration}

        recordBtn.addEventListener('click', () => {
            isRecording = !isRecording;
            if (isRecording) {
                // Iniciar grabación
                recordedMelody = [];
                noteOnEvents.clear();
                recordingStartTime = performance.now();
                recordBtn.textContent = 'Detener';
                recordBtn.classList.add('recording');
                codeArea.value = 'Grabando...';
            } else {
                // Detener grabación
                recordBtn.textContent = 'Grabar';
                recordBtn.classList.remove('recording');
                generateCodeFromMelody();
            }
        });

        function handleNoteOn(note) {
            if (!isRecording) return;
            // Registra el tiempo de inicio de la nota relativo al inicio de la grabación
            noteOnEvents.set(note, performance.now() - recordingStartTime);
        }

        function handleNoteOff(note) {
            if (!isRecording || !noteOnEvents.has(note)) return;
            
            const noteStartTime = noteOnEvents.get(note);
            const noteEndTime = performance.now() - recordingStartTime;
            const duration = (noteEndTime - noteStartTime) / 1000; // en segundos

            if (duration > 0.02) { // Evitar notas accidentales muy cortas
                 recordedMelody.push({
                    note: note,
                    start: noteStartTime / 1000, // en segundos
                    duration: duration
                });
            }
            noteOnEvents.delete(note);
        }

        function generateCodeFromMelody() {
            // Ordenar por tiempo de inicio
            recordedMelody.sort((a, b) => a.start - b.start);

            let code = "const melody = [\n";
            code += recordedMelody.map(n => 
                `  { note: "${n.note}", start: ${n.start.toFixed(3)}, duration: ${n.duration.toFixed(3)} }`
            ).join(",\n");
            code += "\n];";
            
            codeArea.value = code;
        }

        // --- REPRODUCCIÓN DEL CÓDIGO MEJORADA ---
        playBtn.addEventListener('click', async () => {
            try {
                // Usamos el constructor de Function para evaluar el código de forma segura
                // Esto es más seguro que eval()
                const melodyFunction = new Function(`${codeArea.value}\nreturn melody;`);
                const melodyToPlay = melodyFunction();
                
                if (!Array.isArray(melodyToPlay)) {
                    throw new Error("El código no define un array 'melody' válido.");
                }

                await playMelody(melodyToPlay);

            } catch (err) {
                alert("Error al reproducir la melodía: " + err.message);
                console.error(err);
            }
        });

        async function playMelody(melody) {
            await unlockAudioContext();
            const playbackStartTime = audioCtx.currentTime;

            melody.forEach(({ note, start, duration }) => {
                const freq = noteToFrequency(note);
                if (!freq) return;

                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                
                osc.type = instrumentSelect.value;
                osc.frequency.setValueAtTime(freq, playbackStartTime + start);
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                // Attack y Sustain
                gain.gain.setValueAtTime(0, playbackStartTime + start);
                gain.gain.linearRampToValueAtTime(0.2, playbackStartTime + start + 0.01);

                // Release
                const releaseTime = playbackStartTime + start + duration;
                gain.gain.setValueAtTime(0.2, releaseTime - 0.05);
                gain.gain.linearRampToValueAtTime(0, releaseTime);

                osc.start(playbackStartTime + start);
                osc.stop(releaseTime);

                // Animación de las teclas
                setTimeout(() => activateKey(note), start * 1000);
                setTimeout(() => deactivateKey(note), (start + duration) * 1000);
            });
        }
        
        clearBtn.addEventListener("click", () => {
          recordedMelody = [];
          noteOnEvents.clear();
          if(isRecording) {
            recordBtn.click(); // Simula el click para detener la grabación
          }
          codeArea.value = "";
        });


        // --- MANEJADORES DE ENTRADA (Teclado, Mouse, MIDI) ---
        const pressedKeys = new Set();
        const keyMap = {
            a: "C4", w: "C#4", s: "D4", e: "D#4", d: "E4", f: "F4", t: "F#4",
            g: "G4", y: "G#4", h: "A4", u: "A#4", j: "B4", k: "C5", o: "C#5", l: "D5"
        };

        document.addEventListener("keydown", e => {
            if (e.repeat || e.target.tagName === 'TEXTAREA') return;
            const note = keyMap[e.key.toLowerCase()];
            if (note && !pressedKeys.has(note)) {
                pressedKeys.add(note);
                startNote(note);
            }
        });

        document.addEventListener("keyup", e => {
            if (e.target.tagName === 'TEXTAREA') return;
            const note = keyMap[e.key.toLowerCase()];
            if (note) {
                pressedKeys.delete(note);
                stopNote(note);
            }
        });

        piano.addEventListener("mousedown", e => {
            if (e.target.dataset.note) startNote(e.target.dataset.note);
        });
        piano.addEventListener("mouseup", e => {
            if (e.target.dataset.note) stopNote(e.target.dataset.note);
        });
        piano.addEventListener("mouseleave", e => {
            if (e.target.dataset.note) stopNote(e.target.dataset.note);
        });

        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
        }

        function onMIDISuccess(midiAccess) {
            for (let input of midiAccess.inputs.values()) {
                input.onmidimessage = getMIDIMessage;
            }
        }
        
        function onMIDIFailure() {
            console.log('No se pudo acceder a tus dispositivos MIDI.');
        }

        function getMIDIMessage(message) {
            const [command, noteNum, velocity] = message.data;
            const noteName = midiNoteToName(noteNum);
            // command 144 = noteOn, command 128 = noteOff
            if (command === 144 && velocity > 0) {
                startNote(noteName);
            } else if (command === 128 || (command === 144 && velocity === 0)) {
                stopNote(noteName);
            }
        }

        function midiNoteToName(midiNote) {
            const noteIndex = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let octave = Math.floor(midiNote / 12) - 1;
            return noteIndex[midiNote % 12] + octave;
        }