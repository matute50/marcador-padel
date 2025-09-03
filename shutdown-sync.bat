@echo off
setlocal

:: Define el archivo de log
set LOGFILE=%~dp0shutdown-sync.log

:: Inicia el registro
echo. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%
echo [%date% %time%] Iniciando script de cierre. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%

:: Cambia al directorio del script
cd /d "%~dp0" >> %LOGFILE% 2>&1

echo [%date% %time%] Ejecutando 'git add .'... >> %LOGFILE%
git add . >> %LOGFILE% 2>&1

echo [%date% %time%] Revisando si hay cambios para commitear... >> %LOGFILE%
:: Revisa si hay cambios pendientes
git diff-index --quiet HEAD

:: Si errorlevel es 0, no hay cambios. Si es 1, hay cambios.
if %errorlevel% equ 0 (
    echo [%date% %time%] No hay cambios para sincronizar. >> %LOGFILE%
) else (
    echo [%date% %time%] Cambios detectados. Ejecutando 'git commit'... >> %LOGFILE%
    git commit -m "Sync automatico al cierre de sesion" >> %LOGFILE% 2>&1
    
    if %errorlevel% neq 0 (
        echo [%date% %time%] ERROR: 'git commit' fallo. Revisa el log para mas detalles. >> %LOGFILE%
    ) else (
        echo [%date% %time%] Commit exitoso. Ejecutando 'git push'... >> %LOGFILE%
        git push >> %LOGFILE% 2>&1
        if %errorlevel% neq 0 (
            echo [%date% %time%] ERROR: 'git push' fallo. Revisa el log para mas detalles. >> %LOGFILE%
        ) else (
            echo [%date% %time%] Sincronizacion de cierre completada. >> %LOGFILE%
        )
    )
)

echo [%date% %time%] Script de cierre finalizado. >> %LOGFILE%
echo --------------------------------------------------- >> %LOGFILE%

endlocal