const express = require('express');
// Las dependencias para puppeteer y rss se usarán más adelante
// const puppeteer = require('puppeteer');
// const RSS = require('rss');

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint raíz para confirmar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor de feed RSS para Saladillo Vivo está funcionando.');
});

// Endpoint para generar el feed RSS
// TODO: Implementar la lógica de scraping y generación de RSS aquí
app.get('/feed', async (req, res) => {
  // Por ahora, solo enviamos un mensaje de marcador de posición
  res.send('Endpoint del feed. Lógica de scraping y RSS pendiente de implementación.');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
