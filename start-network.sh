#!/bin/bash

echo ""
echo "================================================"
echo "   Iniciando aplicación con acceso por red"
echo "================================================"
echo ""

# Obtener la IP local
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ipconfig getifaddr en0)
    if [ -z "$IP" ]; then
        IP=$(ipconfig getifaddr en1)
    fi
else
    # Linux
    IP=$(hostname -I | awk '{print $1}')
fi

echo "Tu IP local es: $IP"
echo ""
echo "Configurando acceso por red..."
echo ""

# Actualizar el archivo .env del cliente con la IP
cat > client/.env << EOF
PORT=3001
BROWSER=none
REACT_APP_API_URL=http://$IP:3000/api
EOF

echo "Archivo client/.env actualizado"
echo ""
echo "================================================"
echo "   Instrucciones:"
echo "================================================"
echo ""
echo "1. El backend escuchará en: http://$IP:3000"
echo "2. El frontend escuchará en: http://$IP:3001"
echo ""
echo "3. Desde este dispositivo accede a:"
echo "   http://localhost:3001"
echo ""
echo "4. Desde otros dispositivos en la red accede a:"
echo "   http://$IP:3001"
echo ""
echo "================================================"
echo ""
echo "Iniciando servidores..."
echo ""

# Iniciar backend en segundo plano
cd server
npm run dev &
BACKEND_PID=$!

# Esperar un poco para que el backend inicie
sleep 3

# Iniciar frontend
cd ../client
npm start &
FRONTEND_PID=$!

echo ""
echo "Servidores iniciados!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Para detener los servidores, presiona Ctrl+C"
echo ""

# Esperar a que se termine
wait
