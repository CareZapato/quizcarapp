# 🔐 Guía del Panel de Administración

## Índice
1. [Acceso al Panel](#acceso-al-panel)
2. [Funcionalidades](#funcionalidades)
3. [Gestión de Preguntas](#gestión-de-preguntas)
4. [Subida de Imágenes](#subida-de-imágenes)
5. [Mejores Prácticas](#mejores-prácticas)
6. [Solución de Problemas](#solución-de-problemas)

---

## Acceso al Panel

### Credenciales de Administrador

Por defecto, el sistema crea un usuario administrador:

```
Usuario: admin
Contraseña: admin123
```

**⚠️ IMPORTANTE:** Cambia estas credenciales en producción por seguridad.

### Acceder al Panel

1. Inicia sesión con las credenciales de administrador
2. En la barra de navegación aparecerá el enlace "Admin" (en color amarillo)
3. Click en "Admin" para acceder al panel de administración

**URL directa:** `http://localhost:3000/admin`

---

## Funcionalidades

### Dashboard de Estadísticas

Al entrar al panel verás 4 tarjetas con estadísticas del sistema:

- **Total de Preguntas:** Cantidad de preguntas en el pool
- **Total de Categorías:** Categorías disponibles
- **Total de Usuarios:** Usuarios registrados
- **Total de Cuestionarios:** Cuestionarios completados

### Gestión de Preguntas

El panel permite realizar operaciones CRUD completas sobre las preguntas:

- ✅ **Crear** nuevas preguntas
- ✅ **Editar** preguntas existentes
- ✅ **Eliminar** preguntas no utilizadas
- ✅ **Subir imágenes** para preguntas

---

## Gestión de Preguntas

### Crear Nueva Pregunta

1. **Click en "Nueva Pregunta"** en la parte superior del panel

2. **Completar el formulario:**
   
   **Campos obligatorios:**
   - **Categoría:** Selecciona una de las 5 categorías disponibles
   - **Pregunta:** Texto de la pregunta (máximo recomendado: 500 caracteres)
   - **Opción A:** Primera opción de respuesta
   - **Opción B:** Segunda opción de respuesta
   - **Opción C:** Tercera opción de respuesta
   - **Respuesta Correcta:** Selecciona A, B o C
   - **Dificultad:** Fácil (1), Media (2) o Difícil (3)

   **Campos opcionales:**
   - **Explicación:** Texto que se muestra después de responder
   - **Imagen:** Subir una imagen relacionada con la pregunta

3. **Click en "Crear Pregunta"**

4. **Verificar:** La pregunta aparecerá en la lista inferior

### Editar Pregunta Existente

1. **Localizar la pregunta** en la lista (usa Ctrl+F si hay muchas)

2. **Click en el botón "Editar"** (icono de lápiz)

3. **Modificar los campos** necesarios en el formulario

4. **Click en "Actualizar Pregunta"**

5. **Verificar:** Los cambios se reflejan inmediatamente

### Eliminar Pregunta

1. **Localizar la pregunta** en la lista

2. **Click en el botón "Eliminar"** (icono de papelera)

3. **Confirmar** la eliminación en el diálogo

**⚠️ Restricción:** No se pueden eliminar preguntas que ya han sido utilizadas en cuestionarios.

---

## Subida de Imágenes

### Requisitos

- **Formato:** JPG, JPEG, PNG, GIF, WEBP
- **Tamaño máximo:** 5 MB
- **Dimensiones recomendadas:** 800x600 px

### Proceso de Subida

1. **Durante la creación/edición de una pregunta:**
   - Localiza el campo "Imagen (opcional)"
   - Click en "Elegir archivo"
   - Selecciona la imagen de tu computadora

2. **La imagen se subirá automáticamente** y verás:
   - Mensaje "Subiendo..."
   - Preview de la imagen
   - Botón "Quitar" para eliminarla

3. **Guardar la pregunta** para confirmar los cambios

### Ubicación de las Imágenes

Las imágenes se almacenan en:
```
server/uploads/
```

Se sirven automáticamente como archivos estáticos en:
```
/uploads/filename-timestamp.jpg
```

### Quitar una Imagen

1. Click en el botón "Quitar" debajo del preview
2. Guardar la pregunta
3. La imagen ya no se asociará a la pregunta (pero permanece en el servidor)

---

## Mejores Prácticas

### Redacción de Preguntas

1. **Clara y concisa:** Evita ambigüedades
2. **Una sola idea:** No mezcles conceptos en una pregunta
3. **Ortografía:** Revisa antes de guardar
4. **Contexto:** Si usas imagen, menciona "En la imagen..." en el texto

### Opciones de Respuesta

1. **Longitud similar:** Las 3 opciones deben tener longitud parecida
2. **No obvias:** Evita opciones claramente incorrectas
3. **Sin pistas:** No uses "Todas las anteriores" o "Ninguna"
4. **Específicas:** Sé preciso en las respuestas

### Explicaciones

1. **Justificar:** Explica POR QUÉ es correcta la respuesta
2. **Citar fuentes:** Menciona el artículo o reglamento si aplica
3. **Educativa:** Aprovecha para enseñar conceptos relacionados
4. **Breve:** Máximo 2-3 líneas

### Dificultad

**Fácil (1):**
- Conceptos básicos
- Respuestas directas
- Para usuarios nuevos

**Media (2):**
- Requiere razonamiento
- Conceptos intermedios
- Mayoría de preguntas

**Difícil (3):**
- Casos complejos
- Requiere conocimiento profundo
- Situaciones poco comunes

### Imágenes

1. **Relevancia:** Solo si añade valor a la pregunta
2. **Calidad:** Imágenes nítidas y claras
3. **Tamaño:** Optimiza antes de subir (< 1 MB ideal)
4. **Derechos:** Asegúrate de tener permiso para usarla

---

## Solución de Problemas

### "No tienes permisos de administrador"

**Problema:** Al acceder a `/admin` aparece este error

**Solución:**
1. Verifica que iniciaste sesión con el usuario `admin`
2. Comprueba que el campo `is_admin` en la BD sea `1`
3. Cierra sesión y vuelve a iniciar

### "Error al subir imagen"

**Problemas comunes:**

1. **Imagen muy grande:**
   - Reduce el tamaño a menos de 5 MB
   - Usa herramientas online como TinyPNG

2. **Formato no soportado:**
   - Convierte a JPG o PNG
   - Evita formatos exóticos

3. **Permisos del servidor:**
   - Verifica que la carpeta `server/uploads/` exista
   - Comprueba permisos de escritura

### "No se puede eliminar la pregunta"

**Problema:** Aparece error al intentar eliminar

**Solución:**
- Esta pregunta ya fue usada en cuestionarios
- No se puede eliminar por integridad de datos
- Alternativa: Edítala en lugar de eliminarla

### La imagen no se muestra

**Posibles causas:**

1. **Ruta incorrecta:**
   - Verifica que `image_url` empiece con `/uploads/`
   - Ejemplo correcto: `/uploads/imagen-1234567890.jpg`

2. **Archivo no existe:**
   - Verifica que el archivo esté en `server/uploads/`
   - Vuelve a subir la imagen

3. **Servidor no sirve estáticos:**
   - Verifica en `server/index.js`:
   ```javascript
   app.use('/uploads', express.static('uploads'));
   ```

---

## Permisos y Seguridad

### Middleware de Seguridad

Todas las rutas de administración están protegidas por dos middlewares:

1. **authMiddleware:** Verifica que el usuario esté autenticado
2. **adminMiddleware:** Verifica que `is_admin === 1`

### Crear Nuevos Administradores

**Opción 1: Desde la BD**
```sql
UPDATE users SET is_admin = 1 WHERE username = 'nombre_usuario';
```

**Opción 2: Modificar seed.js**
```javascript
// En server/config/seed.js
export const SEED_DATA = {
  adminUser: {
    username: 'nuevo_admin',
    email: 'nuevo@admin.com',
    password: 'password_seguro',
    is_admin: 1
  }
};
```

### Recomendaciones de Seguridad

1. **Cambiar contraseña:** Cambia `admin123` por una segura
2. **Limitar acceso:** Solo da permisos a usuarios de confianza
3. **Backup regular:** Haz copias de seguridad de la BD
4. **Logs:** Revisa los logs del servidor periódicamente
5. **HTTPS:** Usa HTTPS en producción

---

## API de Administración

Si necesitas automatizar tareas, usa la API directamente:

### Obtener todas las preguntas
```bash
curl -X GET http://localhost:3000/api/admin/questions \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Crear pregunta
```bash
curl -X POST http://localhost:3000/api/admin/questions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category_id": 1,
    "question_text": "¿Pregunta?",
    "option_a": "Opción A",
    "option_b": "Opción B",
    "option_c": "Opción C",
    "correct_answer": "A",
    "explanation": "Explicación",
    "difficulty": 2
  }'
```

### Subir imagen
```bash
curl -X POST http://localhost:3000/api/admin/upload-image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/ruta/a/imagen.jpg"
```

### Actualizar pregunta
```bash
curl -X PUT http://localhost:3000/api/admin/questions/1 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "question_text": "Pregunta modificada",
    "explanation": "Nueva explicación"
  }'
```

### Eliminar pregunta
```bash
curl -X DELETE http://localhost:3000/api/admin/questions/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Mantenimiento

### Limpieza de Imágenes Huérfanas

Con el tiempo pueden quedar imágenes no utilizadas:

```bash
# En Linux/Mac
cd server/uploads
ls -la

# Eliminar manualmente las no utilizadas
rm imagen-no-usada.jpg
```

### Optimización de BD

Si la base de datos crece mucho:

```sql
-- Vacuum para optimizar
VACUUM;

-- Reindex para mejorar rendimiento
REINDEX;
```

### Backup de Preguntas

```bash
# Exportar preguntas a JSON
sqlite3 database.sqlite "SELECT * FROM questions" -json > backup-questions.json

# Copiar BD completa
cp server/database.sqlite backups/database-$(date +%Y%m%d).sqlite
```

---

## Recursos Adicionales

- **README.md:** Guía general de la aplicación
- **QUICKSTART.md:** Inicio rápido
- **DEVELOPMENT_GUIDE.md:** Guía para desarrolladores
- **server/config/seed.js:** Configuración de datos iniciales
- **server/routes/admin.js:** Código fuente de rutas admin

---

**¿Necesitas ayuda?** Revisa los logs del servidor para más detalles de errores.
