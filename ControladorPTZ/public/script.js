document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a Elementos ---
    const addPositionBtn = document.getElementById('add-position-btn');
    const playSequenceBtn = document.getElementById('play-sequence-btn');
    const clearPositionsBtn = document.getElementById('clear-positions-btn');
    const panDurationInput = document.getElementById('pan-duration');
    const positionList = document.getElementById('sequence-list');
    const ptzButtons = document.querySelectorAll('.ptz-btn');

    // --- Variables de Estado ---
    let positions = []; // Almacenará la info de los inputs virtuales: { key, title, number }
    let isPlaying = false;

    // --- Lógica de UI ---
    const updatePositionListView = () => {
        positionList.innerHTML = '';
        positions.forEach((pos, index) => {
            const li = document.createElement('li');
            li.textContent = `Posición ${index + 1}`;
            positionList.appendChild(li);
        });
    };

    const setControlsState = (disabled) => {
        addPositionBtn.disabled = disabled;
        clearPositionsBtn.disabled = disabled;
        ptzButtons.forEach(b => b.disabled = disabled);
    };

    // --- Lógica de Comandos PTZ (Movimiento Manual) ---
    const sendPtzCommand = async (command) => {
        try {
            await fetch('/api/ptz', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ command }) });
        } catch (error) {
            console.error('Error de red o de conexión...', error);
        }
    };

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

    // --- Lógica Principal de la Aplicación ---

    addPositionBtn.addEventListener('click', async () => {
        addPositionBtn.disabled = true;
        addPositionBtn.textContent = 'Marcando...';
        try {
            await fetch('/api/ptz/create-snapshot', { method: 'POST' });
            const response = await fetch('/api/ptz/last-created-input');
            if (!response.ok) throw new Error('No se pudo obtener la información del nuevo input.');
            const newPosition = await response.json();
            positions.push(newPosition);
            updatePositionListView();
        } catch (error) {
            console.error('Error al marcar la posición:', error);
            alert('No se pudo marcar la posición.');
        } finally {
            addPositionBtn.disabled = false;
            addPositionBtn.textContent = 'Marcar Posición';
        }
    });

    clearPositionsBtn.addEventListener('click', async () => {
        if (positions.length === 0) return;
        const keysToRemove = positions.map(p => p.key);
        
        try {
            await fetch('/api/ptz/remove-inputs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keys: keysToRemove })
            });
            positions = [];
            updatePositionListView();
            alert('Posiciones limpiadas.');
        } catch (error) {
            console.error('Error al limpiar posiciones:', error);
            alert('No se pudieron limpiar las posiciones en vMix.');
        }
    });

    playSequenceBtn.addEventListener('click', async () => {
        if (isPlaying) {
            isPlaying = false;
            playSequenceBtn.textContent = 'Deteniendo...';
            playSequenceBtn.disabled = true;
            return;
        }

        if (positions.length < 1) {
            return alert('Necesitas al menos 1 posición marcada para reproducir.');
        }

        isPlaying = true;
        playSequenceBtn.textContent = 'Detener';
        setControlsState(true);

        const duration = panDurationInput.value;
        let tempHomeSnapshot = null;

        try {
            // 1. Crear snapshot de Home
            await sendPtzCommand('home');
            await new Promise(r => setTimeout(r, 1000)); // Esperar que la cámara llegue a Home
            await fetch('/api/ptz/create-snapshot', { method: 'POST' });
            const homeResponse = await fetch('/api/ptz/last-created-input');
            if (!homeResponse.ok) throw new Error('No se pudo crear el snapshot de Home.');
            tempHomeSnapshot = await homeResponse.json();

            // 2. Bucle de reproducción
            let playlist = [tempHomeSnapshot, ...positions];
            let currentIndex = 0;

            while (isPlaying) {
                const startPos = playlist[currentIndex];
                const endPos = playlist[currentIndex + 1] || positions[0]; // Si es el último, vuelve al primero marcado
                
                // Cortar al punto de inicio del paneo
                await fetch(`/api/ptz/function?name=Cut&input=${startPos.key}`);
                await new Promise(r => setTimeout(r, 100)); // Pausa

                // Iniciar paneo
                await fetch(`/api/ptz/function?name=Merge&input=${endPos.key}&duration=${duration}`);
                await new Promise(r => setTimeout(r, parseInt(duration, 10)));

                currentIndex++;
                if (currentIndex >= playlist.length) {
                    currentIndex = 0; // Reiniciar para el bucle, empezando desde la Posición 1
                    playlist = positions; // Las siguientes vueltas ya no incluyen Home
                }
            }
        } catch (error) {
            console.error('Error en la reproducción:', error);
            alert('Ocurrió un error durante la reproducción.');
        } finally {
            // 3. Limpieza final
            if (tempHomeSnapshot) {
                await fetch('/api/ptz/remove-inputs', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ keys: [tempHomeSnapshot.key] })
                });
            }
            isPlaying = false;
            playSequenceBtn.textContent = 'Reproducir';
            playSequenceBtn.disabled = false;
            setControlsState(false);
        }
    });
});
