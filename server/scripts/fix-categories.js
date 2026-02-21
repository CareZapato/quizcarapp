import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../config/preguntas-backup-base.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

// Palabras clave por categoría
const keywords = {
  1: { // Señales de Tráfico
    keywords: ['señal', 'semáforo', 'luz', 'indicador', 'cartel', 'símbolo', 'línea amarilla', 'línea blanca', 'demarcación', 'marca vial', 'flecha', 'señalización', 'poste', 'panel'],
    exclude: ['señal de advertencia de peligro', 'luces de advertencia']
  },
  2: { // Normas de Circulación
    keywords: ['velocidad', 'adelantar', 'sobrepaso', 'carril', 'pista', 'conducir', 'circulación', 'estacionar', 'detener', 'girar', 'cruzar', 'intersección', 'rotonda', 'prioridad', 'ceda el paso', 'derecho de vía', 'distancia', 'seguimiento', 'autopista', 'curva', 'pendiente', 'prohibido', 'permitido', 'debe', 'puede', 'alcohol', 'alcoholemia', 'licencia', 'conductor novato'],
    exclude: ['distancia de frenado', 'distancia de seguridad en lluvia']
  },
  3: { // Seguridad Vial
    keywords: ['seguridad', 'peligro', 'riesgo', 'accidente', 'colisión', 'fatiga', 'cansancio', 'sueño', 'visibilidad', 'lluvia', 'niebla', 'hielo', 'nieve', 'mojado', 'resbaladizo', 'aquaplaning', 'hidroplaneo', 'niños', 'peatón', 'pasajero', 'bebé', 'ancianos', 'casco', 'chaleco reflectante', 'triángulo', 'baliza', 'distancia de seguridad'],
    exclude: []
  },
  4: { // Mecánica Básica
    keywords: ['motor', 'aceite', 'refrigerante', 'radiador', 'batería', 'alternador', 'neumático', 'llanta', 'presión', 'freno', 'embrague', 'transmisión', 'combustible', 'gasolina', 'diesel', 'filtro', 'bujía', 'correa', 'válvula', 'pistón', 'cigüeñal', 'escape', 'catalizador', 'suspensión', 'amortiguador', 'dirección', 'alineación', 'balanceo'],
    exclude: ['freno abs', 'sistema de frenos', 'líquido de freno']
  },
  5: { // Primeros Auxilios
    keywords: ['primeros auxilios', 'herida', 'hemorragia', 'sangre', 'fractura', 'quemadura', 'shock', 'reanimación', 'rcp', 'respiración', 'pulso', 'inconsciente', 'vendaje', 'torniquete', 'ambulancia', 'emergencia médica', 'lesión', 'traumatismo'],
    exclude: []
  },
  6: { // Sistemas y Equipos del Vehículo
    keywords: ['cinturón de seguridad', 'airbag', 'bolsa de aire', 'apoya-cabeza', 'reposacabezas', 'frenos abs', 'sistema de frenos', 'luces', 'faro', 'luz de freno', 'intermitente', 'neblinera', 'espejo', 'retrovisor', 'parabrisas', 'limpia parabrisas', 'desempañador', 'aire acondicionado', 'calefacción', 'bocina', 'claxon', 'alarma', 'panel de instrumentos', 'velocímetro', 'tacómetro', 'tablero'],
    exclude: []
  }
};

function analyzeQuestion(question) {
  const text = (question.question_text + ' ' + 
    (question.option_a || '') + ' ' + 
    (question.option_b || '') + ' ' + 
    (question.option_c || '') + ' ' + 
    (question.option_d || '') + ' ' + 
    (question.option_e || '') + ' ' + 
    (question.explanation || '')).toLowerCase();

  const scores = {};
  
  // Calcular score para cada categoría
  for (const [catId, catData] of Object.entries(keywords)) {
    let score = 0;
    
    // Verificar exclusiones primero
    const excluded = catData.exclude.some(exc => text.includes(exc.toLowerCase()));
    if (excluded) continue;
    
    // Contar keywords
    for (const keyword of catData.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score++;
      }
    }
    
    scores[catId] = score;
  }
  
  // Encontrar la categoría con mayor score
  let bestCategory = question.category_id;
  let maxScore = 0;

  for (const [catId, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = parseInt(catId, 10);
    }
  }

  // Si no hay coincidencias con ninguna categoría, mantener la original
  if (maxScore === 0) {
    return question.category_id;
  }

  // Si hay al menos una coincidencia, usar la categoría con mejor score
  return bestCategory;
}

const changes = [];
const categoryCounts = { before: {}, after: {} };

// Inicializar contadores
for (let i = 0; i <= 6; i++) {
  categoryCounts.before[i] = 0;
  categoryCounts.after[i] = 0;
}

// Contar categorías antes
data.questions.forEach(q => {
  categoryCounts.before[q.category_id]++;
});

// Revisar y corregir cada pregunta
data.questions.forEach((question, index) => {
  const oldCategory = question.category_id;
  const newCategory = analyzeQuestion(question);
  
  if (oldCategory !== newCategory) {
    const oldCatName = data.categories.find(c => c.id === oldCategory)?.name || 'Desconocido';
    const newCatName = data.categories.find(c => c.id === newCategory)?.name || 'Desconocido';
    
    changes.push({
      questionNumber: question.question_number,
      questionText: question.question_text.substring(0, 80) + '...',
      oldCategory: `${oldCatName} (ID: ${oldCategory})`,
      newCategory: `${newCatName} (ID: ${newCategory})`,
      reason: `Contenido coincide mejor con ${newCatName}`
    });
    
    question.category_id = newCategory;
  }
  
  categoryCounts.after[question.category_id]++;
});

// Guardar archivo actualizado
fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

// Generar reporte
console.log('\n═══════════════════════════════════════════════════════════');
console.log('          REPORTE DE CORRECCIÓN DE CATEGORÍAS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`Total de preguntas analizadas: ${data.questions.length}`);
console.log(`Total de cambios realizados: ${changes.length}\n`);

if (changes.length > 0) {
  console.log('─────────────────────────────────────────────────────────');
  console.log('PREGUNTAS MODIFICADAS:');
  console.log('─────────────────────────────────────────────────────────\n');
  
  changes.forEach((change, i) => {
    console.log(`${i + 1}. Pregunta #${change.questionNumber}`);
    console.log(`   Texto: "${change.questionText}"`);
    console.log(`   Anterior: ${change.oldCategory}`);
    console.log(`   Nueva: ${change.newCategory}`);
    console.log(`   Razón: ${change.reason}\n`);
  });
}

console.log('─────────────────────────────────────────────────────────');
console.log('ESTADÍSTICAS POR CATEGORÍA:');
console.log('─────────────────────────────────────────────────────────\n');

data.categories.forEach(cat => {
  const before = categoryCounts.before[cat.id];
  const after = categoryCounts.after[cat.id];
  const diff = after - before;
  const diffStr = diff > 0 ? `+${diff}` : diff.toString();
  
  console.log(`${cat.name} (ID ${cat.id}):`);
  console.log(`  Antes: ${before} preguntas`);
  console.log(`  Después: ${after} preguntas`);
  console.log(`  Cambio: ${diffStr}\n`);
});

console.log('─────────────────────────────────────────────────────────');
console.log('RESUMEN:');
console.log('─────────────────────────────────────────────────────────\n');

console.log(`✓ Archivo actualizado: ${jsonPath}`);
console.log(`✓ ${changes.length} categorías fueron corregidas`);
console.log(`✓ Distribución de categorías mejorada\n`);

console.log('═══════════════════════════════════════════════════════════\n');
