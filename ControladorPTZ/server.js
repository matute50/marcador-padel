const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;
const VMIX_IP = '192.168.10.204';
const VMIX_PORT = '8088';
const VMIX_INPUT = '1';

let currentPanTiltSpeed = 0.5; // Default speed (0.5 for 50% of max)
let currentZoomSpeed = 0.5;   // Default speed

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ptz', async (req, res) => {
    const { action, value } = req.body;
    console.log(`Accin recibida: ${action}` + (value !== undefined ? ` con valor: ${value}` : ''));

    let functionName = '';
    const params = { Input: VMIX_INPUT };

    // Lgica final con los comandos que s funcionan
    switch (action) {
        case 'home':
            functionName = 'PTZHome';
            break;
        case 'moveStop':
            functionName = 'PTZMoveStop';
            break;
        case 'panLeft':
            functionName = 'PTZMoveLeft';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'panRight':
            functionName = 'PTZMoveRight';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'tiltUp':
            functionName = 'PTZMoveUp';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'tiltDown':
            functionName = 'PTZMoveDown';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'zoomIn':
            functionName = 'PTZZoomIn';
            params.Speed = currentZoomSpeed;
            break;
        case 'zoomOut':
            functionName = 'PTZZoomOut';
            params.Speed = currentZoomSpeed;
            break;
        case 'zoomStop':
            functionName = 'PTZZoomStop';
            break;
        
        // Implementacin de diagonales con PTZMove
        case 'moveUpLeft':
            functionName = 'PTZMoveUpLeft';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'moveUpRight':
            functionName = 'PTZMoveUpRight';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'moveDownLeft':
            functionName = 'PTZMoveDownLeft';
            params.Speed = currentPanTiltSpeed;
            break;
        case 'moveDownRight':
            functionName = 'PTZMoveDownRight';
            params.Speed = currentPanTiltSpeed;
            break;

        case 'setPanTiltSpeed':
            currentPanTiltSpeed = parseFloat((parseInt(value) / 100).toFixed(2));
            return res.json({ success: true, message: `Velocidad Pan/Tilt establecida a ${value}%` });
        case 'setZoomSpeed':
            currentZoomSpeed = parseFloat((parseInt(value) / 100).toFixed(2));
            return res.json({ success: true, message: `Velocidad Zoom establecida a ${value}%` });

        default:
            return res.status(400).json({ success: false, message: 'Accin no vlida' });
    }

    const query = new URLSearchParams({ Function: functionName, ...params }).toString();
    const vMixUrl = `http://${VMIX_IP}:${VMIX_PORT}/api/?${query}`;
    
    console.log('Constructed vMix URL:', vMixUrl);
    console.log(`Enviando a vMix: ${vMixUrl}`);

    try {
        const vmixResponse = await axios.get(vMixUrl);
        console.log('Respuesta de vMix:', vmixResponse.status, vmixResponse.data.trim());
        res.json({ success: true, message: `Accin [${action}] enviada` });
    } catch (error) {
        console.error('Error al contactar vMix:', error.message);
        res.status(500).json({ success: false, message: 'Error al conectar con vMix' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor final escuchando en http://localhost:${PORT}`);
});
