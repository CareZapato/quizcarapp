# Contexto del Proyecto - TestConduccionWeb

## Descripción General
Aplicación web para práctica de exámenes de conducción con tres modalidades de quiz, panel de administración y sistema completo de gestión de preguntas.

## Stack Tecnológico

### Backend
- **Node.js + Express**: Servidor API REST
- **PostgreSQL 13**: Base de datos
- **JWT**: Autenticación y autorización
- **Bcrypt**: Encriptación de contraseñas
- **Multer**: Carga de archivos (imágenes)

### Frontend
- **React 18**: Framework UI
- **React Router v6**: Navegación
- **Axios**: Cliente HTTP
- **React Icons**: Iconografía

## Estructura del Proyecto

```
TestConduccionWeb/
├── server/                 # Backend
│   ├── index.js           # Servidor principal
│   ├── config/            # Configuración DB y seeds
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API endpoints
│   ├── scripts/           # Scripts de utilidad
│   └── utils/             # Utilidades DB
├── client/                # Frontend
│   ├── public/            # Archivos estáticos
│   └── src/
│       ├── components/    # Componentes reutilizables
│       ├── context/       # Context API (Auth)
│       ├── pages/         # Páginas principales
│       └── App.js         # Componente raíz
├── uploads/               # Imágenes de preguntas
└── README.md
```

## Características Principales

### Modos de Quiz
1. **Modo Real**: 35 preguntas, 45 minutos, 85% para aprobar
2. **Modo Extendido**: 100 preguntas, 90 minutos, 80% para aprobar
3. **Modo Práctica**: Preguntas infinitas, 60 segundos por pregunta, 85% para aprobar

### Funcionalidades
- ✅ Autenticación con JWT
- ✅ Gestión completa de preguntas (CRUD)
- ✅ Soporte para múltiples respuestas correctas
- ✅ Carga de imágenes para preguntas
- ✅ Sistema de categorías
- ✅ Estadísticas por categoría
- ✅ Revisión de respuestas con retroalimentación
- ✅ Acceso desde red local (LAN)
- ✅ Historial de quizzes completados

## Base de Datos

### Tablas Principales
- `users`: Usuarios del sistema
- `quizzes`: Instancias de exámenes
- `questions`: Banco de preguntas
- `categories`: Categorías de preguntas
- `user_answers`: Respuestas de usuarios
- `user_progress`: Progreso por categoría

## API Endpoints

### Autenticación
- `POST /api/auth/register`: Registro de usuario
- `POST /api/auth/login`: Inicio de sesión
- `GET /api/auth/validate`: Validar token

### Quiz
- `POST /api/quiz/start`: Iniciar quiz
- `GET /api/quiz/current`: Obtener quiz activo
- `POST /api/quiz/answer`: Guardar respuesta
- `POST /api/quiz/complete`: Completar quiz
- `POST /api/quiz/abandon`: Abandonar quiz
- `GET /api/quiz/:id/results`: Ver resultados

### Administración
- `GET /api/admin/questions`: Listar preguntas
- `POST /api/admin/questions`: Crear pregunta
- `PUT /api/admin/questions/:id`: Actualizar pregunta
- `DELETE /api/admin/questions/:id`: Eliminar pregunta
- `POST /api/admin/upload`: Subir imagen

### Estadísticas
- `GET /api/stats/overview`: Estadísticas generales
- `GET /api/stats/categories`: Estadísticas por categoría
- `GET /api/stats/history`: Historial de quizzes

## Variables de Entorno

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=quizcarbd

# Servidor
PORT=3000
JWT_SECRET=tu_jwt_secret

# Cliente (opcional para desarrollo)
REACT_APP_API_URL=http://localhost:3000/api
```

## Configuración de Red Local

Para acceso desde otros dispositivos:
1. Servidor escucha en `0.0.0.0:3000`
2. Cliente usa IP de la máquina host
3. Configurar firewall si es necesario

## Seguridad
- Autenticación JWT con expiración de 24h
- Contraseñas hasheadas con bcrypt (10 rounds)
- Middleware de autorización en rutas protegidas
- Validación de datos en servidor

## Estado Actual
- **Versión**: 0.2.1
- **Estado**: Producción estable
- **Última actualización**: 31/12/2025
