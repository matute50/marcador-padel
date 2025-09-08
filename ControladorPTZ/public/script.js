document.addEventListener('DOMContentLoaded', () => {
    const directionalButtons = document.querySelectorAll('.ptz-btn[data-direction]');
    const homeButton = document.getElementById('ptz-home');
    const zoomButtons = document.querySelectorAll('.zoom-btn');
    const recordSequenceBtn = document.getElementById('record-sequence-btn');
    const playSequenceBtn = document.getElementById('play-sequence-btn'); // New button

    let isRecording = false;
    let isPlaying = false; // New state variable
    let recordedSequence = []; // This is for recording
    let loadedSequence = []; // New: This will hold the sequence loaded from file
    let activeCommand = null;
    let commandStartTime = 0;
    let lastCommandEndTime = 0;

    const sendPtzCommand = async (command, speedValue = null) => {
        try {
            const url = `/api/ptz`;
            const body = { command: command };
            if (speedValue !== null) {
                body.value = speedValue; // Add speed value to body
            }

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error(`Error del servidor: ${errorData.message}`);
                if (errorData.debugUrl) { // Log the debug URL if provided
                    console.error(`URL de vMix que causó el error: ${errorData.debugUrl}`);
                }
            } else {
                // console.log(`Comando '${command}' enviado con éxito al backend.`); // Removed for cleaner console
            }
        } catch (error) {
            console.error('Error de red o de conexión. Asegúrate de que el servidor local esté corriendo.', error);
        }
    };

    // --- Handlers de Movimiento y Zoom (unificados) ---
    const handleStartCommand = (e) => {
        const command = e.currentTarget.dataset.direction || e.currentTarget.dataset.command;
        if (isRecording) {
            activeCommand = command;
            commandStartTime = Date.now();
        }
        sendPtzCommand(command);
        e.preventDefault();
    };

    const handleStopCommand = (e) => {
        if (isRecording && activeCommand) {
            const duration = Date.now() - commandStartTime;
            const pauseBefore = lastCommandEndTime === 0 ? 0 : Date.now() - lastCommandEndTime;

            recordedSequence.push({
                command: activeCommand,
                duration: duration,
                pauseBefore: pauseBefore,
                recordedSpeedValue: 0.5 // Confirmed recording speed
            });
            console.log('Recorded:', recordedSequence[recordedSequence.length - 1]);
            activeCommand = null;
            lastCommandEndTime = Date.now();
        }
        sendPtzCommand('stop'); // Always send stop
        sendPtzCommand('zoom-stop'); // Always send zoom-stop (redundant but safe)
        e.preventDefault();
    };

    // Attach unified handlers
    directionalButtons.forEach(button => {
        button.addEventListener('mousedown', handleStartCommand);
        button.addEventListener('mouseup', handleStopCommand);
        button.addEventListener('mouseleave', handleStopCommand);
    });

    zoomButtons.forEach(button => {
        button.addEventListener('mousedown', handleStartCommand);
        button.addEventListener('mouseup', handleStopCommand);
        button.addEventListener('mouseleave', handleStopCommand);
    });

    // --- Handler de Home (special case, not continuous) ---
    if (homeButton) {
        homeButton.addEventListener('click', () => {
            if (isRecording) {
                const pauseBefore = lastCommandEndTime === 0 ? 0 : Date.now() - lastCommandEndTime;
                recordedSequence.push({
                    command: 'home',
                    duration: 0,
                    pauseBefore: pauseBefore,
                    recordedSpeedValue: 0.5
                });
                console.log('Recorded:', recordedSequence[recordedSequence.length - 1]);
                lastCommandEndTime = Date.now();
            }
            sendPtzCommand('home');
        });
    }

    // --- Grabación de Secuencia ---
    if (recordSequenceBtn) {
        recordSequenceBtn.addEventListener('click', async () => {
            if (!isRecording) {
                // Start Recording
                isRecording = true;
                recordedSequence = [];
                recordSequenceBtn.textContent = 'Detener Grabación';
                recordSequenceBtn.style.backgroundColor = '#c9302c'; // Red for recording

                await sendPtzCommand('home'); // Ensure camera is home
                activeCommand = null;
                commandStartTime = 0;
                lastCommandEndTime = Date.now(); // Start measuring pauses from now
                console.log('Grabación iniciada. Cámara en Home.');

            } else {
                // Stop Recording
                isRecording = false;
                recordSequenceBtn.textContent = 'Grabar Secuencia';
                recordSequenceBtn.style.backgroundColor = '#0078d4'; // Blue again

                console.log('Grabación detenida. Secuencia grabada:', recordedSequence);
                
                // Send recordedSequence to backend
                try {
                    const response = await fetch('/api/record-sequence', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ sequence: recordedSequence }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        console.error('Error al guardar la secuencia en el servidor:', errorData.message);
                    } else {
                        console.log('Secuencia enviada al servidor para guardar.');
                        loadSequence(); // Reload sequence display after saving
                    }
                } catch (error) {
                    console.error('Error de red al enviar secuencia al servidor:', error);
                }
            }
        });
    }

    // --- Funciones para cargar y mostrar la secuencia ---
    const sequenceListElement = document.getElementById('sequence-list');
    const MIN_PLAYBACK_SPEED_VALUE = 0.01; // Confirmed by Matías

    const loadSequence = async () => {
        try {
            const response = await fetch('/api/load-sequence');
            if (!response.ok) {
                console.error('Error al cargar la secuencia:', response.statusText);
                return;
            }
            loadedSequence = await response.json(); // Assign to global loadedSequence
            displaySequence(loadedSequence); // Pass loadedSequence to display
        } catch (error) {
            console.error('Error de red al cargar la secuencia:', error);
        }
    };

    const displaySequence = (sequence) => { // Now takes sequence as argument
        sequenceListElement.innerHTML = ''; // Clear previous list
        if (sequence.length === 0) {
            sequenceListElement.innerHTML = '<li>No hay movimientos grabados.</li>';
            return;
        }

        sequence.forEach((movement, index) => {
            const listItem = document.createElement('li');
            let recalculatedTime = 0;

            // Recalcular tiempo de movimiento para reproducción a velocidad mínima
            if (movement.command !== 'home' && movement.duration > 0 && movement.recordedSpeedValue > 0) {
                const distance = movement.duration * movement.recordedSpeedValue;
                recalculatedTime = distance / MIN_PLAYBACK_SPEED_VALUE;
            }

            listItem.innerHTML = `
                <div class="movement-info">
                    ${index + 1}. ${movement.command}
                </div>
                <div class="movement-details">
                    <div class="movement-time">
                        ${(recalculatedTime / 1000).toFixed(2)}s
                    </div>
                    <div class="movement-pause">
                        Pausa: <input type="number" step="0.01" min="0" value="${(movement.pauseBefore / 1000).toFixed(2)}" data-index="${index}" class="pause-input">s
                    </div>
                </div>
            `;
            sequenceListElement.appendChild(listItem);

            const pauseInput = listItem.querySelector('.pause-input');
            if (pauseInput) {
                pauseInput.addEventListener('change', (e) => {
                    const newPause = parseFloat(e.target.value) * 1000; // Convert back to ms
                    const itemIndex = parseInt(e.target.dataset.index);
                    if (loadedSequence[itemIndex]) { // Update the global loadedSequence
                        loadedSequence[itemIndex].pauseBefore = newPause;
                        console.log(`Pausa para movimiento ${itemIndex + 1} actualizada a ${newPause / 1000}s`);
                    }
                });
            }
        });
    };

    // --- Reproducción de Secuencia ---
    if (playSequenceBtn) {
        playSequenceBtn.addEventListener('click', async () => {
            if (isPlaying) {
                // Stop playback (implement later)
                isPlaying = false;
                playSequenceBtn.textContent = 'Reproducir Secuencia';
                playSequenceBtn.style.backgroundColor = '#0078d4';
                console.log('Reproducción detenida.');
                return;
            }

            isPlaying = true;
            playSequenceBtn.textContent = 'Detener Reproducción';
            playSequenceBtn.style.backgroundColor = '#c9302c'; // Red for playing

            const sequenceToPlay = loadedSequence; // Use the global loadedSequence

            if (sequenceToPlay.length === 0) {
                console.warn('No hay secuencia para reproducir.');
                isPlaying = false;
                playSequenceBtn.textContent = 'Reproducir Secuencia';
                playSequenceBtn.style.backgroundColor = '#0078d4';
                return;
            }

            // Playback loop
            while (isPlaying) {
                await sendPtzCommand('home'); // Start from Home
                console.log('Cámara en Home. Iniciando secuencia...');

                for (const movement of sequenceToPlay) {
                    if (!isPlaying) break; // Allow stopping mid-sequence

                    // Pause before movement
                    if (movement.pauseBefore > 0) {
                        console.log(`Pausa de ${movement.pauseBefore / 1000}s antes de ${movement.command}`);
                        await new Promise(resolve => setTimeout(resolve, movement.pauseBefore));
                    }

                    if (!isPlaying) break;

                    let recalculatedTime = 0;
                    if (movement.command !== 'home' && movement.duration > 0 && movement.recordedSpeedValue > 0) {
                        const distance = movement.duration * movement.recordedSpeedValue;
                        recalculatedTime = distance / MIN_PLAYBACK_SPEED_VALUE;
                    }

                    console.log(`Ejecutando: ${movement.command} por ${recalculatedTime / 1000}s`);

                    // Send command with minimum speed
                    if (movement.command === 'home') {
                        await sendPtzCommand('home'); // Home is instant
                    } else {
                        await sendPtzCommand(movement.command, MIN_PLAYBACK_SPEED_VALUE); // Send command with min speed
                        await new Promise(resolve => setTimeout(resolve, recalculatedTime)); // Wait for duration
                        await sendPtzCommand('stop'); // Stop movement
                        if (movement.command.startsWith('zoom-')) {
                            await sendPtzCommand('zoom-stop'); // Stop zoom if it was a zoom command
                        }
                    }
                }
                if (!isPlaying) break;
                console.log('Secuencia terminada. Repitiendo...');
            }

            // Reset button state if playback stopped
            playSequenceBtn.textContent = 'Reproducir Secuencia';
            playSequenceBtn.style.backgroundColor = '#0078d4';
        });
    }

    // --- Llamar a loadSequence al cargar la página ---
    loadSequence();
});