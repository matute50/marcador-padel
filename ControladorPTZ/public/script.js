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
        panDurationInput.disabled = disabled;
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

    // --- Lógica para crear Snapshot (reutilizada) ---
    const createSnapshot = async () => {
        await fetch('/api/ptz/create-snapshot', { method: 'POST' });
        const response = await fetch('/api/ptz/last-created-input');
        if (!response.ok) throw new Error('No se pudo obtener la información del nuevo input.');
        return await response.json();
    };

    // --- Lógica Principal de la Aplicación ---

    addPositionBtn.addEventListener('click', async () => {
        addPositionBtn.disabled = true;
        addPositionBtn.textContent = 'Marcando...';
        try {
            const newPosition = await createSnapshot();
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

        const durationInMs = parseFloat(panDurationInput.value) * 1000;
        let tempHomeSnapshot = null;
        let currentPosition = null; // La posición actual de la cámara en el bucle

        try {
            // 1. Ir a Home y crear snapshot temporal de Home
            await sendPtzCommand('home');
            await new Promise(r => setTimeout(r, 1000)); // Esperar que la cámara llegue a Home
            tempHomeSnapshot = await createSnapshot();
            currentPosition = tempHomeSnapshot; // Empezamos desde Home

            // Bucle de reproducción infinito
            while (isPlaying) {
                // Panear desde Home a la primera posición marcada (solo la primera vez)
                if (currentPosition === tempHomeSnapshot) {
                    await fetch(`/api/ptz/function?name=PTZMoveToVirtualInputPosition&input=${positions[0].key}`);
                    await new Promise(r => setTimeout(r, durationInMs + 1000)); // Esperar el movimiento
                    currentPosition = positions[0]; // Actualizar posición actual
                }

                // Panear a través de las posiciones marcadas por el usuario
                for (let i = 0; i < positions.length; i++) {
                    if (!isPlaying) break; // Salir si se presiona Detener
                    const nextPosition = positions[i];

                    // Si ya estamos en la posición, saltar el movimiento (ej. al inicio del bucle)
                    if (currentPosition.key === nextPosition.key) {
                        // console.log(`Ya en ${nextPosition.title}, saltando movimiento.`);
                        continue;
                    }

                    await fetch(`/api/ptz/function?name=PTZMoveToVirtualInputPosition&input=${nextPosition.key}`);
                    await new Promise(r => setTimeout(r, durationInMs + 1000)); // Esperar el movimiento
                    currentPosition = nextPosition; // Actualizar posición actual
                }

                // Si el bucle se detuvo, salir del while
                if (!isPlaying) break;

                // Panear desde la última posición marcada de vuelta a la primera para cerrar el bucle
                if (positions.length > 1) { // Solo si hay más de una posición para buclear
                    await fetch(`/api/ptz/function?name=PTZMoveToVirtualInputPosition&input=${positions[0].key}`);
                    await new Promise(r => setTimeout(r, durationInMs + 1000)); // Esperar el movimiento
                    currentPosition = positions[0]; // Actualizar posición actual
                }
            }

        } catch (error) {
            console.error('Error en la reproducción:', error);
            alert('Ocurrió un error durante la reproducción. Revisa la consola del servidor.');
        } finally {
            // Limpieza final y restauración de UI
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