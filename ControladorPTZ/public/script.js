document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');

    // --- FUNCIN PRINCIPAL DE COMUNICACIN ---
    const sendPtzCommand = async (action, value = null) => {
        try {
            const body = { action };
            if (value !== null) {
                body.value = value;
            }

            const response = await fetch('/api/ptz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                statusDiv.textContent = data.message;
                statusDiv.style.backgroundColor = '#28a745'; // Verde
            } else {
                statusDiv.textContent = `Error: ${data.message}`;
                statusDiv.style.backgroundColor = '#dc3545'; // Rojo
            }
        } catch (error) {
            statusDiv.textContent = `Error de conexin: ${error.message}`;
            statusDiv.style.backgroundColor = '#dc3545'; // Rojo
        }
    };

    // --- EVENT LISTENERS PARA BOTONES ---

    // Botn Home (un solo clic)
    document.getElementById('homeButton').addEventListener('click', () => {
        statusDiv.textContent = 'Enviando comando Home...';
        statusDiv.style.backgroundColor = '#444444';
        sendPtzCommand('home');
    });

    // Funcin para manejar eventos de presionar y soltar
    const addHoldAndReleaseListeners = (elementId, action) => {
        const element = document.getElementById(elementId);
        let isZoom = action.includes('zoom');

        element.addEventListener('mousedown', () => {
            sendPtzCommand(action);
        });

        element.addEventListener('mouseup', () => {
            const stopAction = isZoom ? 'zoomStop' : 'moveStop';
            sendPtzCommand(stopAction);
        });
        
        element.addEventListener('mouseleave', () => {
             if (element.matches(':active')) {
                const stopAction = isZoom ? 'zoomStop' : 'moveStop';
                sendPtzCommand(stopAction);
             }
        });
    };

    // Mapeo de botones a acciones
    const actions = {
        'up': { action: 'tiltUp' },
        'down': { action: 'tiltDown' },
        'left': { action: 'panLeft' },
        'right': { action: 'panRight' },
        'up-left': { action: 'moveUpLeft' },
        'up-right': { action: 'moveUpRight' },
        'down-left': { action: 'moveDownLeft' },
        'down-right': { action: 'moveDownRight' },
        'zoom-in': { action: 'zoomIn' },
        'zoom-out': { action: 'zoomOut' },
    };

    for (const [id, { action }] of Object.entries(actions)) {
        addHoldAndReleaseListeners(id, action);
    }

    // --- EVENT LISTENERS PARA SLIDERS DE VELOCIDAD ---
    const panTiltSpeedSlider = document.getElementById('panTiltSpeedSlider');
    const zoomSpeedSlider = document.getElementById('zoomSpeedSlider');

    panTiltSpeedSlider.addEventListener('input', (event) => {
        const speed = event.target.value;
        sendPtzCommand('setPanTiltSpeed', speed);
    });

    zoomSpeedSlider.addEventListener('input', (event) => {
        const speed = event.target.value;
        sendPtzCommand('setZoomSpeed', speed);
    });
});