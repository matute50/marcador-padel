# Manifiesto del Proyecto: SaladilloVivo

*Este documento sirve como la fuente única de verdad para el proyecto, alineando la visión, la tecnología y las decisiones clave.*

## 1. Visión y Objetivos Principales

El objetivo de este proyecto es crear un sistema que automatice la publicación de noticias desde el sitio web `saladillovivo.com.ar` a las redes sociales (Facebook e Instagram).

## 2. Stack Tecnológico

*Stack identificado a partir del `package.json`.*

- **Entorno:** Node.js
- **Framework Web:** Express
- **Integraciones Clave:**
  - `Supabase Webhooks`: Para la detección automática de nuevas noticias.
  - `Make.com`: Plataforma de automatización para orquestar el flujo.

## 3. Registro de Decisiones Clave

*(A completar a medida que avance el proyecto. Aquí anotaremos las decisiones importantes y su porqué).*

- **23/09/2025**: Se cambió la estrategia de "Detección de Novedades" de scraping (Node.js/Puppeteer) a un enfoque basado en webhooks de Supabase integrados con Make.com. Justificación: Mayor eficiencia, robustez y menor mantenimiento al aprovechar las capacidades nativas de Supabase.

- **[Fecha]**: [Decisión] - [Justificación].

## 4. Roadmap de Alto Nivel

*Definido por Matías y Gemini.*

- [x] **Fase 1: Detección de Novedades.** Nuestro sistema necesita una forma de "enterarse" automáticamente cada vez que se publica/edita una noticia o se sube un video en la web. (Implementado vía Supabase Webhooks a Make.com)
- [ ] **Fase 2: Extracción de Contenido.** Una vez que el sistema sabe que hay algo nuevo, necesita "leer" la información relevante para el posteo (el título, la imagen o miniatura del video, y el enlace).
- [ ] **Fase 3: Publicación Automática.** Con la información ya extraída, el sistema debe ser capaz de formatearla y publicarla como un nuevo post en las redes sociales definidas (Facebook, etc.).

## 5. Definición de "Hecho" (Definition of Done)

Una tarea o funcionalidad se considera "hecha" cuando cumple con todos los siguientes criterios:

- El código está completamente implementado y cumple los requisitos de la tarea.
- La aplicación funciona correctamente con los nuevos cambios.
- Se han añadido o actualizado los tests correspondientes (si aplica).
- Todas las verificaciones de calidad de código (linters) pasan sin errores.
- El cambio ha sido guardado en el repositorio con un commit exitoso.
