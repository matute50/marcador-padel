const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const axios = require('axios'); // Importar axios

const ARTICLE_STATE_FILE = path.join(__dirname, 'last_article.txt');
const VIDEO_STATE_FILE = path.join(__dirname, 'last_video.txt');
const SCRAPER_SCRIPT = path.join(__dirname, 'scraper.js');

// URLs de los Webhooks de Make.com (¡REEMPLAZAR CON LAS REALES!)
const ARTICLE_WEBHOOK_URL = 'https://hook.us2.make.com/u0316xmmpxw28ith0ncuv39nrf9mnycn';
const VIDEO_WEBHOOK_URL = 'https://hook.us2.make.com/4kdpty5wvye72sjef3m7gmvfc1fht2vx';

async function main() {
  console.log('Iniciando proceso de verificación de contenido...');

  // --- Leer estados anteriores ---
  let lastArticleHeadline = null;
  let lastVideoId = null;

  try {
    lastArticleHeadline = await fs.readFile(ARTICLE_STATE_FILE, 'utf-8');
    console.log(`Último artículo guardado: "${lastArticleHeadline}"`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No se encontró archivo de estado para artículos.');
    } else {
      throw error;
    }
  }

  try {
    lastVideoId = await fs.readFile(VIDEO_STATE_FILE, 'utf-8');
    console.log(`Último video guardado: "${lastVideoId}"`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('No se encontró archivo de estado para videos.');
    } else {
      throw error;
    }
  }

  // --- Ejecutar Scraper ---
  console.log('\nEjecutando scraper para obtener contenido actual...');
  const { stdout, stderr } = await exec(`node ${SCRAPER_SCRIPT}`);
  if (stderr) throw new Error(`Error en scraper.js: ${stderr}`);
  const content = JSON.parse(stdout);

  // --- Procesar Artículo ---
  if (content.article && content.article.headline) {
    console.log(`\nArtículo actual: "${content.article.headline}"`);
    if (content.article.headline !== lastArticleHeadline) {
      console.log('--- ¡NUEVO ARTÍCULO DETECTADO! ---');
      console.log('DATOS:', content.article);
      
      try {
        await axios.post(ARTICLE_WEBHOOK_URL, content.article);
        console.log('Webhook de artículo enviado con éxito a Make.com.');
      } catch (axiosError) {
        console.error('Error al enviar webhook de artículo:', axiosError.message);
      }

      await fs.writeFile(ARTICLE_STATE_FILE, content.article.headline);
      console.log('Estado de artículo actualizado.');
    } else {
      console.log('El artículo no es nuevo.');
    }
  } else {
    console.log('No se pudo obtener datos del artículo.');
  }

  // --- Procesar Video ---
  if (content.video && content.video.id) {
    console.log(`\nVideo actual: "${content.video.title}" (ID: ${content.video.id})`);
    if (content.video.id !== lastVideoId) {
      console.log('--- ¡NUEVO VIDEO DETECTADO! ---');
      console.log('DATOS:', content.video);
      
      try {
        await axios.post(VIDEO_WEBHOOK_URL, content.video);
        console.log('Webhook de video enviado con éxito a Make.com.');
      } catch (axiosError) {
        console.error('Error al enviar webhook de video:', axiosError.message);
      }

      await fs.writeFile(VIDEO_STATE_FILE, content.video.id);
      console.log('Estado de video actualizado.');
    } else {
      console.log('El video no es nuevo.');
    }
  
  } else {
    console.log('No se pudo obtener datos del video.');
  }

  console.log('\nProceso de verificación finalizado.');
}

main().catch(error => {
  console.error('Ha ocurrido un error en el proceso principal:', error);
  process.exit(1);
});