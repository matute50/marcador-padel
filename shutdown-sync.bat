@echo off
echo Guardando el estado del espacio de trabajo en GitHub...
cd /d F:\GEMINI-CLI
git add .
git commit -m "Sync automatico: %date% %time%"
git push origin main
echo.
echo Guardado completado.
pause