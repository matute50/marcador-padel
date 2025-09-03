@echo off
    2     set REPO_PATH="F:\GEMINI-CLI\GeminiMemoriesRepo"
    3     set MEMORY_FILE="memories.md"
    4
    5     echo Navegando a %REPO_PATH%...
    6     cd /d %REPO_PATH%
    7
    8     echo Obteniendo los últimos cambios de GitHub...
    9     git pull origin main
   10
   11     echo Añadiendo el archivo de memoria...
   12     git add %MEMORY_FILE%
   13
   14     REM Comprueba si hay cambios para commitear
   15     git diff --cached --quiet || (echo Realizando commit de los cambios... && git commit -m
      "Actualización automática de memorias")
   16
   17     echo Subiendo los cambios a GitHub...
   18     git push origin main
   19
   20     echo Sincronización completada.
   21     pause