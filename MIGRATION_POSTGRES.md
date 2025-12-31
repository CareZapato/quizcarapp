# 🔄 Migración a PostgreSQL - Guía Rápida

## Cambios Principales

La plataforma ha sido migrada de SQLite a PostgreSQL para mayor robustez y escalabilidad.

## 🔧 Configuración de Base de Datos

### Credenciales PostgreSQL

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=123456
DB_NAME=quizcarbd
```

### Crear la Base de Datos

Antes de iniciar la aplicación, crea la base de datos en PostgreSQL:

```sql
CREATE DATABASE quizcarbd;
```

O desde la terminal:

```bash
psql -U postgres
CREATE DATABASE quizcarbd;
\q
```

## 🆕 Nuevas Funcionalidades

### 1. Importación de Preguntas desde JSON

**Endpoint:** `POST /api/admin/import-questions`

**Formato JSON:**

```json
[
  {
    "question_number": 1,
    "question_text": "¿Pregunta aquí?",
    "option_a": "Primera opción",
    "option_b": "Segunda opción",
    "option_c": "Tercera opción",
    "correct_answer": "A",
    "explanation": "Explicación opcional",
    "category_id": 1,
    "difficulty": 1,
    "needs_image": true
  }
]
```

**Campos:**
- `question_number` (integer): Número identificador de la pregunta
- `question_text` (string, requerido): Texto de la pregunta
- `option_a, option_b, option_c` (string, requerido): Las tres opciones
- `correct_answer` (string, requerido): "A", "B" o "C"
- `explanation` (string, opcional): Explicación de la respuesta
- `category_id` (integer, opcional): ID de categoría (default: 1)
- `difficulty` (integer, opcional): 1=Fácil, 2=Media, 3=Difícil (default: 1)
- `needs_image` (boolean, opcional): Marca si la pregunta necesita imagen (default: false)

**Uso desde el Panel Admin:**
1. Login como administrador
2. Click en "📥 Importar JSON"
3. Pega tu JSON
4. Click en "✓ Importar"

### 2. Mapa Visual de Preguntas

**Endpoint:** `GET /api/admin/questions-map`

Muestra un grid visual de todas las preguntas con indicadores de estado de imágenes:

- ✓ **Verde**: Pregunta con imagen completa
- ! **Rojo**: Pregunta que necesita imagen (needs_image=true pero sin image_url)
- ○ **Gris**: Pregunta que no requiere imagen

**Uso desde el Panel Admin:**
1. Login como administrador
2. Click en "🗺️ Ver Mapa de Imágenes"
3. Click en cualquier pregunta para editarla

## 📊 Cambios en el Esquema de BD

### Tabla `questions` - Nuevos campos

```sql
question_number INTEGER  -- Número identificador de pregunta
needs_image BOOLEAN DEFAULT FALSE  -- Marca si necesita imagen
```

### Diferencias SQLite → PostgreSQL

- `INTEGER PRIMARY KEY AUTOINCREMENT` → `SERIAL PRIMARY KEY`
- `TEXT` → `VARCHAR(255)` o `TEXT`
- `DATETIME` → `TIMESTAMP`
- `BOOLEAN` valores 0/1 → `BOOLEAN` true/false
- Placeholders `?` → `$1, $2, $3, ...`
- `ON DELETE CASCADE` agregado a foreign keys

## 🚀 Inicio Rápido

### 1. Instalar dependencias

```bash
npm install
cd client && npm install && cd ..
```

### 2. Configurar PostgreSQL

Editar `.env`:

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

### 3. Crear base de datos

```bash
psql -U postgres -c "CREATE DATABASE quizcarbd;"
```

### 4. Inicializar tablas y datos

```bash
npm run init-db
```

Esto creará:
- Todas las tablas necesarias
- 5 categorías
- 10 preguntas de ejemplo
- Usuario admin (admin/admin123)
- Usuario demo (demo/password123)

### 5. Iniciar desarrollo

```bash
# Terminal 1 - Backend
npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

### 6. Acceder a la aplicación

- **Frontend:** http://localhost:3000
- **Admin:** Login con usuario `admin` / `admin123`

## 📝 Ejemplo de Importación JSON

### JSON Simple

```json
{
  "question_number": 100,
  "question_text": "¿Cuál es la velocidad máxima en autopista?",
  "option_a": "100 km/h",
  "option_b": "120 km/h",
  "option_c": "140 km/h",
  "correct_answer": "B",
  "needs_image": false
}
```

### JSON con Imagen

```json
{
  "question_number": 101,
  "question_text": "¿Qué señal se muestra en la imagen?",
  "option_a": "Stop",
  "option_b": "Ceda el paso",
  "option_c": "Prohibido estacionar",
  "correct_answer": "B",
  "explanation": "Esta señal triangular invertida indica ceder el paso",
  "category_id": 1,
  "difficulty": 1,
  "needs_image": true
}
```

Luego subir la imagen manualmente:
1. Editar la pregunta #101 en el panel
2. Click en "Elegir archivo"
3. Seleccionar imagen
4. Guardar

### JSON Múltiple

```json
[
  {
    "question_number": 200,
    "question_text": "Primera pregunta",
    "option_a": "A1",
    "option_b": "B1",
    "option_c": "C1",
    "correct_answer": "A"
  },
  {
    "question_number": 201,
    "question_text": "Segunda pregunta",
    "option_a": "A2",
    "option_b": "B2",
    "option_c": "C2",
    "correct_answer": "B",
    "needs_image": true
  }
]
```

## 🔍 Verificación

### Verificar conexión a PostgreSQL

```bash
psql -U postgres -d quizcarbd -c "SELECT COUNT(*) FROM questions;"
```

### Ver todas las preguntas

```bash
psql -U postgres -d quizcarbd -c "SELECT id, question_number, question_text, needs_image, image_url FROM questions ORDER BY question_number;"
```

### Ver preguntas que necesitan imágenes

```bash
psql -U postgres -d quizcarbd -c "SELECT question_number, question_text FROM questions WHERE needs_image = true AND image_url IS NULL;"
```

## ⚠️ Solución de Problemas

### Error: "No se puede conectar a PostgreSQL"

1. Verificar que PostgreSQL está corriendo:
   ```bash
   # Windows
   sc query postgresql-x64-14
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. Verificar credenciales en `.env`

3. Verificar que la base de datos existe:
   ```bash
   psql -U postgres -l
   ```

### Error: "Tabla no existe"

Ejecutar:
```bash
npm run init-db
```

### Error al importar JSON

1. Validar JSON en https://jsonlint.com
2. Verificar que todos los campos requeridos estén presentes
3. Revisar consola del navegador para ver detalles

## 📚 Documentación Adicional

- [README.md](README.md) - Documentación general
- [ADMIN_GUIDE.md](ADMIN_GUIDE.md) - Guía del panel de administración
- [QUICKSTART.md](QUICKSTART.md) - Inicio rápido

## 🔄 Migración desde SQLite

Si tienes una base de datos SQLite anterior:

1. Exportar datos:
   ```bash
   sqlite3 database.sqlite .dump > backup.sql
   ```

2. Convertir a PostgreSQL (manual o con herramientas como pgloader)

3. Importar en PostgreSQL:
   ```bash
   psql -U postgres -d quizcarbd < backup-postgres.sql
   ```

---

**✨ La migración está completa. Todas las funcionalidades anteriores se mantienen, con PostgreSQL como motor de base de datos.**
