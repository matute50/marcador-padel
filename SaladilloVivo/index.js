const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const path = require('path');
const axios = require('axios'); // Importar axios
require('dotenv').config(); // Cargar variables de entorno

const ARTICLE_STATE_FILE = path.join(__dirname, 'last_article.txt');
const VIDEO_STATE_FILE = path.join(__dirname, 'last_video.txt');
const SCRAPER_SCRIPT = path.join(__dirname, 'scraper.js');

// URLs de los Webhooks cargadas desde .env
const { ARTICLE_WEBHOOK_URL, VIDEO_WEBHOOK_URL } = process.env;

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

  // --- Procesar Contenido ---
  await processContent({
    contentType: 'Artículo',
    contentData: content.article,
    lastIdentifier: lastArticleHeadline,
    webhookUrl: ARTICLE_WEBHOOK_URL,
    stateFile: ARTICLE_STATE_FILE,
    identifierKey: 'headline',
    titleKey: 'headline'
  });

  await processContent({
    contentType: 'Video',
    contentData: content.video,
    lastIdentifier: lastVideoId,
    webhookUrl: VIDEO_WEBHOOK_URL,
    stateFile: VIDEO_STATE_FILE,
    identifierKey: 'id',
    titleKey: 'title'
  });

  console.log('\nProceso de verificación finalizado.');
}

/**
 * Procesa un tipo de contenido (artículo o video), verifica si es nuevo,
 * lo envía a un webhook y actualiza su estado.
 * @param {object} options - Opciones de configuración para el procesamiento.
 * @param {string} options.contentType - Tipo de contenido (e.g., 'Artículo').
 * @param {object} options.contentData - Datos del contenido actual.
 * @param {string} options.lastIdentifier - Último identificador guardado.
 * @param {string} options.webhookUrl - URL del webhook para enviar los datos.
 * @param {string} options.stateFile - Ruta al archivo de estado.
 * @param {string} options.identifierKey - Key para obtener el ID único del contenido.
 * @param {string} options.titleKey - Key para obtener el título del contenido para logging.
 */
async function processContent({ contentType, contentData, lastIdentifier, webhookUrl, stateFile, identifierKey, titleKey }) {
  if (!contentData || !contentData[identifierKey]) {
    console.log(`\nNo se pudo obtener datos del ${contentType.toLowerCase()}.`);
    return;
  }

  const currentIdentifier = contentData[identifierKey];
  const currentTitle = contentData[titleKey];

  console.log(`\n${contentType} actual: "${currentTitle}"`);

  if (currentIdentifier !== lastIdentifier) {
    console.log(`--- ¡NUEVO ${contentType.toUpperCase()} DETECTADO! ---`);
    console.log('DATOS:', contentData);

    if (!webhookUrl) {
      console.error(`Error: La URL del webhook para ${contentType} no está configurada en el archivo .env`);
      return;
    }
    
    try {
      await axios.post(webhookUrl, contentData);
      console.log(`Webhook de ${contentType.toLowerCase()} enviado con éxito a Make.com.`);
    } catch (axiosError) {
      console.error(`Error al enviar webhook de ${contentType.toLowerCase()}:`, axiosError.message);
    }

    await fs.writeFile(stateFile, currentIdentifier);
    console.log(`Estado de ${contentType.toLowerCase()} actualizado.`);
  } else {
    console.log(`El ${contentType.toLowerCase()} no es nuevo.`);
  }
}

main().catch(error => {
  console.error('Ha ocurrido un error en el proceso principal:', error);
  process.exit(1);
});