@echo off
echo "Sincronizando con el repositorio remoto al iniciar..."
:: Cambia al directorio donde se encuentra el script
cd /d "%~dp0"
:: Ejecuta git pull para traer los cambios
git pull
echo "Sincronizacion de inicio completada."
:: Mantiene la ventana abierta por 5 segundos para ver el resultado
timeout /t 5 /nobreak