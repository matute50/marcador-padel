@echo off
setlocal

:: Define el archivo de log en el mismo directorio del script
set LOGFILE=%~dp0startup-sync.log

:: Redirige toda la salida a un archivo de log con fecha y hora
echo. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%
echo [%date% %time%] Iniciando script de sincronizacion. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%

:: Cambia al directorio donde se encuentra el script
cd /d "%~dp0" >> %LOGFILE% 2>&1

echo [%date% %time%] Ejecutando 'git pull'... >> %LOGFILE%
:: Ejecuta git pull y guarda la salida en el log
git pull >> %LOGFILE% 2>&1

:: Captura el codigo de error de git pull
if %errorlevel% neq 0 (
    echo [%date% %time%] ERROR: 'git pull' finalizo con codigo de error: %errorlevel%. Revisa el log. >> %LOGFILE%
) else (
    echo [%date% %time%] 'git pull' completado exitosamente. >> %LOGFILE%
)

echo [%date% %time%] Script de sincronizacion finalizado. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%

endlocal