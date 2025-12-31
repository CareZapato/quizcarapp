# 🔧 Solución - Validación de category_id en Importación

## ❌ Problema Detectado

**Error:** `error: inserción o actualización en la tabla «questions» viola la llave foránea «questions_category_id_fkey»`

**Causa:** La pregunta tenía `category_id: 6` pero solo existen categorías del 1 al 5 en la base de datos.

---

## ✅ Solución Implementada

### 1. **Validación Automática de category_id**

Ambos endpoints de importación ahora:

**`POST /admin/import-questions`** (complementar)
**`POST /admin/import-full`** (reemplazar todo)

✅ **Verifican** qué categorías existen al inicio  
✅ **Validan** el category_id de cada pregunta  
✅ **Corrigen** automáticamente a categoría 1 si el ID no existe  
✅ **Informan** mediante warnings qué preguntas fueron corregidas  

---

### 2. **Mejoras en Respuesta del Endpoint**

**Antes:**
```json
{
  "success": true,
  "importedCount": 5,
  "updatedCount": 12,
  "message": "5 preguntas nuevas, 12 actualizadas"
}
```

**Ahora:**
```json
{
  "success": true,
  "importedCount": 5,
  "updatedCount": 12,
  "skippedCount": 0,
  "totalProcessed": 17,
  "validCategories": "1-5",
  "warnings": [
    {
      "question_number": 26,
      "warning": "category_id 6 no existe. Se usará categoría 1 por defecto. Categorías válidas: 1-5"
    }
  ],
  "errors": [],
  "message": "✅ 5 preguntas nuevas insertadas, 12 preguntas actualizadas/complementadas, 0 omitidas. ⚠️ 1 advertencias de categorías corregidas."
}
```

**Campos nuevos:**
- `totalProcessed`: Total de preguntas procesadas
- `validCategories`: Rango de categorías válidas (ej: "1-5")
- `warnings`: Array de advertencias (no errores) con correcciones automáticas
- `errors`: Ahora incluye `detail` con más información

---

## 🎯 Cómo Usar con tu JSON

### Opción 1: Dejar que se corrija automáticamente

**Tu JSON original:**
```json
{
  "questions": [
    {
      "question_number": 26,
      "category_id": 6,  ← No existe
      ...
    }
  ]
}
```

**Resultado:**
- ✅ Pregunta se importa con `category_id: 1`
- ⚠️ Warning: "category_id 6 no existe. Se usará categoría 1"
- ✅ Proceso continúa sin errores

---

### Opción 2: Crear la categoría 6 primero (RECOMENDADO)

**Usa import-full con categorías:**

```json
{
  "categories": [
    {
      "id": 6,
      "name": "Sistemas y Equipos del Vehículo",
      "description": "Conocimientos sobre sistemas y equipos"
    }
  ],
  "questions": [
    {
      "question_number": 26,
      "category_id": 6,  ← Ahora sí existe
      ...
    }
  ]
}
```

**Endpoint:** `POST /admin/import-full`

**Resultado:**
- ✅ Categoría 6 se crea primero
- ✅ Pregunta 26 se importa con category_id: 6
- ✅ Sin warnings ni errores

**Archivo de ejemplo:** [ejemplo_con_nueva_categoria.json](./ejemplo_con_nueva_categoria.json)

---

### Opción 3: Crear categoría manualmente en la BD

**Opción A - Via Admin Panel:**
```sql
-- No hay interfaz aún, usar SQL directamente
```

**Opción B - Via PostgreSQL:**
```sql
psql -U postgres testconduccion

INSERT INTO categories (id, name, description) 
VALUES (6, 'Sistemas y Equipos del Vehículo', 'Conocimientos sobre sistemas y equipos');
```

Luego importa tu JSON normalmente.

---

## 🔄 Comportamiento con Volver a Importar

**Si vuelves a importar el mismo JSON:**

### Primera importación (con category_id: 6 inválido):
```json
{
  "importedCount": 1,
  "warnings": ["category_id 6 corregido a 1"]
}
```
➡️ Pregunta 26 se guarda con category_id: 1

### Segunda importación (mismo JSON):
```json
{
  "updatedCount": 1,
  "warnings": ["category_id 6 corregido a 1"]
}
```
➡️ Pregunta 26 se **actualiza** pero mantiene category_id: 1  
➡️ **No se duplica**, usa el mismo question_number

---

## 📋 Categorías Disponibles por Defecto

```
ID | Nombre                  | Descripción
---+-------------------------+----------------------------------
1  | Señales de Tráfico      | Señales de tráfico y señalización
2  | Normas de Circulación   | Reglas y normas de circulación
3  | Seguridad Vial          | Seguridad y prevención de accidentes
4  | Mecánica Básica         | Conocimientos básicos de mecánica
5  | Primeros Auxilios       | Primeros auxilios en accidentes
```

**Para consultar en tu base de datos:**
```sql
SELECT * FROM categories ORDER BY id;
```

---

## 🐛 Otros Errores Mejorados

Ahora los errores incluyen más información:

**Antes:**
```json
{
  "question_number": 26,
  "error": "error: inserción o actualización..."
}
```

**Ahora:**
```json
{
  "question_number": 26,
  "error": "error: inserción o actualización en la tabla «questions» viola la llave foránea",
  "detail": "La llave (category_id)=(6) no está presente en la tabla «categories»."
}
```

---

## ✅ Validaciones Implementadas

### En import-questions (complementar):
- [x] Valida category_id antes de INSERT
- [x] Valida category_id antes de UPDATE
- [x] Usa categoría 1 por defecto si es inválido
- [x] Genera warning (no error) para seguir procesando
- [x] Informa categorías válidas en respuesta

### En import-full (reemplazar):
- [x] Valida category_id antes de INSERT
- [x] Importa categorías del JSON si se proporcionan
- [x] Actualiza lista de categorías válidas después de importar
- [x] Usa categoría 1 por defecto si es inválido
- [x] Genera warning (no error) para seguir procesando
- [x] Informa categorías válidas en respuesta

---

## 🎯 Resumen

**Antes:**
- ❌ Error y proceso se detiene
- ❌ No informa qué categorías son válidas
- ❌ No hay manera de crear categorías nuevas

**Ahora:**
- ✅ Warning y proceso continúa
- ✅ Corrige automáticamente a categoría 1
- ✅ Informa categorías válidas (1-5)
- ✅ Puedes crear categorías en import-full
- ✅ Mejor información de errores y warnings
- ✅ Contador de preguntas procesadas/actualizadas/omitidas

---

## 📝 Ejemplo de Uso Completo

### 1. Ver categorías disponibles
```
GET /admin/categories
```

### 2. Importar con corrección automática
```
POST /admin/import-questions
{
  "questions": [
    {
      "question_number": 26,
      "category_id": 6,  // Será corregido a 1
      ...
    }
  ]
}
```

**Respuesta:**
```json
{
  "validCategories": "1-5",
  "warnings": [{
    "question_number": 26,
    "warning": "category_id 6 no existe. Se usará categoría 1"
  }]
}
```

### 3. O importar creando la categoría
```
POST /admin/import-full
{
  "categories": [{"id": 6, "name": "Nueva Categoría"}],
  "questions": [...]
}
```

---

**Fecha:** 31 Diciembre 2025  
**Versión:** 2.1  
**Estado:** ✅ Resuelto y Validado
