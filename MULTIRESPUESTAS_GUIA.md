# Guía de Múltiples Respuestas Correctas

## 📋 Descripción

El sistema ahora soporta preguntas con **múltiples respuestas correctas**. Esto permite crear preguntas más complejas donde el usuario debe seleccionar todas las opciones correctas para acertar.

## 🔧 Migración de Base de Datos

Si ya tienes una base de datos existente, ejecuta el siguiente comando para aplicar la migración:

```bash
npm run migrate
```

Este comando modificará las columnas necesarias para soportar múltiples respuestas:
- `questions.correct_answer`: VARCHAR(1) → TEXT
- `user_answers.user_answer`: VARCHAR(1) → TEXT

## ✏️ Crear Preguntas con Múltiples Respuestas

### Opción 1: Formulario del Admin

1. Ve al panel de administración
2. Haz clic en "Nueva Pregunta"
3. En la sección **"Respuesta(s) Correcta(s)"**, selecciona múltiples checkboxes
4. Las opciones seleccionadas serán las respuestas correctas
5. Guarda la pregunta

**Indicadores visuales:**
- Verás un mensaje informativo mostrando cuántas respuestas correctas has seleccionado
- En el listado, las preguntas con múltiples respuestas mostrarán un badge "✓" en cada opción correcta

### Opción 2: Importar desde JSON

Utiliza el formato JSON con el campo `correct_answer` conteniendo las respuestas separadas por comas:

```json
[
  {
    "question_number": 1,
    "category_id": 1,
    "question_text": "¿Cuáles de las siguientes son señales de prohibición?",
    "option_a": "Señal de stop",
    "option_b": "Señal de velocidad máxima",
    "option_c": "Señal de prohibido estacionar",
    "correct_answer": "B,C",
    "explanation": "Las respuestas B y C son correctas",
    "difficulty": 2,
    "needs_image": false
  },
  {
    "question_number": 2,
    "question_text": "Pregunta con una sola respuesta",
    "option_a": "Opción A",
    "option_b": "Opción B correcta",
    "option_c": "Opción C",
    "correct_answer": "B",
    "explanation": "Solo B es correcta",
    "difficulty": 1,
    "needs_image": false
  }
]
```

**Formatos válidos para `correct_answer`:**
- Una respuesta: `"A"` o `"B"` o `"C"`
- Dos respuestas: `"A,B"` o `"B,C"` o `"A,C"`
- Tres respuestas: `"A,B,C"`

## 🎮 Realizar el Cuestionario

### Comportamiento del Usuario

1. Al iniciar un cuestionario, el usuario puede seleccionar las opciones normalmente
2. **Primera selección**: Se marca una opción individual
3. **Segunda selección en otra opción**: El sistema detecta múltiple selección y activa el "modo múltiple"
4. En modo múltiple:
   - Las opciones seleccionadas tienen un borde verde y fondo especial
   - Aparece un mensaje informativo mostrando cuántas opciones se han seleccionado
   - Se puede hacer clic en cualquier opción para agregarla o removerla
   - Debe haber al menos una opción seleccionada

### Indicadores Visuales

- **Modo Simple**: Borde azul en la opción seleccionada
- **Modo Múltiple**: Borde verde en todas las opciones seleccionadas
- **Información**: Mensaje azul indicando el número de respuestas seleccionadas

## ✅ Evaluación de Respuestas

El sistema evalúa las respuestas de la siguiente manera:

- **Pregunta Simple (1 respuesta correcta)**: 
  - ✓ Correcto si seleccionó la opción correcta
  - ✗ Incorrecto si seleccionó otra opción

- **Pregunta Múltiple (2+ respuestas correctas)**:
  - ✓ Correcto **SOLO** si seleccionó **TODAS** las opciones correctas
  - ✗ Incorrecto si:
    - Faltó alguna opción correcta
    - Incluyó alguna opción incorrecta
    - Seleccionó solo algunas de las correctas

**Ejemplo:**
- Respuestas correctas: `A,B,C`
- Usuario selecciona: `A,B` → **INCORRECTO** (faltó C)
- Usuario selecciona: `A,B,C` → **CORRECTO**
- Usuario selecciona: `A,B,C` pero también marca incorrectas → **Imposible**, solo hay 3 opciones

## 📊 Visualización de Resultados

En la página de resultados:
- Las respuestas correctas se muestran con fondo verde
- Las respuestas incorrectas del usuario se muestran con fondo rojo
- Si era una pregunta de múltiples respuestas, se muestra un indicador informativo

## 📁 Archivo de Ejemplo

Consulta el archivo `preguntas_multirespuesta_ejemplo.json` en la raíz del proyecto para ver 10 ejemplos completos de preguntas con:
- Respuestas simples
- Respuestas múltiples (2 opciones)
- Respuestas múltiples (3 opciones)

## 🔍 Iconos en el Panel Admin

El sistema muestra iconos de estado para cada pregunta:
- ✓ Verde: Pregunta completa y bien configurada
- 🖼️ Rojo: Falta imagen (cuando `needs_image = true`)
- ⚠️ Amarillo: Falta explicación
- #? Morado: Falta número de pregunta

## 💡 Consejos

1. **Claridad**: En preguntas múltiples, indica claramente en el enunciado que puede haber más de una respuesta correcta
2. **Dificultad**: Las preguntas de múltiples respuestas suelen ser más difíciles, considera ajustar el nivel
3. **Explicación**: Proporciona explicaciones detalladas indicando por qué cada opción es o no correcta
4. **Balance**: No hagas todas las preguntas de múltiple respuesta, mantén un balance

## 🐛 Resolución de Problemas

### La migración falla
- Verifica que PostgreSQL esté ejecutándose
- Confirma las credenciales en el archivo `.env`
- Si las columnas ya son TEXT, la migración ya se aplicó

### Las respuestas no se guardan correctamente
- Verifica que el formato del JSON sea correcto
- Asegúrate de que `correct_answer` no tenga espacios adicionales
- El sistema automáticamente limpia y normaliza las respuestas

### El frontend no muestra múltiples respuestas
- Asegúrate de haber actualizado tanto el backend como el frontend
- Reinicia el servidor y limpia la caché del navegador
- Verifica la consola del navegador para errores

## 📞 Soporte

Si encuentras problemas o tienes preguntas, revisa:
- Los logs del servidor
- La consola del navegador
- Los ejemplos en `preguntas_multirespuesta_ejemplo.json`
