# Guía de Deploy y Restauración de Base de Datos

## 🚀 Cambios Implementados en Deploy v2.0

### ✅ Soporte Automático para Opciones D y E

El sistema ahora **verifica y agrega automáticamente** las columnas `option_d` y `option_e` durante:

1. **Inicio del servidor** (`verifyAndRestoreDatabase()`)
2. **Restauración de tablas** (`createTables()`)
3. **Importación completa** (`/admin/import-full`)
4. **Script manual** (`ensure-option-columns.js`)

---

## 📋 Proceso de Deploy Actualizado

### 1. Verificación Automática al Iniciar Servidor

Cuando el servidor arranca, automáticamente:

```bash
npm start  # o node server/index.js
```

**El sistema ejecuta:**

✅ Verifica que todas las tablas existan  
✅ Verifica que columnas `option_d` y `option_e` existan  
✅ Si faltan, las agrega automáticamente  
✅ Convierte `correct_answer` y `user_answer` a TEXT si es necesario  

**Salida esperada:**
```
🔍 Verificando integridad de la base de datos...
✅ Todas las tablas existen
🔍 Verificando tipos de columnas...
✅ Columna option_d agregada
✅ Columna option_e agregada
✅ Tipos de columnas y estructura verificados
✅ Datos iniciales presentes
🎉 Base de datos verificada y lista
```

---

### 2. Script Manual de Migración

Si necesitas ejecutar la migración manualmente:

```bash
# Desde la raíz del proyecto
PGPASSWORD=tu_password node server/scripts/ensure-option-columns.js
```

**Windows:**
```cmd
SET PGPASSWORD=123456
node server/scripts/ensure-option-columns.js
```

---

### 3. Restauración Completa desde Cero

Para resetear completamente la base de datos:

```bash
node server/scripts/initDatabase.js
```

**Esto:**
- 🗑️ Elimina todas las tablas (CASCADE)
- 📋 Crea tablas con esquema actualizado (incluye option_d y option_e)
- 🌱 Inserta datos iniciales (categorías, usuarios admin/demo)

---

## 📦 Importación/Exportación con Opciones D y E

### Exportar Preguntas (incluye D y E)

**Desde Admin Panel:**
```
Admin → "📤 Exportar JSON"
```

**Estructura del JSON exportado:**
```json
{
  "version": "1.0",
  "exported_at": "2025-12-31T00:00:00.000Z",
  "total_questions": 100,
  "categories": [...],
  "questions": [
    {
      "question_number": 1,
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",  ← INCLUIDO
      "option_e": "...",  ← INCLUIDO
      "correct_answer": "A,D",
      "explanation": "...",
      ...
    }
  ]
}
```

### Importar Preguntas (modo complementar)

**Endpoint:** `POST /admin/import-questions`

**Características:**
- ✅ Actualiza por `question_number`
- ✅ Solo modifica campos proporcionados
- ✅ Soporta `option_d` y `option_e`

**Ejemplo - Agregar solo D y E:**
```json
{
  "questions": [
    {
      "question_number": 5,
      "option_d": "Cuarta opción",
      "option_e": "Quinta opción"
    }
  ]
}
```

### Importar Preguntas (modo reemplazo total)

**Endpoint:** `POST /admin/import-full`

**Body:**
```json
{
  "replaceAll": true,
  "categories": [...],
  "questions": [
    {
      "question_text": "...",
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",  ← SOPORTADO
      "option_e": "...",  ← SOPORTADO
      "correct_answer": "A,B,D",
      ...
    }
  ]
}
```

**⚠️ ATENCIÓN:** `replaceAll: true` **elimina todas las preguntas existentes**

---

## 🔧 Archivos Modificados en Deploy v2.0

### 1. **server/config/seed.js**
```javascript
questions: `
  CREATE TABLE IF NOT EXISTS questions (
    ...
    option_d TEXT,      ← NUEVO
    option_e TEXT,      ← NUEVO
    ...
  )
`
```

### 2. **server/utils/dbManager.js**

**Función `verifyColumnTypes()`:**
- ✅ Verifica existencia de `option_d`
- ✅ Verifica existencia de `option_e`
- ✅ Agrega columnas si faltan (ALTER TABLE ADD COLUMN)

**Función `seedData()`:**
- ✅ INSERT incluye `option_d, option_e` (con valores null si no están en seed)

### 3. **server/routes/admin.js**

**`POST /admin/import-questions`:**
- ✅ UPDATE dinámico incluye `option_d` y `option_e`
- ✅ INSERT incluye `option_d` y `option_e`

**`POST /admin/import-full`:**
- ✅ INSERT incluye `option_d` y `option_e`

