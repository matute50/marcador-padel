const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;
const VMIX_IP = '192.168.10.204';
const VMIX_PORT = '8088';
const VMIX_INPUT = '1';

let currentPanTiltSpeed = 0.5; // Default speed (0.5 for 50% of max)

// --- Variables para la grabacin de secuencia ---
let recordedSequence = [];
let recordingActive = false;

// --- Funcin auxiliar para enviar comandos a vMix ---
const sendVmixCommand = async (functionName, params = {}) => {
    const query = new URLSearchParams({ Function: functionName, ...params, Input: VMIX_INPUT }).toString();
    const vMixUrl = `http://${VMIX_IP}:${VMIX_PORT}/api/?${query}`;
    
    console.log('Constructed vMix URL:', vMixUrl);
    console.log(`Enviando a vMix: ${vMixUrl}`);

    try {
        const vmixResponse = await axios.get(vMixUrl);
        console.log('Respuesta de vMix:', vmixResponse.status, vmixResponse.data.trim());
        return { success: true, message: vmixResponse.data.trim() };
    } catch (error) {
        console.error('Error al contactar vMix:', error.message);
        return { success: false, message: `Error al conectar con vMix: ${error.message}` };
    }
};


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Endpoint principal para comandos PTZ ---
app.post('/api/ptz', async (req, res) => {
    const { action, value } = req.body;
    console.log(`Accin recibida: ${action}` + (value !== undefined ? ` con valor: ${value}` : ''));

    let functionName = '';
    const params = {}; // Params will be built based on action

    switch (action) {
        case 'home':
            functionName = 'PTZHome';
            break;
        case 'moveStop':
            functionName = 'PTZMoveStop';
            break;
        case 'panLeft':
            functionName = 'PTZMoveLeft';
            params.Value = currentPanTiltSpeed;
            break;
        case 'panRight':
            functionName = 'PTZMoveRight';
            params.Value = currentPanTiltSpeed;
            break;
        case 'tiltUp':
            functionName = 'PTZMoveUp';
            params.Value = currentPanTiltSpeed;
            break;
        case 'tiltDown':
            functionName = 'PTZMoveDown';
            params.Value = currentPanTiltSpeed;
            break;
        case 'zoomIn':
            functionName = 'PTZZoomIn';
            break;
        case 'zoomOut':
            functionName = 'PTZZoomOut';
            break;
        case 'zoomStop':
            functionName = 'PTZZoomStop';
            break;
        
        // Implementacin de diagonales con PTZMove
        case 'moveUpLeft':
            functionName = 'PTZMoveUpLeft';
            params.Value = currentPanTiltSpeed;
            break;
        case 'moveUpRight':
            functionName = 'PTZMoveUpRight';
            params.Value = currentPanTiltSpeed;
            break;
        case 'moveDownLeft':
            functionName = 'PTZMoveDownLeft';
            params.Value = currentPanTiltSpeed;
            break;
        case 'moveDownRight':
            functionName = 'PTZMoveDownRight';
            params.Value = currentPanTiltSpeed;
            break;

        case 'setPanTiltSpeed':
            currentPanTiltSpeed = parseFloat((parseInt(value) / 100).toFixed(2));
            return res.json({ success: true, message: `Velocidad Pan/Tilt establecida a ${value}%` });
        
        default:
            return res.status(400).json({ success: false, message: 'Accin no vlida' });
    }

    const result = await sendVmixCommand(functionName, params);
    if (result.success) {
        res.json({ success: true, message: `Accin [${action}] enviada` });
    } else {
        res.status(500).json({ success: false, message: result.message });
    }
});

// --- Endpoints para la grabacin de secuencia ---
app.post('/api/sequence/record', (req, res) => {
    if (recordingActive) {
        const { action, duration, speed } = req.body;
        recordedSequence.push({ action, duration, speed });
        console.log('Grabado:', { action, duration, speed });
        res.json({ success: true, message: 'Movimiento grabado.' });
    } else {
        res.status(400).json({ success: false, message: 'La grabacin no est activa.' });
    }
});

app.post('/api/sequence/startRecording', (req, res) => {
    recordedSequence = [];
    recordingActive = true;
    console.log('Grabacin iniciada. Secuencia borrada.');
    res.json({ success: true, message: 'Grabacin iniciada.' });
});

app.post('/api/sequence/stopRecording', (req, res) => {
    recordingActive = false;
    console.log('Grabacin detenida.');
    res.json({ success: true, message: 'Grabacin detenida.' });
});

