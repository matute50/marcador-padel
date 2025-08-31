# Proyecto: Automatización de Publicaciones "Saladillo Vivo"

## Objetivo

El objetivo de este proyecto es crear un sistema que automatice la publicación de noticias desde el sitio web `saladillovivo.com.ar` a las redes sociales (Facebook e Instagram).

## Estrategia

Dado que `saladillovivo.com.ar` no posee un feed RSS nativo (carga el contenido dinámicamente con JavaScript), la estrategia es la siguiente:

1.  **Crear un Feed RSS Personalizado:** Desarrollar un pequeño servidor web utilizando Node.js y Express.
2.  **Endpoint `/feed`:** Este servidor expondrá un endpoint (ej. `http://localhost:3000/feed`) que, al ser consultado, generará un archivo XML con formato RSS conteniendo las últimas noticias del sitio.
3.  **Integración con IFTTT:** Se utilizará el feed RSS generado como "trigger" en IFTTT (o un servicio similar) para que, cada vez que haya una nueva noticia en el feed, se publique automáticamente en las redes sociales configuradas.

## Estado Actual

- **Infraestructura:** Se ha creado la estructura de carpetas del proyecto y se ha inicializado un repositorio de Git.
- **Próximo Paso:** Implementar el servidor de Node.js para generar el feed RSS.
