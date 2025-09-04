document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const sequenceListDiv = document.getElementById('sequenceList');
    const recordSequenceButton = document.getElementById('recordSequenceButton');
    const playSequenceButton = document.getElementById('playSequenceButton');
    const panTiltSpeedSlider = document.getElementById('panTiltSpeedSlider');

    let recordingMode = false;
    let recordedSequence = [];
    let movementStartTime = 0;

    // --- FUNCIN PRINCIPAL DE COMUNICACIN ---
    const sendPtzCommand = async (action, value = null, recordData = null) => {
        try {
            const body = { action };
            if (value !== null) {
                body.value = value;
            }
            if (recordData) { // If this is data to be recorded
                Object.assign(body, recordData);
            }

            const responsePromise = fetch('/api/ptz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            // For stop and home commands, await the response to ensure it's processed immediately.
            if (action === 'moveStop' || action === 'zoomStop' || action === 'home') {
                const response = await responsePromise;
                const data = await response.json();
                if (!response.ok || !data.success) {
                    statusDiv.textContent = `Error: ${data.message}`;
                    statusDiv.style.backgroundColor = '#dc3545'; // Rojo
                }
            } else {
                // For other commands, handle response asynchronously without blocking
                responsePromise.then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            if (!recordData) { // Only update status if not recording data send
                                statusDiv.style.backgroundColor = '#28a745'; // Verde
                            }
                            if (recordData) {
                                updateSequenceListDisplay();
                            }
                        } else {
                            statusDiv.textContent = `Error: ${data.message}`;
                            statusDiv.style.backgroundColor = '#dc3545'; // Rojo
                        }
                    })
                    .catch(error => {
                        statusDiv.textContent = `Error de conexin: ${error.message}`;
                        statusDiv.style.backgroundColor = '#dc3545'; // Rojo
                    });
            }
        } catch (error) {
            statusDiv.textContent = `Error de conexin: ${error.message}`;
            statusDiv.style.backgroundColor = '#dc3545'; // Rojo
        }
    };

    // --- FUNCIONES DE SECUENCIA ---
    const updateSequenceListDisplay = () => {
        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                sequenceListDiv.innerHTML += `${index + 1}. ${step.action} - ${step.duration}ms - ${step.speed ? `Vel: ${step.speed}` : ''}<br>`;
            });
        }
    };

    const sendSequenceCommand = async (endpoint, data = {}) => {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            const result = await response.json();
            if (!result.success) {
                statusDiv.textContent = `Error de secuencia: ${result.message}`;
                statusDiv.style.backgroundColor = '#dc3545';
            }
            return result;
        } catch (error) {
            statusDiv.textContent = `Error de conexin de secuencia: ${error.message}`;
            statusDiv.style.backgroundColor = '#dc3545';
            return { success: false, message: error.message };
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
            movementStartTime = Date.now(); // Capture start time
            sendPtzCommand(action);
        });

        element.addEventListener('mouseup', async () => {
            const stopAction = isZoom ? 'zoomStop' : 'moveStop';
            const duration = Date.now() - movementStartTime;
            
            sendPtzCommand(stopAction);

            if (recordingMode) {
                const speed = parseFloat((panTiltSpeedSlider.value / 100).toFixed(2)); // Get current speed from slider
                const recordedStep = { action: action, duration: duration, speed: speed };
                recordedSequence.push(recordedStep);
                updateSequenceListDisplay();
                // Send recorded step to backend
                await sendSequenceCommand('/api/sequence/record', recordedStep);
            }
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
    panTiltSpeedSlider.addEventListener('input', (event) => {
        const speed = event.target.value;
        sendPtzCommand('setPanTiltSpeed', speed);
    });

    // --- EVENT LISTENERS PARA BOTONES DE SECUENCIA ---
    recordSequenceButton.addEventListener('click', async () => {
        recordingMode = !recordingMode;
        if (recordingMode) {
            recordSequenceButton.textContent = 'Detener Grabación';
            recordSequenceButton.style.backgroundColor = '#dc3545'; // Rojo
            statusDiv.textContent = 'Yendo a Home para grabar...';
            statusDiv.style.backgroundColor = '#444444';
            await sendPtzCommand('home'); // Go to Home before recording
            recordedSequence = []; // Clear previous sequence
            updateSequenceListDisplay();
            await sendSequenceCommand('/api/sequence/startRecording');
            statusDiv.textContent = 'Grabando secuencia...';
            statusDiv.style.backgroundColor = '#ffc107'; // Amarillo
        } else {
            recordSequenceButton.textContent = 'Grabar Secuencia';
            recordSequenceButton.style.backgroundColor = ''; // Reset color
            statusDiv.textContent = 'Yendo a Home al detener grabacin...';
            statusDiv.style.backgroundColor = '#444444';
            await sendSequenceCommand('/api/sequence/stopRecording');
            await sendPtzCommand('home'); // Go to Home after recording
            statusDiv.textContent = 'Grabación detenida.';
            statusDiv.style.backgroundColor = '#28a745'; // Verde
        }
    });

    playSequenceButton.addEventListener('click', async () => {
        statusDiv.textContent = 'Reproduciendo secuencia...';
        statusDiv.style.backgroundColor = '#007bff'; // Azul
        const currentPlaybackSpeed = parseFloat((panTiltSpeedSlider.value / 100).toFixed(2));
        await sendSequenceCommand('/api/sequence/play', { playbackSpeed: currentPlaybackSpeed });
        statusDiv.textContent = 'Secuencia completada.';
        statusDiv.style.backgroundColor = '#28a745'; // Verde
    });

    // Initial display update
    updateSequenceListDisplay();
});