#!/bin/bash
set -e  # Abortar ante cualquier error

echo ""
echo "==> [1/3] Instalando dependencias del servidor..."
npm install

echo ""
echo "==> [2/3] Instalando dependencias del cliente..."
npm --prefix client install

echo ""
echo "==> [3/3] Compilando frontend React..."
# REACT_APP_API_URL=/api: en Render el front y el back corren en el mismo
# servidor Express, por lo que las llamadas a la API usan ruta relativa.
# CI=false: evita que los ESLint warnings aborte el build.
export REACT_APP_API_URL=/api
export CI=false
npm --prefix client run build

echo ""
echo "==> Build completado. Archivos generados:"
ls -la client/build/
echo ""
