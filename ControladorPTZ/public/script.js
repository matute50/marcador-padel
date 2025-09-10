document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos ---
    const recordToggleBtn = document.getElementById('record-toggle-btn');
    const playSequenceBtn = document.getElementById('play-sequence-btn');
    const saveSequenceBtn = document.getElementById('save-sequence-btn');
    const loadSequenceBtn = document.getElementById('load-sequence-btn');
    const sequenceSelect = document.getElementById('sequence-select');
    const sequenceNameInput = document.getElementById('sequence-name');
    const sequenceList = document.getElementById('sequence-list');
    const activeSequenceNameSpan = document.getElementById('active-sequence-name');
    const ptzButtons = document.querySelectorAll('.ptz-btn');

    // --- Variables de Estado ---
    let isRecording = false;
    let isPlaying = false;
    let sequenceStartTime = 0;
    let localSequence = []; // Secuencia que se está grabando o que está cargada
    let currentSequenceName = 'Nueva sin guardar';

    // --- Traducciones ---
    const commandTranslations = { 'up': 'Arriba', 'down': 'Abajo', 'left': 'Izquierda', 'right': 'Derecha', 'zoom-in': 'Zoom +', 'zoom-out': 'Zoom -', 'home': 'Home' };

    // --- Lógica de UI ---
    const updateSequenceListView = () => {
        sequenceList.innerHTML = '';
        activeSequenceNameSpan.textContent = currentSequenceName;
        if (localSequence.length < 1) return;

        let summary = [];
        let movementStart = null;
        for (const event of localSequence) {
            const isStopCommand = event.command.includes('stop');
            if (!isStopCommand) {
                if (movementStart) console.warn('Movimiento sin stop:', movementStart);
                movementStart = event;
            } else if (isStopCommand && movementStart) {
                const duration = (event.time - movementStart.time) / 1000;
                if (duration < 0.1) continue;
                const translatedAction = commandTranslations[movementStart.command] || movementStart.command;
                summary.push({ action: translatedAction, duration: duration.toFixed(1) });
                movementStart = null;
            }
        }
        summary.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.action} por ${item.duration}s`;
            sequenceList.appendChild(li);
        });
    };

    const loadSequenceList = async () => {
        try {
            const response = await fetch('/api/sequences');
            const names = await response.json();
            sequenceSelect.innerHTML = '<option value="">Elige una secuencia...</option>';
            names.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                sequenceSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error cargando lista de secuencias:', error);
            sequenceSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    };

    // --- Lógica de Comandos PTZ ---
    const sendPtzCommand = async (command) => {
        if (isRecording) {
            const time = Date.now() - sequenceStartTime;
            localSequence.push({ command, time });
        }
        try {
            await fetch('/api/ptz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
        } catch (error) {
            console.error('Error de red o de conexión...', error);
        }
    };

    // --- Handlers de Movimiento y Zoom ---
    ptzButtons.forEach(button => {
        const command = button.dataset.direction || button.dataset.command;
        if (!command) { // Botón Home
            button.addEventListener('click', () => sendPtzCommand('home'));
            return;
        }
        const stopCommand = command.includes('zoom') ? 'zoom-stop' : 'stop';
        button.addEventListener('mousedown', () => sendPtzCommand(command));
        button.addEventListener('mouseup', () => sendPtzCommand(stopCommand));
        button.addEventListener('mouseleave', () => sendPtzCommand(stopCommand));
    });

    // --- BOTONES DE GESTIÓN DE SECUENCIAS ---

    saveSequenceBtn.addEventListener('click', async () => {
        const name = sequenceNameInput.value.trim();
        if (!name) {
            alert('Por favor, introduce un nombre para la secuencia.');
            return;
        }
        if (localSequence.length === 0) {
            alert('No hay nada grabado para guardar.');
            return;
        }
        try {
            await fetch(`/api/sequences/${name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sequence: localSequence }),
            });
            alert(`Secuencia '${name}' guardada.`);
            currentSequenceName = name;
            activeSequenceNameSpan.textContent = currentSequenceName;
            loadSequenceList(); // Refrescar la lista de secuencias
        } catch (error) {
            console.error('Error al guardar:', error);
            alert('Error al guardar la secuencia.');
        }
    });

    loadSequenceBtn.addEventListener('click', async () => {
        const name = sequenceSelect.value;
        if (!name) {
            alert('Por favor, selecciona una secuencia para cargar.');
            return;
        }
        try {
            const response = await fetch(`/api/sequences/${name}`);
            if (!response.ok) throw new Error('La secuencia no se pudo cargar del servidor.');
            localSequence = await response.json();
            currentSequenceName = name;
            sequenceNameInput.value = name; // Poner el nombre en el input para facilitar sobre-escritura
            updateSequenceListView();
            alert(`Secuencia '${name}' cargada.`);
        } catch (error) {
            console.error('Error al cargar:', error);
            alert('Error al cargar la secuencia.');
        }
    });

    // --- BOTONES DE GRABACIÓN Y REPRODUCCIÓN ---

    recordToggleBtn.addEventListener('click', async () => {
        isRecording = !isRecording;
        if (isRecording) {
            // Iniciar Grabación
            localSequence = [];
            currentSequenceName = 'Nueva sin guardar';
            updateSequenceListView();
            await fetch('/api/sequence/start', { method: 'POST' }); // Le dice al server que mueva a home
            sequenceStartTime = Date.now();
            recordToggleBtn.textContent = 'Detener';
            recordToggleBtn.classList.add('btn-active-red');
            playSequenceBtn.disabled = true;
            loadSequenceBtn.disabled = true;
            saveSequenceBtn.disabled = true;
        } else {
            // Detener Grabación
            recordToggleBtn.textContent = 'Grabar';
            recordToggleBtn.classList.remove('btn-active-red');
            playSequenceBtn.disabled = false;
            loadSequenceBtn.disabled = false;
            saveSequenceBtn.disabled = false;
            updateSequenceListView(); // Muestra el resumen de lo grabado
        }
    });

    playSequenceBtn.addEventListener('click', () => {
        if (localSequence.length === 0) {
            alert('No hay secuencia para reproducir.');
            return;
        }

        isPlaying = !isPlaying;

        if (isPlaying) {
            playSequenceBtn.textContent = 'Detener';
            playSequenceBtn.classList.add('btn-active-red');
            recordToggleBtn.disabled = true;

            (async () => {
                await sendPtzCommand('home');
                await new Promise(r => setTimeout(r, 100));

                if (localSequence.length > 0) {
                    // Bucle de reproducción con estructura robusta para evitar race conditions
                    for (let i = 0; i < localSequence.length; i++) {
                        if (!isPlaying) break; // Salir si el usuario presiona Detener
                        const { command, time } = localSequence[i];
                        const delay = time - (i > 0 ? localSequence[i - 1].time : 0);
                        
                        await new Promise(resolve => {
                            setTimeout(() => {
                                if (isPlaying) { // Doble chequeo por si se detuvo durante el delay
                                    sendPtzCommand(command);
                                }
                                resolve();
                            }, delay);
                        });
                    }
                }

                // Si la secuencia terminó naturalmente (no fue interrumpida), volver a Home
                if (isPlaying) {
                    await sendPtzCommand('home');
                }

                // Restaurar estado al finalizar o detener
                isPlaying = false;
                playSequenceBtn.textContent = 'Reproducir';
                playSequenceBtn.classList.remove('btn-active-red');
                recordToggleBtn.disabled = false;
            })();
        } else {
            // Si se hace clic en "Detener", isPlaying se pone en false, el bucle lo detectará y parará.
            // El resto de la limpieza se hace dentro del bucle async.
        }
    });

    // --- Inicialización al cargar la página ---
    updateSequenceListView();
    loadSequenceList();
});
