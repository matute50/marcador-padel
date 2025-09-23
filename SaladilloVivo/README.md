# Proyecto: Automatización de Publicaciones "Saladillo Vivo"

## Objetivo

El objetivo de este proyecto es crear un sistema que automatice la publicación de noticias desde el sitio web `saladillovivo.com.ar` a las redes sociales (Facebook e Instagram).

## Estrategia

Dado que `saladillovivo.com.ar` carga su contenido dinámicamente, la estrategia implementada es la siguiente:

1.  **Scraper con Puppeteer:** Un script de Node.js (`scraper.js`) utiliza la librería Puppeteer para lanzar un navegador en segundo plano, cargar la página y extraer la información del último artículo y del último video.
2.  **Detección de Cambios:** El script principal (`index.js`) ejecuta el scraper, compara los resultados con el último contenido procesado (guardado localmente) y detecta si hay novedades.
3.  **Integración con Webhooks:** Si se detecta un nuevo artículo o video, el sistema envía los datos (título, URL, imagen) a un webhook específico en Make.com.
4.  **Publicación en Redes Sociales:** Dos escenarios en Make.com reciben estos datos y se encargan de formatearlos y publicarlos automáticamente en las redes sociales correspondientes.

## Estado Actual

- **Funcional:** El sistema es completamente funcional. Detecta nuevo contenido (artículos y videos) y lo envía a Make.com para su publicación.
- **Próximo Paso:** Refinar y robustecer el código existente.

**Versión del Documento:** 2.0