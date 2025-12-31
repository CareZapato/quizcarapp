# Instrucciones para Configurar Acceso por IP

## Backend (Servidor)
El servidor ya está configurado para escuchar en todas las interfaces de red (0.0.0.0).

**Puertos:**
- Backend API: 3000
- Frontend Dev: 3001

## Frontend (Cliente)

### Opción 1: Desarrollo Local (localhost)
No requiere cambios, funciona por defecto.

### Opción 2: Acceso por IP en la Red Local

1. Obtén tu IP local:
   ```bash
   # Windows
   ipconfig
   
   # Linux/Mac
   ifconfig
   ```
   Busca algo como: `192.168.1.100` o `10.0.0.50`

2. Edita el archivo `client/.env`:
   ```
   REACT_APP_API_URL=http://TU_IP:3000/api
   ```
   Ejemplo:
   ```
   REACT_APP_API_URL=http://192.168.1.100:3000/api
   ```

3. Reinicia ambos servidores:
   ```bash
   # Terminal 1 (Backend)
   cd server
   npm run dev
   
   # Terminal 2 (Frontend)
   cd client
   npm start
   ```

4. Accede desde cualquier dispositivo en la red:
   ```
   http://TU_IP:3001
   ```
   Ejemplo: `http://192.168.1.100:3001`

## CORS Configurado
El servidor ya permite conexiones desde:
- localhost:3001
- 127.0.0.1:3001
- 192.168.x.x:3001 (red local)
- 10.x.x.x:3001 (red local)
- 172.16-31.x.x:3001 (red privada)

## Firewall
Si no puedes conectarte desde otros dispositivos, verifica el firewall:

**Windows:**
```powershell
# Permitir puerto 3000 (Backend)
netsh advfirewall firewall add rule name="Node Backend" dir=in action=allow protocol=TCP localport=3000

# Permitir puerto 3001 (Frontend)
netsh advfirewall firewall add rule name="React Frontend" dir=in action=allow protocol=TCP localport=3001
```

**Linux:**
```bash
sudo ufw allow 3000
sudo ufw allow 3001
```

## Producción
Para producción, usa el build del cliente:
```bash
cd client
npm run build
```
Y sirve desde el backend directamente en el puerto 3000.
