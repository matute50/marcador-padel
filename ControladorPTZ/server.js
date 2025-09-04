const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;
const VMIX_IP = '192.168.10.204';
const VMIX_PORT = '8088';
const VMIX_INPUT = '1';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/ptz', async (req, res) => {
    const { action } = req.body;
    console.log(`Accin recibida: ${action}`);

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
            break;
        case 'panRight':
            functionName = 'PTZMoveRight';
            break;
        case 'tiltUp':
            functionName = 'PTZMoveUp';
            break;
        case 'tiltDown':
            functionName = 'PTZMoveDown';
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
            break;
        case 'moveUpRight':
            functionName = 'PTZMoveUpRight';
            break;
        case 'moveDownLeft':
            functionName = 'PTZMoveDownLeft';
            break;
        case 'moveDownRight':
            functionName = 'PTZMoveDownRight';
            break;

        default:
            return res.status(400).json({ success: false, message: 'Accin no vlida' });
    }

    const query = new URLSearchParams({ Function: functionName, ...params }).toString();
    const vMixUrl = `http://${VMIX_IP}:${VMIX_PORT}/api/?${query}`;
    
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
