const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const VMIX_IP = '192.168.10.204';
const VMIX_PORT = '8088';
const VMIX_INPUT = '1';

const logStream = fs.createWriteStream(path.join(__dirname, 'ptz_debug.log'), { flags: 'w' }); // 'w' to overwrite the log on each server start

const SEQUENCE_FILE = path.join(__dirname, 'sequence.json'); // File to store recorded sequence

const loadSequence = () => {
    try {
        if (fs.existsSync(SEQUENCE_FILE)) {
            const data = fs.readFileSync(SEQUENCE_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading sequence:', error.message);
        logStream.write(`Error loading sequence: ${error.message}\n`);
    }
    return [];
};

let currentPanTiltSpeed = 0.5; // Default speed (0.5 for 50% of max)

// --- Variables para la grabacin de secuencia ---
let recordedSequence = loadSequence(); // Load sequence on startup
let recordingActive = false;

// --- Funcin auxiliar para enviar comandos a vMix ---
const sendVmixCommand = async (functionName, params = {}) => {
    const query = new URLSearchParams({ Function: functionName, ...params, Input: VMIX_INPUT }).toString();
    const vMixUrl = `http://${VMIX_IP}:${VMIX_PORT}/api/?${query}`;
    
    const logMessage = `Enviando a vMix: ${vMixUrl}\n`;
    console.log(logMessage);
    logStream.write(logMessage);


    try {
        const vmixResponse = await axios.get(vMixUrl);
        const responseLog = `Respuesta de vMix: ${vmixResponse.status} ${vmixResponse.data.trim()}\n`;
        console.log(responseLog);
        logStream.write(responseLog);
        return { success: true, message: vmixResponse.data.trim() };
    } catch (error) {
        const errorLog = `Error al contactar vMix: ${error.message}\n`;
        console.error(errorLog);
        logStream.write(errorLog);
        return { success: false, message: `Error al conectar con vMix: ${error.message}` };
    }
};


app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Endpoint principal para comandos PTZ ---
app.post('/api/ptz', async (req, res) => {
    const { action, value } = req.body;
    const logMessage = `Accin recibida: ${action}` + (value !== undefined ? ` con valor: ${value}` : '') + '\n';
    console.log(logMessage);
    logStream.write(logMessage);


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
        const { action, duration, speed, pauseAfter } = req.body; // Added pauseAfter
        recordedSequence.push({ action, duration, speed, pauseAfter }); // Added pauseAfter
        const logMessage = `Grabado: { action: ${action}, duration: ${duration}, speed: ${speed}, pauseAfter: ${pauseAfter} }\n`; // Updated log
        console.log(logMessage);
        logStream.write(logMessage);
        res.json({ success: true, message: 'Movimiento grabado.' });
    } else {
        res.status(400).json({ success: false, message: 'La grabacin no est activa.' });
    }
});

// New endpoint to update a specific step in the sequence
app.post('/api/sequence/updateStep', (req, res) => {
    const { index, duration, pauseAfter } = req.body; // Added pauseAfter
    if (index >= 0 && index < recordedSequence.length) {
        recordedSequence[index].duration = duration;
        if (pauseAfter !== undefined) { // Update pauseAfter if provided
            recordedSequence[index].pauseAfter = pauseAfter;
        }
        // Save sequence after update
        try {
            fs.writeFileSync(SEQUENCE_FILE, JSON.stringify(recordedSequence, null, 2), 'utf8');
            const saveMsg = `Secuencia actualizada y guardada: Paso ${index + 1}, Duracin: ${duration}ms` + (pauseAfter !== undefined ? `, Pausa: ${pauseAfter}ms` : '') + `\n`;
            console.log(saveMsg);
            logStream.write(saveMsg);
            res.json({ success: true, message: 'Paso de secuencia actualizado.' });
        } catch (error) {
            const errorMsg = `Error al guardar secuencia despus de actualizar: ${error.message}\n`;
            console.error(errorMsg);
            logStream.write(errorMsg);
            res.status(500).json({ success: false, message: 'Error al guardar secuencia.' });
        }
    } else {
        res.status(400).json({ success: false, message: 'ndice de paso invlido.' });
    }
});

app.post('/api/sequence/startRecording', (req, res) => {
    recordedSequence = [];
    recordingActive = true;
    const logMessage = 'Grabacin iniciada. Secuencia borrada.\n';
    console.log(logMessage);
    logStream.write(logMessage);
    res.json({ success: true, message: 'Grabacin iniciada.' });
});

app.post('/api/sequence/stopRecording', (req, res) => {
    recordingActive = false;
    const logMessage = 'Grabacin detenida.\n';
    console.log(logMessage);
    logStream.write(logMessage);

    // Save sequence to file
    try {
        fs.writeFileSync(SEQUENCE_FILE, JSON.stringify(recordedSequence, null, 2), 'utf8');
        const saveMsg = 'Secuencia guardada en sequence.json\n';
        console.log(saveMsg);
        logStream.write(saveMsg);
    } catch (error) {
        const errorMsg = `Error al guardar secuencia: ${error.message}\n`;
        console.error(errorMsg);
        logStream.write(errorMsg);
    }
    res.json({ success: true, message: 'Grabacin detenida.' });
});

// --- Endpoint para la reproduccin de secuencia ---
app.post('/api/sequence/play', async (req, res) => {
    // Hardcoded values for 1% playback speed and calibrated factor
    const playbackSpeed = 0.01; 
    const calibrationFactor = 0.73;

    if (recordedSequence.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay secuencia grabada para reproducir.' });
    }

    const startPlaybackMsg = `Iniciando reproduccin de secuencia a 1% de velocidad con Factor de Correccin: ${calibrationFactor}\n`;
    console.log(startPlaybackMsg);
    logStream.write(startPlaybackMsg);

    await sendVmixCommand('PTZHome'); // Ir a Home antes de la secuencia
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pequea pausa

    for (const step of recordedSequence) {
        let functionName = '';
        const params = {};
        let delayAfterMove = 0;

        // Recalcular la duracin basada en la velocidad de reproduccin y el factor de correccin
        let newDuration;
        if (step.speed <= 0) { // Ensure step.speed is not zero for division
            newDuration = step.duration; // Fallback for invalid recorded speed
        } else {
            const speedRatio = step.speed / playbackSpeed;
            newDuration = step.duration * Math.pow(speedRatio, calibrationFactor);
        }
        
        const logMessage = `Paso ${recordedSequence.indexOf(step) + 1}: Accin: ${step.action}, Dur. Grabada: ${step.duration}ms, Vel. Grabada: ${step.speed}, Vel. Repr: ${playbackSpeed}, Factor: ${calibrationFactor}, Nueva Dur: ${newDuration.toFixed(2)}ms\n`;
        console.log(logMessage);
        logStream.write(logMessage);


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
                const warnMsg = `Accin desconocida en secuencia: ${step.action}\n`;
                console.warn(warnMsg);
                logStream.write(warnMsg);
                continue;
        }

        if (functionName.startsWith('PTZMove') || functionName.startsWith('PTZZoom')) {
            params.Value = playbackSpeed;
            const moveMsg = `  Enviando ${functionName} con velocidad ${params.Value} por ${newDuration.toFixed(2)}ms\n`;
            console.log(moveMsg);
            logStream.write(moveMsg);
            const moveResult = await sendVmixCommand(functionName, params);
            if (!moveResult.success) {
                const errorMsg = `Error al mover ${functionName}: ${moveResult.message}\n`;
                console.error(errorMsg);
                logStream.write(errorMsg);
            }
            await new Promise(resolve => setTimeout(resolve, newDuration));
            const stopMsg = `  Enviando PTZ${functionName.includes('Zoom') ? 'Zoom' : 'Move'}Stop\n`;
            console.log(stopMsg);
            logStream.write(stopMsg);
            const stopResult = await sendVmixCommand(functionName.includes('Zoom') ? 'PTZZoomStop' : 'PTZMoveStop');
            if (!stopResult.success) {
                const errorMsg = `Error al detener ${functionName}: ${stopResult.message}\n`;
                console.error(errorMsg);
                logStream.write(errorMsg);
            }
            // Apply delay only after movement/zoom
            const delayMsg = `  Esperando 100ms antes del siguiente paso.\n`;
            console.log(delayMsg);
            logStream.write(delayMsg);
            await new Promise(resolve => setTimeout(resolve, 100)); // Fixed 100ms delay

            // Handle pauseAfter for movement steps
            if (step.pauseAfter !== undefined && step.pauseAfter > 0) {
                const pauseAfterMsg = `  PAUSA DESPUÉS DE MOVIMIENTO por ${step.pauseAfter}ms\n`;
                console.log(pauseAfterMsg);
                logStream.write(pauseAfterMsg);
                await new Promise(resolve => setTimeout(resolve, step.pauseAfter));
            }
        } else if (step.action === 'pause') { // Handle pause action
            const pauseMsg = `  PAUSA por ${newDuration.toFixed(2)}ms\n`;
            console.log(pauseMsg);
            logStream.write(pauseMsg);
            await new Promise(resolve => setTimeout(resolve, newDuration));
            // No additional delay after a pause, as it's already the duration of the pause
        }
    }

    const completionMsg = 'Reproduccin de secuencia completada.\n';
    console.log(completionMsg);
    logStream.write(completionMsg);
    await sendVmixCommand('PTZHome');
    res.json({ success: true, message: 'Secuencia reproducida.' });
});


app.listen(PORT, () => {
    const listenMsg = `Servidor final escuchando en http://localhost:${PORT}\n`;
    console.log(listenMsg);
    logStream.write(listenMsg);
});