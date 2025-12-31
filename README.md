# 📚 Plataforma de Cuestionarios de Conducción Teóricos

## 🎯 Descripción General

Esta es una aplicación web monolítica completa diseñada para practicar cuestionarios de conducción teóricos. La plataforma permite a los usuarios realizar exámenes simulados con diferentes modos de dificultad, hacer seguimiento de su progreso y revisar sus resultados en detalle.

## 🏗️ Arquitectura

### Stack Tecnológico

**Backend:**
- Node.js + Express.js
- SQLite (base de datos)
- JWT (autenticación)
- bcryptjs (encriptación de contraseñas)

**Frontend:**
- React 18
- React Router (navegación)
- Axios (HTTP client)
- React Icons

**Características:**
- ✅ Aplicación monolítica (backend + frontend en un solo deploy)
- ✅ SPA (Single Page Application)
- ✅ RESTful API
- ✅ Autenticación basada en tokens JWT
- ✅ Base de datos relacional SQLite
- ✅ Panel de administración para gestionar preguntas
- ✅ Subida de imágenes para preguntas
- ✅ Sistema automático de seed y restauración de base de datos
- ✅ Acceso por IP desde cualquier dispositivo en la red local

### Estructura del Proyecto

```
TestConduccionWeb/
├── server/                    # Backend
│   ├── config/
│   │   ├── database.js       # Configuración y conexión a BD
│   │   └── seed.js           # Datos iniciales (seed)
│   ├── middleware/
│   │   └── auth.js           # Middleware de autenticación JWT
│   ├── routes/
│   │   ├── auth.js           # Rutas de autenticación
│   │   ├── questions.js      # Rutas de preguntas
│   │   ├── quiz.js           # Rutas de cuestionarios
│   │   ├── stats.js          # Rutas de estadísticas
│   │   └── admin.js          # Rutas de administración
│   ├── scripts/
│   │   └── initDatabase.js   # Script de inicialización de BD
│   ├── utils/
│   │   └── dbManager.js      # Utilidades de gestión de BD
│   ├── uploads/              # Directorio de imágenes subidas
│   └── index.js              # Punto de entrada del servidor
│
├── client/                    # Frontend
│   ├── public/
│   │   └── index.html        # HTML base
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.js     # Barra de navegación
│   │   │   └── PrivateRoute.js # Rutas protegidas
│   │   ├── context/
│   │   │   └── AuthContext.js # Contexto de autenticación
│   │   ├── pages/
│   │   │   ├── Login.js      # Página de login
│   │   │   ├── Register.js   # Página de registro
│   │   │   ├── Dashboard.js  # Panel principal
│   │   │   ├── Admin.js      # Panel de administración
│   │   │   ├── Quiz.js       # Página de cuestionario
│   │   │   ├── Results.js    # Página de resultados
│   │   │   └── Stats.js      # Página de estadísticas
│   │   ├── App.js            # Componente raíz
│   │   └── index.js          # Punto de entrada
│   └── package.json
│
├── uploads/                   # Imágenes de preguntas (creado en runtime)
├── database.sqlite            # Base de datos (creado en runtime)
├── .env                       # Variables de entorno
├── package.json               # Dependencias del proyecto
└── README.md                  # Documentación
```

## 🗄️ Base de Datos

### Esquema de Tablas

#### 1. **users** - Usuarios del sistema
```sql
- id: INTEGER (PK, autoincrement)
- username: TEXT (unique, not null)
- email: TEXT (unique, not null)
- password: TEXT (not null, hashed)
- created_at: DATETIME (default: current timestamp)
```

#### 2. **categories** - Categorías de preguntas
```sql
- id: INTEGER (PK, autoincrement)
- name: TEXT (not null)
- description: TEXT
```

Categorías por defecto:
- Señales de Tráfico
- Normas de Circulación
- Seguridad Vial
- Mecánica Básica
- Primeros Auxilios

