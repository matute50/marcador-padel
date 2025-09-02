// ControladorPTZ/index.js
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// Middleware para servir archivos estáticos (HTML, CSS, JS del frontend)
app.use(express.static('public'));

// Endpoint para manejar los comandos de la cámara PTZ
app.get('/ptz', async (req, res) => {
  const { command, input, vmixIp, vmixPort, value1, value2 } = req.query;

  if (!command || !input || !vmixIp || !vmixPort) {
    return res.status(400).send('Faltan parámetros requeridos (command, input, vmixIp, vmixPort)');
  }

  // Construir la URL para la API de vMix
  const params = new URLSearchParams({
    Function: command,
    Input: input,
  });

  // Añadir value1 y value2 si existen (para comandos como PTZMove)
  if (value1) params.append('Value', value1);
  if (value2) params.append('Value2', value2);

  const vmixApiUrl = `http://${vmixIp}:${vmixPort}/api/?${params.toString()}`;
  console.log(`Enviando comando a vMix: ${vmixApiUrl}`);

  try {
    const vmixResponse = await fetch(vmixApiUrl);
    // vMix usualmente responde con 200 OK y texto plano, no es necesario leer el body si no hay errores.
    if (vmixResponse.ok) {
      res.send(`Comando '${command}' enviado a vMix con éxito.`);
    } else {
      const errorText = await vmixResponse.text();
      res.status(vmixResponse.status).send(`Error de vMix: ${errorText}`);
    }
  } catch (error) {
    console.error('Error al contactar con vMix:', error);
    res.status(500).send(`No se pudo conectar con vMix en ${vmixIp}:${vmixPort}. Verifica la IP, el puerto y que vMix esté corriendo.`);
  }
});

app.listen(port, () => {
  console.log(`Servidor de Control PTZ escuchando en http://localhost:${port}`);
});
