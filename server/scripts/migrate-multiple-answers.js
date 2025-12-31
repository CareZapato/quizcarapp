import pool, { query } from '../config/database.js';

/**
 * Script de migración para agregar soporte de múltiples respuestas correctas
 * 
 * Cambios:
 * - Modificar columna correct_answer en tabla questions de VARCHAR(1) a TEXT
 * - Modificar columna user_answer en tabla user_answers de VARCHAR(1) a TEXT
 */

async function migrate() {
  console.log('🔧 Iniciando migración para múltiples respuestas...\n');

  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a base de datos establecida\n');

    // 1. Modificar tabla questions
    console.log('📝 Modificando tabla questions...');
    await query('ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT');
    console.log('✅ Columna correct_answer actualizada a TEXT\n');

    // 2. Modificar tabla user_answers
    console.log('📝 Modificando tabla user_answers...');
    await query('ALTER TABLE user_answers ALTER COLUMN user_answer TYPE TEXT');
    console.log('✅ Columna user_answer actualizada a TEXT\n');

    // 3. Verificar cambios
    console.log('🔍 Verificando cambios...');
    const questionsCheck = await query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'correct_answer'
    `);
    
    const answersCheck = await query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'user_answers' AND column_name = 'user_answer'
    `);

    console.log('Questions.correct_answer:', questionsCheck.rows[0]);
    console.log('User_answers.user_answer:', answersCheck.rows[0]);

    console.log('\n✅ ¡Migración completada exitosamente!');
    console.log('\n📋 Resumen de cambios:');
    console.log('  - questions.correct_answer: VARCHAR(1) → TEXT');
    console.log('  - user_answers.user_answer: VARCHAR(1) → TEXT');
    console.log('\n💡 Ahora puedes usar múltiples respuestas correctas separadas por comas:');
    console.log('   Ejemplo: "A,B" o "A,B,C"');
    console.log('\n📄 Revisa el archivo preguntas_multirespuesta_ejemplo.json para ejemplos\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    console.error('\n⚠️  Si el error indica que las columnas ya son de tipo TEXT,');
    console.error('   la migración ya fue aplicada anteriormente.\n');
    process.exit(1);
  }
}

migrate();
