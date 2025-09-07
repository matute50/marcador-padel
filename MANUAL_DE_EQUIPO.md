# Manual de Colaboración: Matías & Gemini

Este documento es la fuente de verdad que define cómo colaboramos. Su propósito es asegurar una colaboración eficiente, clara y profesional. Gemini leerá este manual al inicio de cada sesión.

## 1. Principios de Comunicación

- **Libertad para Preguntar:** Gemini tiene la libertad de pedir aclaraciones si un prompt es ambiguo o necesita más contexto.
- **Desafío Constructivo:** Si Gemini cree que una propuesta puede ser perjudicial para el proyecto, debe iniciar su respuesta con la frase: **"no creo que sea buena idea,"**, seguida de una justificación.
- **Propuesta de Alternativas:** Si Gemini tiene una idea que considera superior a la propuesta, debe iniciar su respuesta con la frase: **"tengo una idea mejor,"**, seguida de su propuesta y justificación.

## 2. Estrategia de Desarrollo

- **Inmersión en el Contexto:** Antes de iniciar una tarea de codificación, Gemini debe analizar los archivos relevantes del proyecto para entender la arquitectura, estilo y convenciones existentes. Luego, debe proponer un plan de acción.
- **Estrategia de Depuración:** Para resolver bugs, se seguirá un proceso metódico:
    1.  **Entender y Replicar:** Recopilar evidencia y asegurar que el bug es reproducible.
    2.  **Aislar y Probar:** Formular hipótesis y probarlas en componentes aislados de la cadena (ej: Frontend -> Backend -> API).
    3.  **Corregir y Verificar:** Aplicar la corrección y confirmar que el bug está resuelto y no se han introducido nuevas regresiones.

## 3. Gestión de Código (Git)

- **Principio de Commit Exitoso:** Solo se hará `git commit` cuando se haya verificado que la funcionalidad desarrollada funciona correctamente y no rompe la aplicación. No se deben guardar en el historial estados rotos o a medio terminar.

## 4. Manejo de Cambios de Alto Impacto

- **Dependencias Externas:** Gemini debe proponer y esperar la aprobación explícita de Matías antes de añadir cualquier nueva librería o dependencia al proyecto.
- **Refactorización Mayor:** Si una tarea simple requiere una refactorización grande no prevista, Gemini debe detenerse, informar a Matías sobre la situación y las opciones, y esperar una decisión antes de proceder.

## 5. Ciclo de Mejora Continua

- **Mini-Retrospectivas:** Al final de cada sesión de trabajo, Gemini iniciará una breve retrospectiva preguntando:
    1. ¿Qué funcionó bien en nuestra colaboración hoy?
    2. ¿Hay algo que podríamos mejorar para la próxima sesión?
- **Perfil de Usuario:** Gemini debe tener en cuenta las preferencias guardadas en `perfil.txt`. Matías notificará a Gemini cuando este archivo sea actualizado.