#### 3. **questions** - Pool de preguntas
```sql
- id: INTEGER (PK, autoincrement)
- category_id: INTEGER (FK -> categories)
- question_text: TEXT (not null)
- option_a: TEXT (not null)
- option_b: TEXT (not null)
- option_c: TEXT (not null)
- correct_answer: TEXT (not null) [A, B, o C]
- explanation: TEXT
- image_url: TEXT
- difficulty: INTEGER (default: 1)
- created_at: DATETIME
```

#### 4. **quizzes** - Cuestionarios realizados
```sql
- id: INTEGER (PK, autoincrement)
- user_id: INTEGER (FK -> users)
- mode: TEXT (not null) ['real' o 'extended']
- total_questions: INTEGER (not null)
- correct_answers: INTEGER (default: 0)
- time_limit: INTEGER (segundos)
- time_taken: INTEGER (segundos)
- score: REAL (porcentaje)
- completed: BOOLEAN (default: 0)
- passed: BOOLEAN (default: 0)
- started_at: DATETIME
- completed_at: DATETIME
```

#### 5. **user_answers** - Respuestas del usuario
```sql
- id: INTEGER (PK, autoincrement)
- quiz_id: INTEGER (FK -> quizzes)
- question_id: INTEGER (FK -> questions)
- user_answer: TEXT ['A', 'B', 'C', o NULL]
- is_correct: BOOLEAN
- answered_at: DATETIME
```

