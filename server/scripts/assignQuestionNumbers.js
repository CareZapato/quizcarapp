import { dbAll, dbRun } from '../config/database.js';

async function assignQuestionNumbers() {
  try {
    console.log('🔢 Asignando números a las preguntas...');
    
    // Obtener todas las preguntas ordenadas por ID
    const questions = await dbAll('SELECT id FROM questions ORDER BY id');
    
    console.log(`Encontradas ${questions.length} preguntas`);
    
    // Asignar números secuenciales
    for (let i = 0; i < questions.length; i++) {
      const questionNumber = i + 1;
      await dbRun(
        'UPDATE questions SET question_number = $1 WHERE id = $2',
        [questionNumber, questions[i].id]
      );
      
      if ((i + 1) % 50 === 0) {
        console.log(`Procesadas ${i + 1} preguntas...`);
      }
    }
    
    console.log(`✅ ${questions.length} preguntas numeradas exitosamente`);
    
    // Verificar
    const sample = await dbAll('SELECT id, question_number FROM questions LIMIT 5');
    console.log('Muestra:', sample);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

assignQuestionNumbers();
