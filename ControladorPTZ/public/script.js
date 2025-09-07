document.addEventListener('DOMContentLoaded', () => {
    const statusDiv = document.getElementById('status');
    const sequenceListDiv = document.getElementById('sequenceList');
    const recordSequenceButton = document.getElementById('recordSequenceButton');
    const playSequenceButton = document.getElementById('playSequenceButton');
    const pauseAfterInput = document.getElementById('pauseAfterInput'); // New element
    // Removed panTiltSpeedSlider, calibrationFactorSlider, panTiltSpeedValue, calibrationFactorValue

    let recordingMode = false;
    let recordedSequence = [];
    let movementStartTime = 0;

    // Removed initial display values for sliders

    // --- FUNCIN PRINCIPAL DE COMUNICACIN ---
    const sendPtzCommand = async (action, value = null) => {
        try {
            const body = { action };
            if (value !== null) {
                body.value = value;
            }

            const responsePromise = fetch('/api/ptz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (action === 'moveStop' || action === 'zoomStop' || action === 'home') {
                const response = await responsePromise;
                const data = await response.json();
                if (!response.ok || !data.success) {
                    statusDiv.textContent = `Error: ${data.message}`;
                    statusDiv.style.backgroundColor = '#dc3545';
                }
            } else {
                responsePromise.then(response => response.json()).then(data => {
                    if (!data.success) {
                        statusDiv.textContent = `Error: ${data.message}`;
                        statusDiv.style.backgroundColor = '#dc3545';
                    }
                });
            }
        } catch (error) {
            statusDiv.textContent = `Error de conexin: ${error.message}`;
            statusDiv.style.backgroundColor = '#dc3545';
        }
    };

    // --- FUNCIONES DE SECUENCIA ---
    const updateSequenceListDisplay = () => {
        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                if (step.action === 'pause') {
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${step.duration}" min="0">ms`;
                } else {
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${step.duration}" min="0">ms`;
                }
                if (step.pauseAfter !== undefined && step.pauseAfter > 0) { // Display pauseAfter
                    stepHtml += ` + Pausa: ${step.pauseAfter}ms`;
                }
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    } else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    } else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            document.querySelectorAll('.pause-after-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newPauseAfter = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newPauseAfter) && newPauseAfter >= 0) {
                        recordedSequence[index].pauseAfter = newPauseAfter;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, pauseAfter: newPauseAfter });
                        if (result.success) {
                            statusDiv.textContent = `Pausa del paso ${index + 1} actualizada a ${newPauseAfter}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar pausa del paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });
        }

            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            const updateSequenceListDisplay = () => {
        const playbackSpeed = 0.01; // Hardcoded for display calculation
        const calibrationFactor = 0.73; // Hardcoded for display calculation

        sequenceListDiv.innerHTML = 'Lista de Secuencia:<br>';
        if (recordedSequence.length === 0) {
            sequenceListDiv.innerHTML += '<em>(Vacía)</em>';
        } else {
            recordedSequence.forEach((step, index) => {
                let stepHtml = `<div>${index + 1}. `;
                
                let displayDuration;
                let displayPauseAfter = step.pauseAfter || 0; // Default to 0 if not set

                if (step.action === 'pause') {
                    displayDuration = step.duration; // Pause duration is recorded duration
                    stepHtml += `PAUSA - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0">ms`;
                } else {
                    // Calculate newDuration for display
                    let newDurationMs;
                    if (step.speed <= 0) {
                        newDurationMs = step.duration; // Fallback for invalid recorded speed
                    }
                    else {
                        const speedRatio = step.speed / playbackSpeed;
                        newDurationMs = step.duration * Math.pow(speedRatio, calibrationFactor);
                    }
                    displayDuration = (newDurationMs / 1000).toFixed(2); // Convert to seconds
                    stepHtml += `${step.action} - <input type="number" class="duration-input" data-index="${index}" value="${displayDuration}" min="0" step="0.01">s`;
                }
                
                // Add pauseAfter input for all steps (including pauses, if desired)
                stepHtml += ` Pausa: <input type="number" class="pause-after-input" data-index="${index}" value="${(displayPauseAfter / 1000).toFixed(2)}" min="0" step="0.01">s`;
                
                stepHtml += `</div>`;
                sequenceListDiv.innerHTML += stepHtml;
            });
            // Add event listeners to the new input fields
            document.querySelectorAll('.duration-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newDuration = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newDuration) && newDuration >= 0) {
                        recordedSequence[index].duration = newDuration;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, duration: newDuration });
                        if (result.success) {
                            statusDiv.textContent = `Paso ${index + 1} actualizado a ${newDuration}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });

            document.querySelectorAll('.pause-after-input').forEach(input => {
                input.addEventListener('change', async (event) => {
                    const index = parseInt(event.target.dataset.index);
                    const newPauseAfter = parseFloat(event.target.value) * 1000; // Convert back to ms
                    if (!isNaN(newPauseAfter) && newPauseAfter >= 0) {
                        recordedSequence[index].pauseAfter = newPauseAfter;
                        const result = await sendSequenceCommand('/api/sequence/updateStep', { index, pauseAfter: newPauseAfter });
                        if (result.success) {
                            statusDiv.textContent = `Pausa del paso ${index + 1} actualizada a ${newPauseAfter}ms.`;
                            statusDiv.style.backgroundColor = '#28a745';
                        }
                        else {
                            statusDiv.textContent = `Error al actualizar pausa del paso ${index + 1}: ${result.message}`;n                            statusDiv.style.backgroundColor = '#dc3545';
                        }
                    }
                });
            });
        }

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
    document.getElementById('homeButton').addEventListener('click', () => {
        statusDiv.textContent = 'Enviando comando Home...';
        statusDiv.style.backgroundColor = '#444444';
        sendPtzCommand('home');
    });

    const addHoldAndReleaseListeners = (elementId, action) => {
        const element = document.getElementById(elementId);
        let isZoom = action.includes('zoom');

        element.addEventListener('mousedown', () => {
            movementStartTime = Date.now();
            sendPtzCommand(action);
        });

        element.addEventListener('mouseup', async () => {
            const stopAction = isZoom ? 'zoomStop' : 'moveStop';
            const duration = Date.now() - movementStartTime;
            
            sendPtzCommand(stopAction);

            if (recordingMode) {
                const speed = 0.5; // Hardcoded speed for recording, as slider is removed
                const pauseAfter = parseInt(pauseAfterInput.value); // Get pause duration
                const recordedStep = { action: action, duration: duration, speed: speed, pauseAfter: pauseAfter }; // Add pauseAfter
                recordedSequence.push(recordedStep);
                updateSequenceListDisplay();
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

    const actions = {
        'up': { action: 'tiltUp' }, 'down': { action: 'tiltDown' }, 'left': { action: 'panLeft' }, 'right': { action: 'panRight' },
        'up-left': { action: 'moveUpLeft' }, 'up-right': { action: 'moveUpRight' }, 'down-left': { action: 'moveDownLeft' }, 'down-right': { action: 'moveDownRight' },
        'zoom-in': { action: 'zoomIn' }, 'zoom-out': { action: 'zoomOut' },
    };

    for (const [id, { action }] of Object.entries(actions)) {
        addHoldAndReleaseListeners(id, action);
    }

    // Removed EVENT LISTENERS PARA SLIDERS

    // --- EVENT LISTENERS PARA BOTONES DE SECUENCIA ---
    recordSequenceButton.addEventListener('click', async () => {
        recordingMode = !recordingMode;
        if (recordingMode) {
            recordSequenceButton.textContent = 'Detener Grabación';
            recordSequenceButton.style.backgroundColor = '#dc3545';
            statusDiv.textContent = 'Yendo a Home para grabar...';
            await sendPtzCommand('home');
            recordedSequence = [];
            updateSequenceListDisplay();
            await sendSequenceCommand('/api/sequence/startRecording');
            statusDiv.textContent = 'Grabando secuencia...';
            statusDiv.style.backgroundColor = '#ffc107';
        } else {
            recordSequenceButton.textContent = 'Grabar Secuencia';
            recordSequenceButton.style.backgroundColor = '';
            await sendSequenceCommand('/api/sequence/stopRecording');
            statusDiv.textContent = 'Grabación detenida.';
            statusDiv.style.backgroundColor = '#28a745';
        }
    });

    

    playSequenceButton.addEventListener('click', async () => {
        statusDiv.textContent = 'Reproduciendo secuencia...';
        statusDiv.style.backgroundColor = '#007bff';
        const currentPlaybackSpeed = 0.01; // Hardcoded to 1%
        const calibrationFactor = 0.73; // Hardcoded from user's finding
        
        await sendSequenceCommand('/api/sequence/play', { 
            playbackSpeed: currentPlaybackSpeed,
            calibrationFactor: calibrationFactor 
        });

        statusDiv.textContent = 'Secuencia completada.';
        statusDiv.style.backgroundColor = '#28a745';
    });

    // Initial display update
    updateSequenceListDisplay();
});