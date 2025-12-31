@echo off
echo.
echo ================================================
echo   Configurando para desarrollo local
echo ================================================
echo.

REM Actualizar el archivo .env del cliente con localhost
(
echo PORT=3001
echo BROWSER=none
echo REACT_APP_API_URL=http://localhost:3000/api
) > client\.env

echo.
echo ✅ Configuracion actualizada a localhost
echo.
echo Archivo client/.env actualizado para usar:
echo   REACT_APP_API_URL=http://localhost:3000/api
echo.
echo ================================================
echo   Instrucciones:
echo ================================================
echo.
echo 1. Esta configuracion es para desarrollo local
echo 2. Solo podras acceder desde este dispositivo
echo 3. Accede a: http://localhost:3001
echo.
echo Para acceso por red, ejecuta: start-network.bat
echo.
echo ================================================
echo.
pause
