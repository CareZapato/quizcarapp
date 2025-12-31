# 🚀 Inicio Rápido - Test Conducción Web

## Requisitos Previos

- Node.js 14+ instalado
- PostgreSQL instalado y corriendo
- Git (opcional)

## Configuración Inicial (Solo primera vez)

### 1. Instalar todas las dependencias

```bash
npm run install-all
```

Este comando instalará:
- Dependencias del backend (raíz)
- Dependencias del frontend (carpeta client)

### 2. Configurar PostgreSQL

Crear la base de datos:

```bash
# Abrir PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE quizcarbd;

# Salir
\q
```

### 3. Configurar variables de entorno

El archivo `.env` ya está configurado con:

```env
PORT=3000
JWT_SECRET=tu_clave_secreta_muy_segura_cambiala_en_produccion
NODE_ENV=development

# PostgreSQL Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=quizcarbd
```

⚠️ **Importante**: Si tu contraseña de PostgreSQL es diferente a `123456`, modifica `DB_PASSWORD` en el archivo `.env`

### 4. Inicializar la base de datos

```bash
npm run init-db
```

Esto creará:
- ✅ Todas las tablas necesarias
- ✅ 5 categorías por defecto
- ✅ 10 preguntas de ejemplo
- ✅ Usuario administrador (admin/admin123)
- ✅ Usuario demo (demo/password123)

## Iniciar la Aplicación

### Modo Desarrollo (Recomendado)

Desde la raíz del proyecto, ejecuta **UN SOLO COMANDO**:

```bash
npm run dev
```

Este comando iniciará automáticamente:
- 🔧 **Backend** en `http://localhost:3000`
- ⚛️ **Frontend** en `http://localhost:3001` (se abre automáticamente en el navegador)

### Modo Producción

```bash
# 1. Construir el frontend
npm run build

# 2. Iniciar en modo producción
NODE_ENV=production npm start
```

## Acceder a la Aplicación

### Desarrollo

Una vez ejecutado `npm run dev`:

1. El navegador se abrirá automáticamente en `http://localhost:3001`
2. Si no se abre, navega manualmente a esa URL

### Credenciales de Acceso

**Usuario Demo:**
- Usuario: `demo`
- Contraseña: `password123`

**Usuario Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

## Acceso desde Otros Dispositivos

El backend está configurado para aceptar conexiones desde cualquier dispositivo en la red local.

Cuando inicies con `npm run dev`, verás algo como:

```
🌐 Acceso disponible en:
   → Local:    http://localhost:3000
   → Red:      http://192.168.1.X:3000
```

Desde otros dispositivos en la red:
- Usa `http://192.168.1.X:3001` (reemplaza X con tu IP)
- Asegúrate de que el firewall permita conexiones al puerto 3001

## Panel de Administración

1. Inicia sesión con las credenciales de admin
2. En el menú superior verás el enlace **"Admin"** (en amarillo)
3. Click en "Admin" para acceder al panel

### Funcionalidades del Admin:

- ✅ **Crear/Editar/Eliminar** preguntas
- ✅ **Subir imágenes** a preguntas (hasta 5MB)
- ✅ **Importar preguntas** desde JSON
- ✅ **Ver mapa visual** de preguntas con estado de imágenes
- ✅ **Ver estadísticas** del sistema

## Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia backend + frontend en desarrollo |
| `npm run server` | Solo backend en desarrollo |
| `npm run client` | Solo frontend en desarrollo |
| `npm start` | Backend en producción |
| `npm run build` | Construir frontend para producción |
| `npm run install-all` | Instalar todas las dependencias |
| `npm run init-db` | Inicializar/resetear base de datos |

## Solución de Problemas

### Error: "Cannot connect to PostgreSQL"

1. Verifica que PostgreSQL esté corriendo:
   ```bash
   # Windows
   services.msc (buscar PostgreSQL)
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. Verifica las credenciales en `.env`

3. Verifica que la base de datos `quizcarbd` existe:
   ```bash
   psql -U postgres -l
   ```

### Error: "Port 3000 already in use"

```bash
# Windows - Encontrar y matar el proceso
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Error: "Port 3001 already in use"

React abrirá automáticamente en el siguiente puerto disponible (3002, 3003, etc.)

### La página está en blanco

1. Asegúrate de estar usando `npm run dev` (no solo `npm start`)
2. Espera a que aparezca "Compiled successfully!" en la terminal
3. Accede a `http://localhost:3001` (no al 3000)

### No aparecen las preguntas

1. Verifica que la base de datos esté inicializada:
   ```bash
   npm run init-db
   ```

2. Verifica la conexión a PostgreSQL en los logs del servidor

## Importar Preguntas desde JSON

### Formato del JSON

```json
[
  {
    "question_number": 1,
    "question_text": "¿Pregunta aquí?",
    "option_a": "Opción A",
    "option_b": "Opción B",
    "option_c": "Opción C",
    "correct_answer": "A",
    "explanation": "Explicación opcional",
    "category_id": 1,
    "difficulty": 1,
    "needs_image": true
  }
]
```

### Pasos para Importar

1. Login como admin
2. Click en "📥 Importar JSON"
3. Pegar tu JSON
4. Click en "✓ Importar"

## Ver Mapa de Imágenes

1. Login como admin
2. Click en "🗺️ Ver Mapa de Imágenes"
3. Verás un grid visual:
   - ✓ **Verde**: Pregunta con imagen
   - ! **Rojo**: Falta imagen (needs_image=true)
   - ○ **Gris**: No requiere imagen
4. Click en cualquier pregunta para editarla

## Estructura del Proyecto

```
TestConduccionWeb/
├── server/              # Backend (Express + PostgreSQL)
│   ├── config/         # Configuración BD y seed
│   ├── middleware/     # Autenticación
│   ├── routes/         # Rutas API
│   ├── scripts/        # Scripts de inicialización
│   └── utils/          # Utilidades
├── client/             # Frontend (React)
│   ├── public/         # Archivos estáticos
│   └── src/            # Código fuente React
├── uploads/            # Imágenes subidas
├── .env                # Variables de entorno
└── package.json        # Dependencias y scripts
```

## Documentación Adicional

- [MIGRATION_POSTGRES.md](MIGRATION_POSTGRES.md) - Migración a PostgreSQL
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Guía del panel de administración
- [README.md](README.md) - Documentación completa

## Soporte

Si encuentras problemas:

1. Revisa los logs en la terminal donde ejecutaste `npm run dev`
2. Revisa la consola del navegador (F12) para errores del frontend
3. Verifica que PostgreSQL esté corriendo y la base de datos creada
4. Intenta ejecutar `npm run init-db` nuevamente

---

**¡Listo! Ahora puedes usar la aplicación con un solo comando: `npm run dev`** 🎉