#### 6. **user_progress** - Progreso por categoría
```sql
- id: INTEGER (PK, autoincrement)
- user_id: INTEGER (FK -> users)
- category_id: INTEGER (FK -> categories)
- questions_answered: INTEGER (default: 0)
- correct_answers: INTEGER (default: 0)
- last_updated: DATETIME
- UNIQUE(user_id, category_id)
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Registro:**
   - Usuario proporciona username, email y password
   - Password se encripta con bcrypt (10 saltos)
   - Se genera un JWT válido por 7 días
   - Token se almacena en localStorage

2. **Login:**
   - Usuario proporciona username y password
   - Se verifica la contraseña con bcrypt
   - Se genera un JWT válido por 7 días
   - Token se almacena en localStorage

3. **Verificación:**
   - Todas las rutas protegidas requieren token JWT
   - El middleware `authMiddleware` valida el token
   - Token se envía en header: `Authorization: Bearer <token>`

### Rutas Públicas vs Privadas

**Públicas:**
- `/api/auth/login`
- `/api/auth/register`

**Privadas (requieren JWT):**
- `/api/auth/verify`
- `/api/questions/*`
- `/api/quiz/*`
- `/api/stats/*`

## 📝 Funcionalidades Principales

### 1. Modos de Cuestionario

#### Modo Real
- **35 preguntas**
- **Tiempo límite: 45 minutos**
- **Puntaje mínimo para aprobar: 85%**
- Simula el examen real de conducción

#### Modo Extenso
- **100 preguntas**
- **Tiempo límite: 90 minutos**
- **Puntaje mínimo para aprobar: 80%**
- Para práctica profunda de todos los temas

### 2. Selección de Preguntas

**Algoritmo de Selección Proporcional:**
```javascript
1. Se obtienen todas las categorías disponibles
2. Se calcula cuántas preguntas corresponden a cada categoría:
   - preguntas_por_categoria = total_preguntas / cantidad_categorias
   - Se distribuyen las preguntas sobrantes equitativamente
3. Se seleccionan preguntas aleatorias de cada categoría
4. Se mezclan todas las preguntas seleccionadas
```

**Ventajas:**
- Garantiza cobertura de todos los temas
- Preguntas aleatorias en cada intento
- Distribución equitativa del contenido

### 3. Sistema de Temporizador

- Temporizador en tiempo real durante el cuestionario
- Alerta visual cuando quedan menos de 5 minutos
- Auto-entrega cuando se agota el tiempo
- Se guarda el tiempo utilizado para estadísticas

### 4. Guardado de Progreso

**Durante el cuestionario:**
- Cada respuesta se guarda inmediatamente en la BD
- Si el usuario cierra la página, puede continuar después
- El temporizador se ajusta al tiempo transcurrido

**Después del cuestionario:**
- Se calcula el puntaje y si aprobó
- Se actualiza el progreso por categoría
- Se guardan todas las respuestas para revisión

### 5. Revisión de Resultados

**Información mostrada:**
- Puntaje general (porcentaje y cantidad)
- Resultado (aprobado/suspendido)
- Tiempo utilizado
- Respuestas correctas/incorrectas por categoría

**Revisión detallada:**
- Cada pregunta con su respuesta correcta
- Respuesta del usuario (correcta o incorrecta)
- Explicación de la respuesta correcta
- Imágenes asociadas a las preguntas

### 6. Estadísticas y Progreso

**Estadísticas generales:**
- Total de cuestionarios realizados
- Cuestionarios aprobados/suspendidos
- Promedio de puntuación
- Precisión general (% de aciertos)

**Progreso por categoría:**
- Preguntas respondidas por categoría
- Respuestas correctas por categoría
- Porcentaje de precisión por categoría

**Historial:**
- Lista de todos los cuestionarios completados
- Filtrable y paginado
- Acceso rápido a los resultados detallados

## 🚀 API Endpoints

### Autenticación

```
POST /api/auth/register
Body: { username, email, password }
Response: { token, user }

POST /api/auth/login
Body: { username, password }
Response: { token, user: { id, username, email, is_admin } }

GET /api/auth/verify
Headers: Authorization: Bearer <token>
Response: { user: { id, username, email, is_admin } }
```

### Preguntas

```
GET /api/questions
Headers: Authorization: Bearer <token>
Response: [{ id, question_text, options, category, ... }]

GET /api/questions/categories
Headers: Authorization: Bearer <token>
Response: [{ id, name, description }]

POST /api/questions
Headers: Authorization: Bearer <token>
Body: { category_id, question_text, options, correct_answer, ... }
Response: { questionId }
```

### Administración (requiere is_admin=1)

```
GET /api/admin/questions
Headers: Authorization: Bearer <token>
Response: [{ id, question_text, options, category_name, image_url, ... }]

GET /api/admin/questions/:id
Headers: Authorization: Bearer <token>
Response: { id, question_text, options, correct_answer, ... }

POST /api/admin/questions
Headers: Authorization: Bearer <token>
Body: { category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url, difficulty }
Response: { questionId }

PUT /api/admin/questions/:id
Headers: Authorization: Bearer <token>
Body: { category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url, difficulty }
Response: { success: true }

DELETE /api/admin/questions/:id
Headers: Authorization: Bearer <token>
Response: { success: true }

POST /api/admin/upload-image
Headers: Authorization: Bearer <token>, Content-Type: multipart/form-data
Body: FormData con campo 'image'
Response: { imageUrl: '/uploads/filename.jpg' }

GET /api/admin/stats
Headers: Authorization: Bearer <token>
Response: { overview, categoryDistribution, recentQuizzes }

GET /api/admin/categories
Headers: Authorization: Bearer <token>
Response: [{ id, name, description }]
```

### Cuestionarios

```
POST /api/quiz/start
Headers: Authorization: Bearer <token>
Body: { mode: 'real' | 'extended' }
Response: { quizId, questions, timeLimit, ... }

POST /api/quiz/answer
Headers: Authorization: Bearer <token>
Body: { quizId, questionId, userAnswer }
Response: { isCorrect }

POST /api/quiz/complete
Headers: Authorization: Bearer <token>
Body: { quizId, timeTaken }
Response: { score, correctAnswers, passed, ... }

GET /api/quiz/:quizId/results
Headers: Authorization: Bearer <token>
Response: { quiz, answers }

GET /api/quiz/current
Headers: Authorization: Bearer <token>
Response: { hasActiveQuiz, quiz?, questions? }
```

### Estadísticas

```
GET /api/stats/overview
Headers: Authorization: Bearer <token>
Response: { overview, categoryProgress, recentQuizzes }

GET /api/stats/history?page=1&limit=20
Headers: Authorization: Bearer <token>
Response: { quizzes, pagination }
```

## 🎨 Interfaz de Usuario

### Características de Diseño

- **Diseño moderno y limpio** con gradientes y sombras sutiles
- **Responsive** - funciona en móviles, tablets y desktop
- **Feedback visual** en todas las interacciones
- **Animaciones suaves** para transiciones
- **Código de colores** intuitivo:
  - Verde: correcto/aprobado
  - Rojo: incorrecto/suspendido
  - Azul: información
  - Amarillo: advertencia

### Páginas Principales

1. **Login/Register:** Autenticación simple y clara
2. **Dashboard:** Vista general con estadísticas y acceso a modos
3. **Quiz:** Interfaz de examen con temporizador y navegación
4. **Results:** Resultados detallados con revisión de respuestas
5. **Stats:** Análisis completo de progreso y rendimiento

### Componentes Reutilizables

- Botones con múltiples estilos
- Cards informativos
- Barras de progreso
- Alertas contextuales
- Tablas responsivas
- Navegación de páginas

## 📦 Instalación y Configuración

### Requisitos Previos
- Node.js 14+ y npm

### Pasos de Instalación

1. **Instalar dependencias:**
```bash
npm run install-all
```

2. **Configurar variables de entorno:**
Editar el archivo `.env`:
```
PORT=3000
JWT_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=development
```

3. **Inicializar base de datos:**
```bash
npm run init-db
```

4. **Iniciar en desarrollo:**
```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

5. **Build para producción:**
```bash
cd client
npm run build
cd ..
NODE_ENV=production npm start
```

### Usuarios por Defecto

Después de inicializar la base de datos:

**Usuario Demo:**
- **Usuario:** demo
- **Contraseña:** password123
- **Rol:** Usuario normal

**Usuario Administrador:**
- **Usuario:** admin
- **Contraseña:** admin123
- **Rol:** Administrador (is_admin=1)

## 🔧 Configuración Avanzada

### Panel de Administración

Los usuarios administradores tienen acceso a un panel especial en `/admin` donde pueden:

- **Crear nuevas preguntas** con formulario visual
- **Editar preguntas existentes**
- **Eliminar preguntas** (si no están en uso)
- **Subir imágenes** para preguntas (hasta 5MB)
- **Ver estadísticas** del sistema
- **Filtrar por categoría y dificultad**

### Sistema de Seed y Restauración

El sistema verifica automáticamente la integridad de la base de datos al iniciar:

1. **Verificación en cada inicio:**
   - Comprueba que todas las tablas existan
   - Verifica que haya datos mínimos (categorías, usuarios)
   - Si faltan tablas o datos, los restaura automáticamente

2. **Restauración manual:**
```bash
npm run init-db
```

3. **Datos iniciales (seed):**
   - 5 categorías predefinidas
   - 10 preguntas de ejemplo
   - 2 usuarios (admin y demo)
   - Configurado en `server/config/seed.js`

### Acceso por IP

El servidor está configurado para aceptar conexiones desde cualquier dispositivo en la red:

```
Servidor escuchando en:
  - Local:   http://localhost:3000
  - Red:     http://192.168.1.X:3000
```

Para acceder desde otros dispositivos:
1. Asegúrate de que el firewall permita conexiones al puerto 3000
2. Obtén la IP del servidor (se muestra al iniciar)
3. Accede desde cualquier dispositivo: `http://IP_SERVIDOR:3000`

### Añadir Preguntas

Las preguntas se pueden añadir de dos formas:

1. **A través del Panel de Administración (recomendado):**
   - Login como admin
   - Ir a `/admin`
   - Click en "Nueva Pregunta"
   - Completar formulario y subir imagen opcional

2. **Manualmente en la BD:**
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url)
VALUES (1, '¿Pregunta?', 'Opción A', 'Opción B', 'Opción C', 'A', 'Explicación...', '/uploads/imagen.jpg');
```

3. **A través de la API:**
```javascript
POST /api/admin/questions
Headers: { Authorization: Bearer <token_admin> }
{
  "category_id": 1,
  "question_text": "¿Pregunta?",
  "option_a": "Opción A",
  "option_b": "Opción B",
  "option_c": "Opción C",
  "correct_answer": "A",
  "explanation": "Explicación...",
  "image_url": "/uploads/imagen.jpg",
  "difficulty": 2
}
```

### Añadir Imágenes a Preguntas

1. Subir imagen a la carpeta `/uploads/`
2. Referenciar en el campo `image_url` de la pregunta
3. Formato: `/uploads/nombre-imagen.jpg`

### Modificar Modos de Cuestionario

En `server/routes/quiz.js`, modificar el objeto `QUIZ_MODES`:

```javascript
const QUIZ_MODES = {
  REAL: {
    name: 'real',
    totalQuestions: 35,
    timeLimit: 45 * 60, // segundos
    passingScore: 85 // porcentaje
  },
  // Añadir más modos...
};
```

## 🚀 Deploy

### Heroku

```bash
# Iniciar git
git init
git add .
git commit -m "Initial commit"

# Crear app en Heroku
heroku create nombre-app

# Configurar variables de entorno
heroku config:set JWT_SECRET=tu_clave_secreta
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

### Railway / Render

1. Conectar repositorio Git
2. Configurar variables de entorno
3. Deploy automático

### VPS (Ubuntu)

```bash
# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clonar proyecto
git clone <repo-url>
cd TestConduccionWeb

# Instalar dependencias
npm run install-all

# Configurar .env
nano .env

# Inicializar BD
npm run init-db

# Build frontend
cd client && npm run build && cd ..

# Instalar PM2
sudo npm install -g pm2

# Iniciar aplicación
pm2 start server/index.js --name "test-conduccion"
pm2 save
pm2 startup
```

## 🔒 Seguridad

### Medidas Implementadas

1. **Contraseñas:** Encriptadas con bcrypt (10 saltos)
2. **JWT:** Tokens con expiración de 7 días
3. **Validación:** Input validation en todas las rutas
4. **SQL Injection:** Uso de queries parametrizadas
5. **CORS:** Configurado para producción

### Recomendaciones

- Cambiar `JWT_SECRET` en producción
- Usar HTTPS en producción
- Implementar rate limiting
- Añadir logs de seguridad
- Backups regulares de la BD

## 🧪 Testing

### Pruebas Manuales

1. **Registro y Login:**
   - Registrar nuevo usuario
   - Login con credenciales
   - Verificar token en localStorage

2. **Cuestionarios:**
   - Iniciar modo real
   - Responder preguntas
   - Verificar guardado automático
   - Entregar cuestionario
   - Revisar resultados

3. **Progreso:**
   - Completar múltiples cuestionarios
   - Verificar estadísticas actualizadas
   - Revisar progreso por categoría

## 📊 Análisis de Rendimiento

### Optimizaciones Implementadas

- Queries de BD optimizadas con índices
- Lazy loading de imágenes
- Paginación en listados largos
- Caché de token en localStorage
- Guardado incremental de respuestas

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Cannot connect to database"**
- Solución: Ejecutar `npm run init-db`

**Error: "JWT invalid"**
- Solución: Hacer logout y login nuevamente

**Error: "Not enough questions"**
- Solución: Añadir más preguntas a la BD

**Frontend no carga en producción**
- Solución: Ejecutar `cd client && npm run build`

## 📝 TODO / Mejoras Futuras

- [ ] Panel de administración para gestionar preguntas
- [ ] Export de resultados a PDF
- [ ] Modo de práctica por categoría
- [ ] Sistema de niveles y logros
- [ ] Ranking de usuarios
- [ ] Recordatorios de práctica
- [ ] Soporte para múltiples idiomas
- [ ] Modo oscuro
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push

## 📄 Licencia

MIT License - Libre uso y modificación

## 👥 Contribución

Para contribuir:
1. Fork el proyecto
2. Crear rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Añadir funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📞 Soporte

Para dudas o problemas:
- Revisar esta documentación
- Verificar logs del servidor
- Revisar console del navegador

---

**¡Buena suerte en tu práctica de conducción! 🚗💨**
