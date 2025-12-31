# 🌐 Guía de Acceso por Red

## 📋 Descripción

Esta guía explica cómo configurar la aplicación para acceso desde otros dispositivos en tu red local (WiFi/LAN).

---

## 🚀 Inicio Rápido

### Windows

```bash
# Acceso por red (automático)
start-network.bat

# Desarrollo local solamente
start-local.bat
```

### Linux/Mac

```bash
# Acceso por red (automático)
./start-network.sh

# Desarrollo local
npm run dev
```

---

## 🔧 Configuración Manual

### 1. Obtener tu IP Local

**Windows:**
```cmd
ipconfig
```
Busca: `Dirección IPv4. . . . . . . . . : 192.168.1.XXX`

**Linux/Mac:**
```bash
ifconfig
# o
ip addr
```

### 2. Configurar el Cliente

Edita el archivo `client/.env`:

```env
PORT=3001
BROWSER=none
REACT_APP_API_URL=http://TU_IP:3000/api
```

**Ejemplo:**
```env
REACT_APP_API_URL=http://192.168.1.200:3000/api
```

### 3. Iniciar los Servidores

**Opción A - Con npm (desde la raíz):**
```bash
npm run dev
```

**Opción B - Separados:**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend  
cd client
npm start
```

---

## 🔒 Configuración del Firewall

### Windows

**Método 1 - PowerShell (Recomendado):**
```powershell
# Permitir puerto 3000 (Backend)
New-NetFirewallRule -DisplayName "Node Backend Port 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow

# Permitir puerto 3001 (Frontend)
New-NetFirewallRule -DisplayName "React Frontend Port 3001" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow
```

**Método 2 - GUI:**
1. Abrir "Firewall de Windows Defender"
2. Configuración avanzada → Reglas de entrada
3. Nueva regla → Puerto → TCP → 3000 y 3001
4. Permitir la conexión

### Linux (Ubuntu/Debian)

```bash
sudo ufw allow 3000
sudo ufw allow 3001
sudo ufw reload
```

### Mac

El firewall de macOS generalmente permite conexiones entrantes por defecto.

---

## 📱 Acceso desde Otros Dispositivos

Una vez configurado:

1. **Desde el mismo dispositivo:**
   - http://localhost:3001
   - http://TU_IP:3001

2. **Desde otros dispositivos en la red:**
   - http://TU_IP:3001
   - Ejemplo: http://192.168.1.200:3001

3. **API (para testing):**
   - http://TU_IP:3000/api
   - Ejemplo: http://192.168.1.200:3000/api/health

---

## ✅ Verificación

### 1. Verificar Backend
Abre en un navegador:
```
http://TU_IP:3000/api/health
```

Deberías ver:
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente"
}
```

### 2. Verificar Frontend
Abre en un navegador:
```
http://TU_IP:3001
```

Deberías ver la página de login.

### 3. Verificar Configuración de Axios
Abre la consola del navegador (F12) y verifica:
```
API URL configurada: http://TU_IP:3000/api
```

---

## 🐛 Solución de Problemas

### Error: "No se puede conectar al servidor"

**Causa:** El firewall está bloqueando las conexiones.

**Solución:**
1. Verifica que los puertos 3000 y 3001 estén permitidos en el firewall
2. Verifica que ambos servidores estén corriendo
3. Prueba acceder desde el mismo dispositivo con la IP

### Error: "API URL es localhost en otra máquina"

**Causa:** El archivo `.env` no se actualizó o el navegador tiene caché.

**Solución:**
1. Detener los servidores
2. Ejecutar `start-network.bat` (Windows) o `./start-network.sh` (Linux/Mac)
3. Limpiar caché del navegador (Ctrl+Shift+Delete)
4. Recargar la página con Ctrl+F5

### Error: "CORS error"

**Causa:** El CORS del backend no está configurado para tu IP.

**Solución:**
El CORS ya está configurado para aceptar todas las IPs de redes locales:
- 192.168.x.x
- 10.x.x.x
- 172.16-31.x.x

Si el problema persiste, verifica que la IP esté en uno de esos rangos.

### La página carga pero no puede hacer login

**Causa:** El frontend está cargando pero axios apunta a localhost.

**Solución:**
1. Abre las DevTools (F12)
2. Ve a la consola y verifica el mensaje: "API URL configurada:"
3. Si dice `http://localhost:3000/api`, el `.env` no se actualizó
4. Re-ejecuta `start-network.bat` o edita manualmente `client/.env`

---

## 🔄 Cambiar entre Local y Red

### De Local a Red:
```bash
# Windows
start-network.bat

# Linux/Mac
./start-network.sh
```

### De Red a Local:
```bash
# Windows
start-local.bat

# Linux/Mac
# Editar client/.env manualmente:
REACT_APP_API_URL=http://localhost:3000/api
```

Luego reiniciar ambos servidores.

---

## 📦 Producción

Para producción, compila el frontend:

```bash
cd client
npm run build
```

El backend sirve automáticamente el build en:
```
http://TU_IP:3000
```

Solo necesitas exponer el puerto 3000.

---

## 🎯 Resumen de Puertos

| Servicio | Puerto | Acceso | URL Ejemplo |
|----------|--------|--------|-------------|
| Backend API | 3000 | Red local | http://192.168.1.200:3000 |
| Frontend Dev | 3001 | Red local | http://192.168.1.200:3001 |
| Frontend Build | 3000 | Red local | http://192.168.1.200:3000 |

---

## 🔐 Seguridad

**⚠️ Importante:** Esta configuración es para desarrollo/uso en red local privada.

**NO expongas estos puertos a Internet sin:**
- Usar HTTPS (certificados SSL)
- Implementar rate limiting
- Configurar un reverse proxy (nginx/Apache)
- Usar variables de entorno seguras
- Implementar autenticación robusta

---

## 💡 Consejos

1. **IP dinámica:** Tu IP puede cambiar si usas DHCP. Considera configurar una IP estática en tu router.

2. **VPN:** Si usas VPN, tu IP local puede estar en un rango diferente (10.x.x.x).

3. **Múltiples interfaces:** Si tienes WiFi y Ethernet, pueden tener IPs diferentes. Usa la que corresponda a tu red activa.

4. **Producción:** Para entornos de producción, usa variables de entorno del sistema y no archivos `.env` commiteados.

---

## 📞 Soporte

Si tienes problemas:
1. Verifica que ambos servidores estén corriendo
2. Verifica el firewall
3. Verifica la IP con `ipconfig` o `ifconfig`
4. Revisa la consola del navegador (F12)
5. Revisa los logs del servidor
