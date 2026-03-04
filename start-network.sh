#!/bin/bash

echo ""
echo "================================================"
echo "   Iniciando con acceso por red"
echo "================================================"
echo ""

# Detectar IP local
if [[ "$OSTYPE" == "darwin"* ]]; then
    IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
else
    IP=$(hostname -I | awk '{print $1}')
fi

echo "IP local detectada: $IP"
echo ""

# Escritura config del cliente
# La app autodetecta la IP a partir de window.location.hostname,
# solo necesitamos indicar el puerto del backend.
cat > client/.env << EOF
PORT=3001
BROWSER=none
REACT_APP_API_PORT=3000
GENERATE_SOURCEMAP=false
EOF

echo "Configuracion escrita en client/.env"
echo "  API : http://<hostname>:3000/api  (autodetectado)"
echo ""
echo "================================================"
echo "  Acceso disponible en:"
echo "================================================"
echo ""
echo "  Este equipo  : http://localhost:3001"
echo "  Otros dispos.: http://$IP:3001"
echo ""
echo "================================================"
echo ""
echo "Iniciando servidores..."
echo ""

# Directorio raiz del proyecto
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Iniciar backend en segundo plano
cd "$ROOT_DIR"
npm run server &
BACKEND_PID=$!

# Esperar a que el backend levante
sleep 3

# Iniciar frontend
cd "$ROOT_DIR/client"
npm start &
FRONTEND_PID=$!

echo ""
echo "Servidores iniciados."
echo "  Backend  PID : $BACKEND_PID  -> http://$IP:3000"
echo "  Frontend PID : $FRONTEND_PID -> http://$IP:3001"
echo ""
echo "Presiona Ctrl+C para detener ambos servidores."
echo ""

# Esperar señal de salida y limpiar
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
