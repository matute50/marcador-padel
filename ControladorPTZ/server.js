const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs'); // Import fs module

const app = express();
const PORT = 3000;

const VMIX_API_URL = 'http://172.27.240.1:8088/api';
const SEQUENCE_FILE = path.join(__dirname, 'sequence.json'); // Path to save sequence

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Para parsear bodies de POST en JSON

// Mapa de comandos simples a funciones de la API de vMix
const PTZ_COMMANDS = {
    'up': 'PTZMoveUp',
    'down': 'PTZMoveDown',
    'left': 'PTZMoveLeft',
    'right': 'PTZMoveRight',
    'stop': 'PTZMoveStop',
    'home': 'PTZHome',
    'zoom-in': 'PTZZoomIn',
    'zoom-out': 'PTZZoomOut',
    'zoom-stop': 'PTZZoomStop'
};

// Endpoint de la API para control PTZ
app.post('/api/ptz', async (req, res) => {
    const { command, value } = req.body;
    const functionName = PTZ_COMMANDS[command];

    if (!functionName) {
        return res.status(400).send({ message: 'Comando no válido' });
    }

    let url = ''; // Define url outside try block

    try {
        url = `${VMIX_API_URL}?Function=${functionName}&Input=1`;
        if (['up', 'down', 'left', 'right', 'zoom-in', 'zoom-out'].includes(command) && value !== undefined && value !== null) {
            url += `&Value=${value}`;
        }

        console.log(`Enviando comando a vMix: ${url}`);
        await axios.get(url);

        res.status(200).send({ message: `Comando '${command}' ejecutado.` });
    } catch (error) {
        console.error(`Error al contactar la API de vMix: ${error.message}`, error); // Log full error object
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send({
            message: `Error al conectar con vMix: ${error.message || 'Error desconocido'}. Asegúrate de que vMix esté corriendo y la API Web esté habilitada en la configuración.`,
            debugUrl: url || 'URL no disponible' // Ensure debugUrl is always sent
        });
    }
});

// Nuevo endpoint para guardar la secuencia grabada
app.post('/api/record-sequence', (req, res) => {
    const sequence = req.body.sequence;
    if (!sequence) {
        return res.status(400).send({ message: 'Secuencia no proporcionada.' });
    }

    fs.writeFile(SEQUENCE_FILE, JSON.stringify(sequence, null, 2), (err) => {
        if (err) {
            console.error('ERROR DE ESCRITURA DE SECUENCIA:', err); // More prominent error log
            return res.status(500).send({ message: 'Error al guardar la secuencia.' });
        }
        console.log('Secuencia guardada en:', SEQUENCE_FILE);
        res.status(200).send({ message: 'Secuencia guardada con éxito.' });
    });
});

// Nuevo endpoint para cargar la secuencia grabada
app.get('/api/load-sequence', (req, res) => {
    fs.readFile(SEQUENCE_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') { // File not found
                return res.status(200).send([]); // Send empty array if no sequence saved yet
            }
            console.error('Error al leer la secuencia:', err);
            return res.status(500).send({ message: 'Error al cargar la secuencia.' });
        }
        try {
            const sequence = JSON.parse(data);
            res.status(200).send(sequence);
        } catch (parseErr) {
            console.error('Error al parsear la secuencia:', parseErr);
            res.status(500).send({ message: 'Error al parsear la secuencia.' });
        }
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

// Nuevo endpoint para probar la conexión con vMix
app.get('/test-vmix-connection', async (req, res) => {
    try {
        const testUrl = `${VMIX_API_URL}`; // Just the base API URL
        console.log(`Intentando conectar a vMix API para prueba: ${testUrl}`);
        const response = await axios.get(testUrl);
        console.log('Conexión a vMix API exitosa. Estado:', response.status);
        res.status(200).send({ message: 'Conexión a vMix API exitosa.', status: response.status, data: response.data });
    } catch (error) {
        console.error('Error en la prueba de conexión a vMix API:', error.message);
        res.status(500).send({ message: 'Error en la prueba de conexión a vMix API.', error: error.message });
    }
});