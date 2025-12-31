# Sistema de Importación y Complementación de Preguntas

## 📋 Actualización: Soporte para 5 Opciones (A, B, C, D, E)

La aplicación ahora soporta preguntas con hasta **5 opciones de respuesta** (A, B, C, D y E).

### Cambios Implementados:

✅ Base de datos actualizada con columnas `option_d` y `option_e`  
✅ Formulario de admin con campos para opciones D y E (opcionales)  
✅ Checkboxes para seleccionar D y E como respuestas correctas  
✅ Quiz muestra automáticamente las opciones D y E cuando existen  
✅ Resultados muestran todas las opciones disponibles  
✅ Exportación incluye option_d y option_e  
✅ Diseño minimalista mejorado para móviles en el mapa de preguntas  

---

## 🔄 Sistema de Complementación por Número de Pregunta

El nuevo endpoint `/admin/import-questions` ahora **complementa** preguntas existentes basándose en el **`question_number`** en lugar de reemplazarlas completamente.

### Funcionamiento:

1. **Si la pregunta existe** (mismo `question_number`):
   - ✅ Se **actualizan** solo los campos proporcionados en el JSON
   - ✅ Los campos vacíos/nulos se **ignoran** (mantienen valor anterior)
   - ✅ Perfecto para agregar opciones D y E a preguntas existentes

2. **Si la pregunta NO existe**:
   - ✅ Se **inserta** como nueva pregunta
   - ⚠️ Requiere campos mínimos: `question_text`, `option_a`, `option_b`, `option_c`, `correct_answer`

---

## 📝 Ejemplos de Uso

### Ejemplo 1: Agregar Opciones D y E a Preguntas Existentes

```json
{
  "questions": [
    {
      "question_number": 1,
      "option_d": "Cuarta alternativa",
      "option_e": "Quinta alternativa"
    },
    {
      "question_number": 2,
      "option_d": "Solo agregar opción D"
    }
  ]
}
```

**Resultado:**
- Pregunta #1: Se agregan opciones D y E, mantiene texto, A, B, C, respuesta correcta, etc.
- Pregunta #2: Se agrega solo opción D, mantiene todo lo demás intacto

---

### Ejemplo 2: Actualizar Respuesta Correcta para Incluir Opciones D/E

```json
{
  "questions": [
    {
      "question_number": 5,
      "option_d": "Nueva opción D",
      "correct_answer": "A,D"
    },
    {
      "question_number": 10,
      "option_e": "Nueva opción E",
      "correct_answer": "B,E"
    }
  ]
}
```

**Resultado:**
- Pregunta #5: Agrega opción D y actualiza respuesta correcta a "A,D"
- Pregunta #10: Agrega opción E y actualiza respuesta correcta a "B,E"

---

### Ejemplo 3: Modificar Solo Texto de Pregunta

```json
{
  "questions": [
    {
      "question_number": 15,
      "question_text": "Texto mejorado de la pregunta 15"
    }
  ]
}
```

**Resultado:**
- Pregunta #15: Solo se actualiza el texto, mantiene todas las opciones y respuestas

---

### Ejemplo 4: Actualizar Múltiples Campos

```json
{
  "questions": [
    {
      "question_number": 20,
      "option_d": "Opción D añadida",
      "option_e": "Opción E añadida",
      "correct_answer": "C,D,E",
      "explanation": "Explicación actualizada con múltiples respuestas correctas",
      "difficulty": 3
    }
  ]
}
```

**Resultado:**
- Pregunta #20: Agrega D y E, actualiza respuesta correcta a 3 opciones, nueva explicación, dificultad 3

---

## 🎯 Campos Soportados en Complementación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `question_number` | Requerido | Identificador único para buscar la pregunta |
| `question_text` | Opcional | Texto de la pregunta |
| `option_a` | Opcional | Primera opción (A) |
| `option_b` | Opcional | Segunda opción (B) |
| `option_c` | Opcional | Tercera opción (C) |
| `option_d` | Opcional | **Cuarta opción (D)** - Nueva! |
| `option_e` | Opcional | **Quinta opción (E)** - Nueva! |
| `correct_answer` | Opcional | Respuesta(s) correcta(s): "A", "B,C", "A,D,E", etc. |
| `explanation` | Opcional | Explicación de la respuesta |
| `category_id` | Opcional | ID de categoría (1-6) |
| `difficulty` | Opcional | Nivel de dificultad (1-3) |
| `needs_image` | Opcional | true/false - Si requiere imagen |
| `image_url` | Opcional | URL de la imagen |

---

## 🚀 Cómo Usar en la Interfaz de Admin

1. **Ir a la sección Admin** en la aplicación
2. **Clic en "📥 Importar JSON"**
3. **Pegar o escribir tu JSON** con las preguntas a complementar
4. **Click en "Importar Preguntas"**
5. **Ver resultado**:
   - ✅ Preguntas nuevas insertadas
   - ✅ Preguntas actualizadas/complementadas
   - ⚠️ Errores (si los hay)

---

## 📦 Respuesta del Endpoint

```json
{
  "success": true,
  "importedCount": 5,
  "updatedCount": 12,
  "skippedCount": 0,
  "message": "5 preguntas nuevas insertadas, 12 preguntas actualizadas/complementadas, 0 omitidas."
}
```

---

## 💡 Tips y Mejores Prácticas

1. **Complementar gradualmente**: Puedes hacer múltiples importaciones pequeñas
2. **Usar `question_number`**: Asegúrate de usar el número correcto de pregunta
3. **Exportar primero**: Usa "📤 Exportar JSON" para ver la estructura actual
4. **Campos vacíos**: Si no incluyes un campo, se mantiene el valor anterior
5. **Respuestas múltiples**: Separar con comas: "A,C,D"
6. **Validación**: El sistema valida campos requeridos solo para preguntas nuevas

---

## 📱 Diseño Minimalista Móvil

En dispositivos móviles (< 480px):
- Grid de preguntas más compacto (100px mínimo)
- Preview de texto oculto para maximizar espacio
- Badges más pequeños y compactos
- Botones de acción optimizados
- Layout de 2-3 columnas según ancho de pantalla

---

## 🔧 Solución de Problemas

### Error: "Falta el número de pregunta"
**Solución**: Cada objeto en el array debe tener `question_number`

### Error: "Nueva pregunta requiere: question_text, option_a..."
**Solución**: Si la pregunta no existe, debes proporcionar campos mínimos

### Pregunta no se actualiza
**Solución**: Verifica que `question_number` coincida exactamente con la base de datos

---

## 📄 Archivo de Ejemplo

Ver: `ejemplo_complementar_opciones.json` en la raíz del proyecto

---

## 🆕 Changelog

### Versión 2.0 (Actual)
- ✅ Soporte para opciones D y E
- ✅ Sistema de complementación por question_number
- ✅ Actualización parcial de campos
- ✅ Diseño minimalista móvil mejorado
- ✅ Export/Import incluye todas las opciones

### Versión 1.0 (Anterior)
- ⚠️ Solo 3 opciones (A, B, C)
- ⚠️ Import reemplazaba preguntas completas
