const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises; // Usamos la versión de promesas de fs

const { parseString } = require('xml2js');
const app = express();
const PORT = 3000;

const VMIX_API_URL = 'http://127.0.0.1:8088/api';
const SEQUENCES_DIR = path.join(__dirname, 'sequences');

// --- Middleware ---
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// --- Almacenamiento de Secuencia Activa ---
let activeSequence = [];

// --- Inicialización ---
// Nos aseguramos de que el directorio de secuencias exista
const init = async () => {
    try {
        await fs.access(SEQUENCES_DIR);
    } catch (error) {
        console.log('Creando directorio de secuencias...');
        await fs.mkdir(SEQUENCES_DIR);
    }
};
init();

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

// --- Función Auxiliar para vMix ---
const sendVmixCommand = async (functionName, inputKey = null) => {
    if (!functionName) {
        console.error('Intento de enviar un comando a vMix sin functionName.');
        return;
    }
    try {
        // Si no se provee una key, se usa el Input 1 por defecto (cámara principal)
        const input = inputKey || '1';
        const url = `${VMIX_API_URL}?Function=${functionName}&Input=${input}`;
        console.log(`Enviando comando a vMix: ${url}`);
        await axios.get(url);
    } catch (error) {
        console.error(`Error al contactar la API de vMix: ${error.message}`);
        // No se relanza el error para no detener el flujo principal
    }
};

// --- Endpoints para GESTIÓN DE SECUENCIAS ---

// LISTAR todas las secuencias guardadas
app.get('/api/sequences', async (req, res) => {
    try {
        const files = await fs.readdir(SEQUENCES_DIR);
        const jsonFiles = files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''));
        res.status(200).json(jsonFiles);
    } catch (error) {
        console.error('Error al listar secuencias:', error);
        res.status(500).send({ message: 'Error al leer el directorio de secuencias.' });
    }
});

// CARGAR una secuencia por nombre y establecerla como activa
app.get('/api/sequences/:name', async (req, res) => {
    const { name } = req.params;
    // Sanitización básica del nombre del archivo
    const fileName = name.replace(/[^a-z0-9_-]/gi, '_') + '.json';
    const filePath = path.join(SEQUENCES_DIR, fileName);

    try {
        const data = await fs.readFile(filePath, 'utf8');
        activeSequence = JSON.parse(data);
        console.log(`Secuencia '${name}' cargada y establecida como activa.`);
        res.status(200).json(activeSequence);
    } catch (error) {
        console.error(`Error al cargar la secuencia '${name}':`, error);
        res.status(404).send({ message: `No se encontró la secuencia '${name}'.` });
    }
});

// GUARDAR la secuencia activa a un archivo
app.post('/api/sequences/:name', async (req, res) => {
    const { name } = req.params;
    const { sequence } = req.body;

    if (!sequence) {
        return res.status(400).send({ message: 'No se proporcionó una secuencia para guardar.' });
    }

    const fileName = name.replace(/[^a-z0-9_-]/gi, '_') + '.json';
    const filePath = path.join(SEQUENCES_DIR, fileName);

    try {
        await fs.writeFile(filePath, JSON.stringify(sequence, null, 2));
        console.log(`Secuencia guardada como '${fileName}'`);
        res.status(200).send({ message: `Secuencia guardada como '${name}'.` });
    } catch (error) {
        console.error(`Error al guardar la secuencia '${name}':`, error);
        res.status(500).send({ message: 'Error al guardar el archivo de secuencia.' });
    }
});


// --- Endpoints para CONTROL PTZ y GRABACIÓN en memoria ---

app.post('/api/sequence/start', async (req, res) => {
    console.log('Inicio de grabación solicitado. Moviendo a Home...');
    await sendVmixCommand(PTZ_COMMANDS['home']);
    activeSequence = []; // Limpia la secuencia activa en memoria
    console.log('Secuencia activa reiniciada, listo para grabar.');
    res.status(200).send({ message: 'Cámara en Home. Grabación iniciada.' });
});

