# 📚 Banco de Preguntas de Ejemplo

Este archivo contiene ejemplos de preguntas adicionales que puedes añadir a tu base de datos.

## 🚦 Señales de Tráfico

### Pregunta 1
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (1, '¿Qué forma tienen las señales de prohibición?', 'Triangular', 'Circular', 'Rectangular', 'B', 'Las señales de prohibición son circulares con borde rojo.', 1);
```

### Pregunta 2
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (1, '¿Qué indica una línea continua en el centro de la calzada?', 'Se puede adelantar', 'Prohibido adelantar', 'Precaución', 'B', 'La línea continua indica prohibición de adelantar.', 1);
```

### Pregunta 3
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (1, '¿Qué significa una señal octogonal?', 'Ceda el paso', 'Stop obligatorio', 'Prohibición', 'B', 'La señal octogonal siempre es STOP.', 1);
```

## 🚗 Normas de Circulación

### Pregunta 4
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (2, '¿Cuál es la velocidad máxima en autopista para turismos?', '100 km/h', '120 km/h', '140 km/h', 'B', 'En autopista, los turismos pueden circular hasta 120 km/h.', 1);
```

### Pregunta 5
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (2, '¿Cuándo es obligatorio usar las luces de cruce?', 'Solo de noche', 'Entre el ocaso y el amanecer', 'En cualquier momento del día', 'B', 'Las luces de cruce son obligatorias desde el ocaso hasta el amanecer.', 2);
```

### Pregunta 6
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (2, '¿Está permitido usar el teléfono móvil mientras se conduce?', 'Sí, con manos libres', 'No, nunca', 'Solo en ciudad', 'A', 'Se permite usar el teléfono con sistema de manos libres.', 2);
```

### Pregunta 7
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (2, '¿Qué distancia de seguridad debe mantener en ciudad?', '2 metros', '5 metros', 'La que permita frenar sin colisión', 'C', 'Debe mantener una distancia que permita detenerse sin colisionar.', 2);
```

## 🛡️ Seguridad Vial

### Pregunta 8
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (3, '¿Cuándo debe usar el cinturón de seguridad?', 'En autopista', 'En ciudad', 'Siempre', 'C', 'El cinturón de seguridad es obligatorio en todos los trayectos.', 1);
```

### Pregunta 9
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (3, '¿Qué debe hacer si se encuentra con niebla densa?', 'Aumentar la velocidad', 'Reducir la velocidad y usar antiniebla', 'Mantener la velocidad', 'B', 'Con niebla debe reducir velocidad y usar luces antiniebla.', 2);
```

### Pregunta 10
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (3, '¿Qué efecto tiene el alcohol en la conducción?', 'Mejora los reflejos', 'Reduce los reflejos', 'No tiene efecto', 'B', 'El alcohol reduce los reflejos y la capacidad de reacción.', 1);
```

### Pregunta 11
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (3, '¿Es obligatorio llevar chaleco reflectante?', 'No', 'Sí, uno por ocupante', 'Solo el conductor', 'B', 'Es obligatorio llevar un chaleco por cada ocupante del vehículo.', 2);
```

## 🔧 Mecánica Básica

### Pregunta 12
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (4, '¿Qué indica la luz roja del salpicadero con símbolo de batería?', 'Batería baja', 'Problema de carga', 'Todo correcto', 'B', 'Indica un problema en el sistema de carga de la batería.', 2);
```

### Pregunta 13
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (4, '¿Con qué frecuencia debe cambiar el aceite del motor?', 'Cada mes', 'Según el fabricante', 'Cada año', 'B', 'El cambio de aceite debe hacerse según las recomendaciones del fabricante.', 2);
```

### Pregunta 14
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (4, '¿Cuál es la profundidad mínima del dibujo de los neumáticos?', '1 mm', '1.6 mm', '2 mm', 'B', 'La profundidad mínima legal es de 1.6 mm.', 2);
```

