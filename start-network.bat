@echo off
echo.
echo ================================================
echo   Iniciando aplicacion con acceso por red
echo ================================================
echo.

REM Obtener la IP local
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Tu IP local es: %IP%
echo.
echo Configurando acceso por red...
echo.

REM Actualizar el archivo .env del cliente con la IP
(
echo PORT=3001
echo BROWSER=none
echo REACT_APP_API_URL=http://%IP%:3000/api
) > client\.env

echo Archivo client/.env actualizado con la IP: %IP%
echo.
echo ================================================
echo   Instrucciones:
echo ================================================
echo.
echo 1. El backend escuchara en: http://%IP%:3000
echo 2. El frontend escuchara en: http://%IP%:3001
echo.
echo 3. Desde este dispositivo accede a:
echo    http://localhost:3001
echo    o
echo    http://%IP%:3001
echo.
echo 4. Desde otros dispositivos en la red accede a:
echo    http://%IP%:3001
echo.
echo 5. Asegurate de que el firewall permita conexiones
echo    en los puertos 3000 y 3001
echo.
echo ================================================
echo.
echo Presiona cualquier tecla para iniciar los servidores...
pause > nul

echo.
echo Iniciando servidores...
echo.

REM Iniciar backend
start "Backend Server (Puerto 3000)" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 > nul

REM Iniciar frontend
start "Frontend Server (Puerto 3001)" cmd /k "cd /d %~dp0client && npm start"

echo.
echo ================================================
echo   Servidores iniciados en ventanas separadas
echo ================================================
echo.
echo Backend:  http://%IP%:3000
echo Frontend: http://%IP%:3001
echo.
echo Accede desde cualquier dispositivo en la red a:
echo http://%IP%:3001
echo.

