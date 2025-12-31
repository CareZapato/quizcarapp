# 🎯 Sistema de Múltiples Respuestas Correctas

## Descripción

El sistema ahora soporta preguntas con **una o múltiples respuestas correctas**. Esto permite crear evaluaciones más completas y realistas.

## 📋 Características

### Para Administradores

- **Formulario mejorado**: Selección múltiple de respuestas correctas mediante checkboxes
- **Visualización clara**: Las preguntas con múltiples respuestas muestran badges especiales
- **Importación JSON**: Formato simple para cargar preguntas en lote
- **Validación automática**: El sistema verifica que haya al menos una respuesta correcta

### Para Estudiantes

- **Selección múltiple**: Click en múltiples opciones para responder
- **Indicador visual**: Se muestra cuando has seleccionado varias respuestas
- **Evaluación justa**: Solo se considera correcta si seleccionas TODAS las opciones correctas

## 🔧 Uso en el Panel Admin

### Crear/Editar Pregunta

1. En el formulario, verás checkboxes para "Respuesta(s) Correcta(s)"
2. Marca todas las opciones que sean correctas
3. El sistema mostrará cuántas respuestas has seleccionado
4. Debes marcar al menos una opción

### Importar JSON

El formato de importación soporta múltiples respuestas:

```json
{
  "question_number": 1,
  "question_text": "¿Cuáles son obligatorios?",
  "option_a": "Cinturón",
  "option_b": "Triángulos",
  "option_c": "Extintor",
  "correct_answer": "A,B,C",
  "explanation": "Todos son obligatorios",
  "category_id": 1,
  "difficulty": 2,
  "needs_image": false
}
```

**Formatos válidos para `correct_answer`:**
- Una respuesta: `"A"`, `"B"`, o `"C"`
- Múltiples respuestas: `"A,B"`, `"B,C"`, `"A,B,C"`
- El orden no importa: `"B,A"` es igual a `"A,B"`

### Flujo de Importación Mejorado

1. Click en "📥 Importar JSON"
2. Pega tu JSON en el textarea
3. Click en "✓ Importar Preguntas"
4. **Nuevo**: El formulario permanece abierto
5. Puedes pegar más preguntas y repetir el proceso
6. Click en "✕ Cerrar" cuando termines

## 🎮 Uso en el Cuestionario

### Responder Preguntas

1. **Primera selección**: Click en una opción la selecciona
2. **Múltiple selección**: Click en otra opción agrega a la selección
3. **Deseleccionar**: Click en una opción seleccionada la quita
4. **Indicador**: Verás "Has seleccionado X respuestas" cuando hay múltiples

### Evaluación

- La respuesta se considera **correcta** solo si:
  - Seleccionaste TODAS las opciones correctas
  - NO seleccionaste ninguna opción incorrecta
  
- Ejemplos:
  - Correctas: A,B → Seleccionaste: A,B ✅
  - Correctas: A,B → Seleccionaste: A ❌
  - Correctas: A,B → Seleccionaste: A,B,C ❌

## 📊 Base de Datos

### Cambios Técnicos

Las siguientes columnas fueron modificadas para soportar múltiples valores:

- `questions.correct_answer`: `VARCHAR(1)` → `TEXT`
- `user_answers.user_answer`: `VARCHAR(1)` → `TEXT`

### Migración Automática

El sistema detecta automáticamente si necesita actualizar la estructura:

```bash
npm run migrate
```

O al iniciar el servidor, se ejecuta automáticamente:
- Verifica la estructura de las tablas
- Actualiza columnas si es necesario
- No afecta datos existentes

## 🎯 Ejemplos de Uso

### Ejemplo 1: Señales de Tráfico (Múltiple)

```json
{
  "question_text": "¿Cuáles son señales de prohibición?",
  "option_a": "STOP",
  "option_b": "Ceda el paso",
  "option_c": "No estacionar",
  "correct_answer": "A,C"
}
```

### Ejemplo 2: Norma Simple (Única)

```json
{
  "question_text": "¿Cuál es el límite en zona urbana?",
  "option_a": "40 km/h",
  "option_b": "50 km/h",
  "option_c": "60 km/h",
  "correct_answer": "B"
}
```

### Ejemplo 3: Seguridad (Triple)

```json
{
  "question_text": "¿Qué es obligatorio en el vehículo?",
  "option_a": "Cinturón",
  "option_b": "Triángulos",
  "option_c": "Botiquín",
  "correct_answer": "A,B,C"
}
```

## 🔍 Iconos y Visualización

En el panel de admin verás:
- ✓ Verde: Pregunta completa y sin errores
- 🖼️ Rojo: Falta imagen (cuando `needs_image: true`)
- ⚠️ Amarillo: Falta explicación
- #? Morado: Falta número de pregunta

Para preguntas con múltiples respuestas:
- Badge "✓" en cada opción correcta
- Mensaje "Esta pregunta tiene X respuestas correctas"

## 💡 Consejos

1. **Usa múltiples respuestas** para preguntas donde varias opciones son válidas
2. **No abuses**: No todas las preguntas deben tener múltiples respuestas
3. **Explicaciones claras**: Indica por qué cada opción es correcta o incorrecta
4. **Dificultad apropiada**: Las preguntas múltiples suelen ser más difíciles
5. **Importa en lotes**: El nuevo sistema permite importar varios JSON seguidos

## 🚀 Archivo de Ejemplo

Revisa `preguntas_multi_respuesta_ejemplo.json` para ver 10 preguntas de ejemplo que incluyen:
- Preguntas de respuesta única
- Preguntas de respuesta doble
- Preguntas de respuesta triple
- Diferentes categorías y dificultades

## 📝 Notas Técnicas

- Las respuestas se almacenan como texto separado por comas
- La comparación es insensible a mayúsculas: "a,b" = "A,B"
- El orden no importa: "B,A" = "A,B"
- Los espacios se eliminan automáticamente: "A, B" = "A,B"
- Validación tanto en frontend como backend

## ❓ Preguntas Frecuentes

**¿Puedo convertir una pregunta de única a múltiple?**
Sí, simplemente edita la pregunta y marca más opciones correctas.

**¿Puedo importar preguntas nuevas sin borrar las existentes?**
Sí, la importación solo agrega preguntas nuevas, no borra las existentes.

**¿El sistema detecta respuestas duplicadas?**
El backend valida y normaliza las respuestas automáticamente.

**¿Qué pasa con las preguntas antiguas?**
Se mantienen funcionando normalmente. Si tenían respuesta única (ej: "A"), siguen funcionando igual.
