#!/bin/bash
set -e  # Abortar ante cualquier error

# Variables de entorno para el build del cliente
# REACT_APP_API_URL=/api: en Render front y back corren en el mismo servidor
# Express, por lo que la API es una ruta relativa (sin hostname ni puerto).
export REACT_APP_API_URL=/api
export CI=false

echo ""
echo "==> Variables de build: REACT_APP_API_URL=${REACT_APP_API_URL} CI=${CI}"
echo "==> [1/3] Instalando dependencias del servidor..."
npm install

echo ""
echo "==> [2/3] Instalando dependencias del cliente..."
npm --prefix client install

echo ""
echo "==> [3/3] Compilando frontend React..."
npm --prefix client run build

echo ""
echo "==> Build completado. Archivos generados:"
ls -la client/build/
echo ""
