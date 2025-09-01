const express = require('express');
const puppeteer = require('puppeteer');
const RSS = require('rss');

const app = express();
const PORT = process.env.PORT || 3000;

// URL del sitio a scrapear
const SITE_URL = 'https://saladillovivo.com.ar/';

// Endpoint raíz para confirmar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor de feed RSS para Saladillo Vivo está funcionando.');
});

// --- NUEVO ENDPOINT DE DEPURACIÓN ---
app.get('/debug-html', async (req, res) => {
  console.log('Solicitud recibida en /debug-html. Devolviendo HTML de la página...');
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
    const pageContent = await page.content();
    await browser.close();
    res.send(pageContent);
  } catch (error) {
    console.error('Error durante la captura de HTML:', error);
    res.status(500).send('Error al capturar el HTML.');
  }
});

// Endpoint para generar el feed RSS
app.get('/feed', async (req, res) => {
  console.log('Solicitud recibida en /feed. Iniciando scraping...');

  try {
    // 1. INICIAR PUPPETEER Y NAVEGAR A LA PÁGINA
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(SITE_URL, { waitUntil: 'networkidle2' });
    console.log('Página cargada en Puppeteer.');

    // 2. EXTRAER LA INFORMACIÓN DE LAS NOTICIAS
    // Se ejecuta este código dentro del navegador para acceder al DOM
    const articles = await page.evaluate(() => {
      // Selector de los contenedores de cada noticia.
      // Este es el paso más frágil, depende de la estructura del HTML del sitio.
      const articleElements = document.querySelectorAll('article.post');
      
      const articlesData = [];
      articleElements.forEach(article => {
        const titleElement = article.querySelector('h2.entry-title a');
        const descriptionElement = article.querySelector('div.entry-summary');

        if (titleElement && descriptionElement) {
          articlesData.push({
            title: titleElement.innerText,
            url: titleElement.href,
            description: descriptionElement.innerText.trim(),
          });
        }
      });
      return articlesData;
    });
    console.log(`Se encontraron ${articles.length} artículos.`);

    await browser.close();

    // 3. CREAR EL FEED RSS
    const feed = new RSS({
      title: 'Saladillo Vivo - Feed no oficial',
      description: 'Feed RSS generado automáticamente de las últimas noticias de saladillovivo.com.ar',
      feed_url: `http://localhost:${PORT}/feed`,
      site_url: SITE_URL,
      language: 'es',
    });

    // Agrega cada artículo extraído al feed
    articles.forEach(article => {
      feed.item({
        title: article.title,
        description: article.description,
        url: article.url,
        guid: article.url, // Usamos la URL como un identificador único
        date: new Date(), // El sitio no provee fecha fácil de scrapear, usamos la fecha actual
      });
    });

    // 4. ENVIAR LA RESPUESTA
    res.set('Content-Type', 'application/rss+xml');
    res.send(feed.xml());
    console.log('Feed RSS generado y enviado con éxito.');

  } catch (error) {
    console.error('Error durante el scraping o la generación del feed:', error);
    res.status(500).send('Error al generar el feed RSS. Revisa la consola del servidor.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