### Pregunta 15
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (4, '¿Qué líquido NO debe rellenarse con el motor caliente?', 'Aceite', 'Líquido refrigerante', 'Limpiaparabrisas', 'B', 'El refrigerante está presurizado y es peligroso abrirlo en caliente.', 3);
```

## 🚑 Primeros Auxilios

### Pregunta 16
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (5, '¿Qué significa PAS en primeros auxilios?', 'Pulso-Ambulancia-Síntomas', 'Proteger-Avisar-Socorrer', 'Presión-Asistir-Salvar', 'B', 'PAS es el protocolo: Proteger, Avisar, Socorrer.', 1);
```

### Pregunta 17
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (5, '¿Debe mover a un herido grave?', 'Siempre', 'Solo si hay peligro', 'Nunca', 'B', 'Solo debe moverse si existe peligro inminente (fuego, explosión).', 2);
```

### Pregunta 18
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (5, '¿Qué número debe marcar para emergencias en España?', '091', '112', '061', 'B', 'El 112 es el número único de emergencias en toda Europa.', 1);
```

### Pregunta 19
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (5, '¿Cómo se trata una quemadura leve?', 'Con hielo', 'Con agua fría', 'Con pomada', 'B', 'Las quemaduras leves se enfrían con agua fría durante 10-15 minutos.', 2);
```

### Pregunta 20
```sql
INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
VALUES (5, '¿Qué hacer ante una fractura?', 'Mover el miembro', 'Inmovilizar', 'Masajear', 'B', 'Ante una fractura se debe inmovilizar sin reducir.', 2);
```

## 🔄 Script para Insertar Todas las Preguntas

Puedes crear un archivo `server/scripts/addMoreQuestions.js`:

```javascript
import { dbRun } from '../config/database.js';

const questions = [
  {
    category_id: 1,
    question_text: '¿Qué forma tienen las señales de prohibición?',
    option_a: 'Triangular',
    option_b: 'Circular',
    option_c: 'Rectangular',
    correct_answer: 'B',
    explanation: 'Las señales de prohibición son circulares con borde rojo.',
    difficulty: 1
  },
  // ... copiar todas las preguntas aquí
];

async function addQuestions() {
  console.log('Añadiendo preguntas...');
  
  for (const q of questions) {
    try {
      await dbRun(
        `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, difficulty)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.category_id, q.question_text, q.option_a, q.option_b, q.option_c, q.correct_answer, q.explanation, q.difficulty]
      );
      console.log(`✓ Pregunta añadida: ${q.question_text.substring(0, 50)}...`);
    } catch (error) {
      console.error(`✗ Error: ${error.message}`);
    }
  }
  
  console.log('¡Proceso completado!');
  process.exit(0);
}

addQuestions();
```

Ejecutar con:
```bash
node server/scripts/addMoreQuestions.js
```

## 📝 Niveles de Dificultad

- **1:** Básico - Conocimientos elementales
- **2:** Intermedio - Conocimientos específicos
- **3:** Avanzado - Situaciones complejas

## 💡 Tips para Crear Buenas Preguntas

1. **Clara y concisa:** La pregunta debe entenderse fácilmente
2. **Una sola respuesta correcta:** Evitar ambigüedades
3. **Opciones plausibles:** Todas las opciones deben parecer posibles
4. **Explicación útil:** Ayuda al aprendizaje
5. **Relevante:** Relacionada con la conducción real
6. **Verificada:** Asegurar que la información es correcta

## 🎯 Categorías Recomendadas para Más Preguntas

- Prioridad de paso
- Estacionamiento
- Conducción nocturna
- Conducción en condiciones adversas
- Vehículos especiales (motos, camiones)
- Documentación del vehículo
- Infracciones y sanciones
- Medio ambiente
- Conducción eficiente

---

**¡Con estas preguntas ya puedes tener un cuestionario más completo! 🎓**
