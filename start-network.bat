@echo off
echo.
echo ================================================
echo   Iniciando con acceso por red
echo ================================================
echo.

REM Detectar la IP local (primera IPv4 no loopback)
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    set IP=%%a
    goto :found
)
:found
set IP=%IP:~1%

echo Tu IP local detectada: %IP%
echo.

REM Escribir configuracion del cliente
REM La app autodetecta la IP desde window.location.hostname,
REM solo necesitamos indicar el puerto del backend.
(
echo PORT=3001
echo BROWSER=none
echo REACT_APP_API_PORT=3000
echo GENERATE_SOURCEMAP=false
) > client\.env

echo Configuracion escrita en client/.env
echo   API : http://^<hostname^>:3000/api  (autodetectado)
echo.
echo ================================================
echo   Acceso disponible en:
echo ================================================
echo.
echo   Este equipo  : http://localhost:3001
echo   Otros dispos.: http://%IP%:3001
echo.
echo   Asegurate de que el firewall permita
echo   conexiones en los puertos 3000 y 3001
echo.
echo ================================================
echo Presiona cualquier tecla para iniciar...
pause > nul

echo.
echo Iniciando servidores...
echo.

REM Iniciar backend
start "Backend (Puerto 3000)" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 > nul

REM Iniciar frontend
start "Frontend (Puerto 3001)" cmd /k "cd /d %~dp0client && npm start"

echo.
echo ================================================
echo   Servidores iniciados en ventanas separadas
echo ================================================
echo.
echo Backend:  http://%IP%:3000
echo Frontend: http://%IP%:3001
echo.