**`GET /admin/export-questions`:**
- ✅ SELECT incluye `option_d` y `option_e`

### 4. **server/scripts/ensure-option-columns.js** _(NUEVO)_
- Script standalone para migración manual
- Puede ejecutarse independientemente
- Verifica información_schema de PostgreSQL
- Agrega columnas solo si no existen

---

## 🛠️ Comandos Útiles de Deploy

### Desarrollo Local

```bash
# Iniciar servidor con verificación automática
npm start

# Forzar reset de base de datos
node server/scripts/initDatabase.js

# Agregar columnas manualmente (si es necesario)
PGPASSWORD=123456 node server/scripts/ensure-option-columns.js
```

### Producción

```bash
# 1. Backup de base de datos
pg_dump -U postgres testconduccion > backup.sql

# 2. Actualizar código
git pull origin main

# 3. Instalar dependencias
npm install

# 4. El servidor verificará automáticamente al iniciar
npm start

# 5. Si hay problemas, restaurar backup
psql -U postgres testconduccion < backup.sql
```

---

## ✅ Checklist de Deploy

### Antes del Deploy

- [ ] Backup de base de datos creado
- [ ] Código actualizado (git pull)
- [ ] Dependencias actualizadas (npm install)
- [ ] Variables de entorno verificadas (.env)

### Durante el Deploy

- [ ] Servidor inicia sin errores
- [ ] Logs muestran "✅ Columna option_d agregada" (si aplica)
- [ ] Logs muestran "✅ Columna option_e agregada" (si aplica)
- [ ] Logs muestran "🎉 Base de datos verificada y lista"

### Después del Deploy

- [ ] Exportar JSON incluye option_d y option_e
- [ ] Importar JSON acepta option_d y option_e
- [ ] Formulario admin muestra campos D y E
- [ ] Quiz muestra opciones D y E cuando existen
- [ ] Resultados muestran opciones D y E correctamente

---

## 🐛 Troubleshooting

### Problema: "Column option_d does not exist"

**Solución:**
```bash
# Ejecutar script de migración
PGPASSWORD=tu_password node server/scripts/ensure-option-columns.js

# O reiniciar servidor (verificará automáticamente)
npm start
```

---

### Problema: Import falla con opciones D/E

**Verificar:**
1. Esquema de tabla actualizado:
   ```sql
   \d questions  -- En psql
   ```
2. Columnas deben aparecer:
   ```
   option_d | text |
   option_e | text |
   ```

**Solución si faltan:**
```sql
ALTER TABLE questions ADD COLUMN option_d TEXT;
ALTER TABLE questions ADD COLUMN option_e TEXT;
```

---

### Problema: Exportación no incluye D/E

**Verificar endpoint:**
```javascript
// En admin.js, debe tener:
SELECT option_d, option_e FROM questions...
```

**Solución:** Actualizar código y reiniciar servidor

---

## 📊 Estructura Actualizada de Base de Datos

```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  question_number INTEGER,
  category_id INTEGER,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,        -- Obligatoria
  option_b TEXT NOT NULL,        -- Obligatoria
  option_c TEXT NOT NULL,        -- Obligatoria
  option_d TEXT,                 -- Opcional (nueva)
  option_e TEXT,                 -- Opcional (nueva)
  correct_answer TEXT NOT NULL,  -- Ej: "A,D,E" para múltiples
  explanation TEXT,
  image_url TEXT,
  needs_image BOOLEAN DEFAULT FALSE,
  difficulty INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔒 Seguridad y Backup

### Backup Automático Antes de Import-Full

El sistema **NO** hace backup automático antes de `replaceAll: true`.

**Recomendación:**
```bash
# Hacer backup manual antes de import-full
pg_dump -U postgres testconduccion > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restaurar Backup

```bash
# Eliminar base de datos actual
dropdb -U postgres testconduccion

# Crear nueva base
createdb -U postgres testconduccion

# Restaurar backup
psql -U postgres testconduccion < backup_20251231_120000.sql

# Verificar columnas (el backup debe tenerlas)
psql -U postgres testconduccion -c "\d questions"
```

---

## 📞 Soporte

Si tienes problemas con el deploy:

1. **Verificar logs del servidor** (buscar errores con "option_d" o "option_e")
2. **Ejecutar script de migración manual**
3. **Verificar estructura de tabla** con `\d questions` en psql
4. **Consultar documentación**: `COMPLEMENTAR_PREGUNTAS.md`

---

**Versión Deploy:** 2.0  
**Última actualización:** Diciembre 31, 2025  
**Compatibilidad:** PostgreSQL 12+, Node.js 16+
