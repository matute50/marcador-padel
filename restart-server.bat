@echo off
echo Reiniciando servidor del Controlador PTZ...

echo Deteniendo servidor anterior (en puerto 3000)...
FOR /F "tokens=5" %%P IN ('netstat -aon ^| findstr ":3000"') DO (
    IF "%%P" NEQ "0" (
        echo Deteniendo proceso con PID %%P...
        taskkill /PID %%P /F
    )
)

:: Pequeña pausa para asegurar que el puerto se libere completamente
timeout /t 1 /nobreak > nul

echo Iniciando nueva version...
cd /d "F:\GEMINI-CLI\ControladorPTZ"
start "PTZ_Server" cmd /c "node server.js"

echo Servidor reiniciado en segundo plano.