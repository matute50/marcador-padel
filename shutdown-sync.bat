@echo off
echo "Guardando cambios en el repositorio remoto al cerrar..."
:: Cambia al directorio donde se encuentra el script
cd /d "%~dp0"
:: Agrega todos los cambios
git add .
:: Realiza un commit automatico
:: El comando `git diff-index --quiet HEAD` revisa si hay cambios para commitear.
:: El script solo intentará hacer commit y push si hay cambios pendientes.
git diff-index --quiet HEAD || (
    git commit -m "Sync automatico al cierre de sesion" && git push
    echo "Sincronizacion de cierre completada."
) || (
    echo "No hay cambios para sincronizar."
)
:: Mantiene la ventana abierta por 5 segundos para ver el resultado
timeout /t 5 /nobreak