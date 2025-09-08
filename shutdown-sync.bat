@echo off
echo Sincronizando el espacio de trabajo con GitHub...
cd /d F:\GEMINI-CLI

REM Añade todos los cambios al staging area
git add .

REM Revisa si hay cambios para commitear
git diff-index --quiet HEAD --

REM Si git diff-index encuentra cambios, su ERRORLEVEL es 1.
if %errorlevel% neq 0 (
    echo Cambios detectados. Creando commit...
    git commit -m "Sync automatico: %date% %time%"
    
    REM Verifica si el commit fue exitoso antes de hacer push
    if %errorlevel% equ 0 (
        echo Empujando cambios a origin main...
        git push origin main
    ) else (
        echo ERROR: El commit falló. No se hará push.
    )
) else (
    echo No hay cambios para commitear.
)

echo.
echo Sincronización completada.