app.post('/api/sequence/record', (req, res) => {
    const { command, time } = req.body;
    if (command && typeof time === 'number') {
        activeSequence.push({ command, time });
        // No logueamos cada comando para no saturar la consola
        res.status(200).send({ message: 'Comando grabado.' });
    } else {
        res.status(400).send({ message: 'Datos de comando inválidos.' });
    }
});

// Devuelve la secuencia activa en memoria
app.get('/api/sequence', (req, res) => {
    res.status(200).json(activeSequence);
});

// Endpoint de la API para control PTZ
app.post('/api/ptz', async (req, res) => {
    const { command } = req.body;
    const functionName = PTZ_COMMANDS[command];

    if (!functionName) {
        return res.status(400).send({ message: 'Comando no válido' });
    }

    await sendVmixCommand(functionName);
    res.status(200).send({ message: `Comando '${command}' ejecutado.` });
});

// --- ENDPOINT PARA CREAR SNAPSHOTS (INPUTS VIRTUALES) ---
app.post('/api/ptz/create-snapshot', async (req, res) => {
    console.log('\nRecibida petición para crear un Snapshot (Input Virtual)...');
    await sendVmixCommand('PTZCreateVirtualInput');
    console.log('Comando PTZCreateVirtualInput enviado.');
    // NOTA: Por ahora no devolvemos la clave del nuevo input. Lo haremos más adelante.
    res.status(200).send({ message: 'Comando PTZCreateVirtualInput enviado.' });
});

// Devuelve la información del último input en la lista de vMix
app.get('/api/ptz/last-created-input', async (req, res) => {
    try {
        const vmixResponse = await axios.get(VMIX_API_URL);
        
        parseString(vmixResponse.data, (err, result) => {
            if (err) {
                console.error("Error al parsear XML:", err);
                return res.status(500).send({ message: 'Error al procesar la respuesta de vMix.' });
            }

            const allInputs = result.vmix.inputs[0].input;
            if (!allInputs || allInputs.length === 0) {
                return res.status(404).send({ message: 'No se encontraron inputs en vMix.' });
            }

            // Asumimos que el último input en la lista es el que acabamos de crear.
            const lastInput = allInputs[allInputs.length - 1];

            const info = {
                key: lastInput.$.key,
                title: lastInput.$.title,
                number: parseInt(lastInput.$.number, 10)
            };

            console.log(`Último input detectado: ${info.title} (Key: ${info.key})`);
            res.status(200).json(info);
        });
    } catch (error) {
        console.error('Error al obtener el XML de vMix:', error.message);
        res.status(500).send({ message: 'Error al contactar la API de vMix.' });
    }
});

// Elimina una lista de inputs virtuales
app.post('/api/ptz/remove-inputs', async (req, res) => {
    const { keys } = req.body;
    if (!keys || !Array.isArray(keys)) {
        return res.status(400).send({ message: 'Se requiere un array de \'keys\'.' });
    }

    console.log(`Recibida petición para eliminar ${keys.length} inputs...`);
    for (const key of keys) {
        await sendVmixCommand('RemoveInput', key);
        await new Promise(r => setTimeout(r, 50)); // Pequeña pausa entre comandos
    }
    console.log('Limpieza de inputs completada.');
    res.status(200).send({ message: 'Inputs eliminados.' });
});

// Endpoint genérico para ejecutar funciones de vMix
app.get('/api/ptz/function', async (req, res) => {
    const { name, input, duration } = req.query;

    if (!name || !input) {
        return res.status(400).send({ message: 'Los parámetros "name" e "input" son requeridos.' });
    }

    let url = `${VMIX_API_URL}?Function=${name}&Input=${input}`;
    if (duration) {
        url += `&Duration=${duration}`;
    }

    try {
        console.log(`Ejecutando función genérica: ${url}`);
        await axios.get(url);
        res.status(200).send({ message: 'Comando ejecutado.' });
    } catch (error) {
        console.error(`Error al ejecutar la función '${name}':`, error.message);
        res.status(500).send({ message: 'Error al contactar la API de vMix.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
