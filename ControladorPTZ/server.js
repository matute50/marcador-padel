const express = require('express');
const axios = require('axios');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = 3000;
const VMIX_IP = '192.168.10.204';
const VMIX_PORT = '8088';

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para el comando Home
app.get('/api/ptz/home', async (req, res) => {
    console.log('Received request for /api/ptz/home');
    try {
        // Intenta llevar la cámara a Home usando la función PTZGoHome
        const vMixCommand = `http://${VMIX_IP}:${VMIX_PORT}/api/?Function=PTZGoHome&Input=2`;
        console.log(`Sending command to vMix: ${vMixCommand}`);
        try {
            const response = await axios.get(vMixCommand);
            console.log('vMix API Response:', response.data);
            res.json({ success: true, message: 'Comando PTZGoHome enviado a vMix', vMixResponse: response.data });
        } catch (error) {
            console.error('Error sending command to vMix:', error.message);
            res.status(500).json({ success: false, message: 'Error al enviar comando a vMix', error: error.message });
        }
    } catch (error) {
        console.error('Error sending command to vMix:', error.message);
        res.status(500).json({ success: false, message: 'Error al enviar comando a vMix', error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
