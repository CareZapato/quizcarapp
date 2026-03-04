@echo off
echo.
echo ================================================
echo   Iniciando en modo LOCAL (solo este equipo)
echo ================================================
echo.

REM Escribir configuracion del cliente
(
echo PORT=3001
echo BROWSER=none
echo REACT_APP_API_PORT=3000
echo GENERATE_SOURCEMAP=false
) > client\.env

echo Configuracion escrita en client/.env
echo   API URL : /api  (proxy -> localhost:3000)
echo.
echo Backend  : http://localhost:3000
echo Frontend : http://localhost:3001
echo.
echo ================================================
echo Presiona cualquier tecla para iniciar...
pause > nul

REM Iniciar backend
start "Backend (Puerto 3000)" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 3 > nul

REM Iniciar frontend
start "Frontend (Puerto 3001)" cmd /k "cd /d %~dp0client && npm start"

echo.
echo Servidores iniciados en ventanas separadas.
echo Accede a: http://localhost:3001
echo.
