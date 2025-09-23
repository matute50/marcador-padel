const puppeteer = require('puppeteer');

async function getLatestContent() {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.goto('https://saladillovivo.vercel.app/');

  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    const loadingScreen = document.querySelector('#loading-screen');
    return root && root.children.length > 0 && !loadingScreen;
  }, { timeout: 10000 });

  await new Promise(r => setTimeout(r, 5000));

  const data = await page.evaluate(() => {
    // Extracción de datos del artículo
    const article = {
      headline: document.querySelector('section[aria-label="Sección de noticias"] article h1')?.textContent.trim(),
      articleUrl: document.querySelector('link[rel="canonical"]')?.href,
      imageUrl: document.querySelector('section[aria-label="Sección de noticias"] article img')?.src,
    };

    // Extracción de datos del video
    let video = null;
    const novedadesH2 = Array.from(document.querySelectorAll('h2')).find(h2 => h2.textContent === 'Novedades');
    if (novedadesH2) {
      const blockContainer = novedadesH2.parentElement.parentElement;
      const activeSlide = blockContainer.querySelector('.swiper-slide-active');
      if (activeSlide) {
        const videoElement = activeSlide.querySelector('[data-video-id]');
        const imgElement = activeSlide.querySelector('img');
        const videoId = videoElement?.dataset.videoId;
        video = {
          id: videoId,
          title: imgElement?.alt,
          imageUrl: imgElement?.src,
          videoUrl: videoId ? `https://www.saladillovivo.com.ar/video/${videoId}` : null
        };
      }
    }

    return { article, video };
  });
  
  await browser.close();
  
  return data;
}

function runWithTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Script superó el tiempo de espera de ${ms} ms`));
    }, ms);

    promise.then(
      (res) => {
        clearTimeout(timeoutId);
        resolve(res);
      },
      (err) => {
        clearTimeout(timeoutId);
        reject(err);
      }
    );
  });
}

runWithTimeout(getLatestContent(), 30000)
  .then(data => {
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