// --- Endpoint para la reproduccin de secuencia ---
app.post('/api/sequence/play', async (req, res) => {
    const { playbackSpeed } = req.body; // Get playback speed from frontend

    if (recordedSequence.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay secuencia grabada para reproducir.' });
    }

    if (playbackSpeed === 0) {
        return res.status(400).json({ success: false, message: 'La velocidad de reproduccin no puede ser cero.' });
    }

    console.log('Iniciando reproduccin de secuencia...');
    await sendVmixCommand('PTZHome'); // Ir a Home antes de la secuencia
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pequea pausa

    for (const step of recordedSequence) {
        let functionName = '';
        const params = {};
        let delayAfterMove = 0; // Delay for PTZMove commands

        // Recalcular la duracin basada en la velocidad de reproduccin actual
        const newDuration = (step.duration * step.speed) / playbackSpeed;
        console.log(`Paso ${recordedSequence.indexOf(step) + 1}: Accin: ${step.action}, Duracin grabada: ${step.duration}ms, Velocidad grabada: ${step.speed}, Nueva duracin: ${newDuration.toFixed(2)}ms`);

        switch (step.action) {
            case 'tiltUp': functionName = 'PTZMoveUp'; break;
            case 'tiltDown': functionName = 'PTZMoveDown'; break;
            case 'panLeft': functionName = 'PTZMoveLeft'; break;
            case 'panRight': functionName = 'PTZMoveRight'; break;
            case 'moveUpLeft': functionName = 'PTZMoveUpLeft'; break;
            case 'moveUpRight': functionName = 'PTZMoveUpRight'; break;
            case 'moveDownLeft': functionName = 'PTZMoveDownLeft'; break;
            case 'moveDownRight': functionName = 'PTZMoveDownRight'; break;
            case 'zoomIn': functionName = 'PTZZoomIn'; break;
            case 'zoomOut': functionName = 'PTZZoomOut'; break;
            default:
                console.warn(`Accin desconocida en secuencia: ${step.action}`);
                continue; // Skip unknown actions
        }

        // For PTZMove commands, duration * speed determines the "angle" or extent of movement
        // We need to send the move command, then a stop command after the calculated duration
        if (functionName.startsWith('PTZMove')) {
            params.Value = step.speed; // Use the recorded speed for the command
            console.log(`  Enviando ${functionName} con velocidad ${params.Value} por ${newDuration.toFixed(2)}ms`);
            const moveResult = await sendVmixCommand(functionName, params);
            if (!moveResult.success) {
                console.error(`Error al mover ${functionName}: ${moveResult.message}`);
                // Optionally, break or continue to next step
            }
            await new Promise(resolve => setTimeout(resolve, newDuration)); // Wait for the recalculated duration
            console.log(`  Enviando PTZMoveStop`);
            const stopResult = await sendVmixCommand('PTZMoveStop'); // Send stop command
            if (!stopResult.success) {
                console.error(`Error al detener movimiento: ${stopResult.message}`);
            }
            delayAfterMove = 100; // Small delay after stopping
        } else if (functionName.startsWith('PTZZoom')) {
            // For zoom, we just send the command and assume it zooms for the duration
            // vMix PTZZoomIn/Out don't take a duration, they are continuous
            // We will send the command, wait for duration, then send stop
            params.Value = step.speed; // Use the recorded speed for the command
            console.log(`  Enviando ${functionName} con velocidad ${params.Value} por ${newDuration.toFixed(2)}ms`);
            const zoomResult = await sendVmixCommand(functionName, params);
            if (!zoomResult.success) {
                console.error(`Error al hacer zoom ${functionName}: ${zoomResult.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, newDuration));
            console.log(`  Enviando PTZZoomStop`);
            const zoomStopResult = await sendVmixCommand('PTZZoomStop');
            if (!zoomStopResult.success) {
                console.error(`Error al detener zoom: ${zoomStopResult.message}`);
            }
            delayAfterMove = 100; // Small delay after stopping
        }
        
        console.log(`  Esperando ${delayAfterMove}ms antes del siguiente paso.`);
        await new Promise(resolve => setTimeout(resolve, delayAfterMove)); // Delay between steps
    }

    console.log('Reproduccin de secuencia completada.');
    await sendVmixCommand('PTZHome'); // Ir a Home despus de la secuencia
    res.json({ success: true, message: 'Secuencia reproducida.' });
});


app.listen(PORT, () => {
    console.log(`Servidor final escuchando en http://localhost:${PORT}`);
});
