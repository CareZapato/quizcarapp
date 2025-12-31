# 🚀 INSTRUCCIONES RÁPIDAS - Actualización Opciones D y E

## ✅ ¿Qué se actualizó?

**TODO el sistema ahora soporta preguntas con 5 opciones (A, B, C, D, E):**

1. ✅ Base de datos actualizada automáticamente al iniciar servidor
2. ✅ Importación JSON (complementar) soporta D y E
3. ✅ Importación completa (replaceAll) soporta D y E
4. ✅ Exportación incluye D y E
5. ✅ Diseño móvil minimalista en mapa de preguntas

---

## 🎯 Para Empezar (Solo 2 pasos)

### 1. Iniciar el Servidor

```bash
cd server
npm start
```

**Verás en la consola:**
```
✅ Columna option_d agregada   (o "ya existe")
✅ Columna option_e agregada   (o "ya existe")
🎉 Base de datos verificada y lista
```

### 2. ¡Listo! Ya puedes usar D y E

- Ir a Admin → Crear/Editar preguntas con opciones D y E
- Importar JSONs con option_d y option_e
- Las preguntas se muestran automáticamente en Quiz y Resultados

---

## 📥 Importar Preguntas con D y E

### Método 1: Complementar preguntas existentes

1. Ve a **Admin → Importar JSON**
2. Usa este formato:

```json
{
  "questions": [
    {
      "question_number": 1,
      "option_d": "Cuarta alternativa",
      "option_e": "Quinta alternativa"
    },
    {
      "question_number": 5,
      "option_d": "Solo D para pregunta 5"
    }
  ]
}
```

3. Click **"Importar Preguntas"**
4. ✅ Las preguntas 1 y 5 ahora tienen opciones D/E (mantienen todo lo demás)

---

### Método 2: Importación completa (reemplaza todo)

⚠️ **ADVERTENCIA:** Esto **BORRA** todas las preguntas actuales

```json
{
  "replaceAll": true,
  "questions": [
    {
      "question_text": "¿Pregunta nueva?",
      "option_a": "Primera",
      "option_b": "Segunda",
      "option_c": "Tercera",
      "option_d": "Cuarta",
      "option_e": "Quinta",
      "correct_answer": "A,D",
      "category_id": 1,
      "difficulty": 1
    }
  ]
}
```

---

## 📤 Exportar Preguntas

1. Admin → **"Exportar JSON"**
2. El JSON descargado **ya incluye** option_d y option_e:

```json
{
  "questions": [
    {
      "option_a": "...",
      "option_b": "...",
      "option_c": "...",
      "option_d": "...",  ← YA INCLUIDO
      "option_e": "..."   ← YA INCLUIDO
    }
  ]
}
```

---

## 🎨 Interfaz Admin

### Crear/Editar Pregunta

**Campos disponibles:**
- ✅ Opción A (obligatoria)
- ✅ Opción B (obligatoria)
- ✅ Opción C (obligatoria)
- ✅ **Opción D (opcional)** ← NUEVO
- ✅ **Opción E (opcional)** ← NUEVO

**Respuestas correctas:**
- ☑️ Checkbox A
- ☑️ Checkbox B
- ☑️ Checkbox C
- ☑️ **Checkbox D** ← NUEVO
- ☑️ **Checkbox E** ← NUEVO

Puedes seleccionar **múltiples respuestas correctas** (ej: A, C y E)

---

## 📱 Quiz y Resultados

### Quiz
- Las preguntas **solo muestran** las opciones que tienen texto
- Si una pregunta tiene A, B, C, D (sin E) → Solo muestra 4 opciones
- Si tiene las 5 → Muestra todas

### Resultados
- Muestra todas las opciones disponibles
- Marca correctas/incorrectas igual que antes
- Soporta múltiples respuestas correctas con D y E

---

## 🔧 Si algo falla

### Problema: "Column option_d does not exist"

**Solución rápida:**
```bash
# En terminal (Windows)
cd server
SET PGPASSWORD=123456
node scripts/ensure-option-columns.js
```

**O simplemente reinicia el servidor:**
```bash
npm start
```

El servidor **verificará y agregará** las columnas automáticamente.

---

### Problema: Import no acepta option_d/option_e

**Verificar:**
1. Servidor actualizado y reiniciado
2. Columnas existen en base de datos:
   ```bash
   psql -U postgres testconduccion
   \d questions
   # Debe mostrar option_d y option_e
   ```

---

## 📚 Documentación Completa

- **Complementar preguntas:** `COMPLEMENTAR_PREGUNTAS.md`
- **Proceso de deploy:** `DEPLOY_OPCIONES_D_E.md`
- **Cambios técnicos:** `ACTUALIZACION_DEPLOY_v2.md`
- **Ejemplos JSON:** `ejemplo_complementar_opciones.json`

---

## ✅ Checklist Rápido

- [ ] Servidor iniciado (`npm start`)
- [ ] Logs muestran "✅ Columna option_d agregada" (o "ya existe")
- [ ] Logs muestran "✅ Columna option_e agregada" (o "ya existe")
- [ ] Admin muestra campos para D y E
- [ ] Importar JSON con D/E funciona
- [ ] Exportar JSON incluye D/E
- [ ] Quiz muestra opciones D/E cuando existen
- [ ] Resultados muestran D/E correctamente

---

## 🎉 ¡Y eso es todo!

El sistema ahora soporta **completamente** preguntas con hasta **5 opciones** (A, B, C, D, E).

Todo es **automático** - solo inicia el servidor y empieza a usar D y E.

**¿Dudas?** Consulta la documentación completa en los archivos .md mencionados arriba.

---

**Versión:** 2.0  
**Última actualización:** 31 de Diciembre, 2025
