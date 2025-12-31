@echo off
REM Suprimir warnings de Node.js
set NODE_OPTIONS=--no-deprecation
cd client
npm start
