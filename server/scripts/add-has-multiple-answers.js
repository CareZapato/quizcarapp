import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'quizcarbd',
});

/**
 * Script para agregar columna has_multiple_answers a la tabla questions
 */

async function migrate() {
  console.log('🔧 Agregando columna has_multiple_answers...\n');

  try {
    // Verificar conexión
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión a base de datos establecida\n');

    // Verificar si la columna ya existe
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'has_multiple_answers'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('⚠️  La columna has_multiple_answers ya existe');
    } else {
      // Agregar columna has_multiple_answers
      console.log('📝 Agregando columna has_multiple_answers...');
      await pool.query('ALTER TABLE questions ADD COLUMN has_multiple_answers BOOLEAN DEFAULT FALSE');
      console.log('✅ Columna has_multiple_answers agregada\n');
    }

    // Actualizar registros existentes basándose en correct_answer
    console.log('📝 Actualizando registros existentes...');
    await pool.query(`
      UPDATE questions 
      SET has_multiple_answers = TRUE 
      WHERE correct_answer LIKE '%,%'
    `);
    console.log('✅ Registros actualizados\n');

    // Verificar cambios
    console.log('🔍 Verificando cambios...');
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN has_multiple_answers = TRUE THEN 1 END) as multiple_answers,
        COUNT(CASE WHEN has_multiple_answers = FALSE THEN 1 END) as single_answer
      FROM questions
    `);
    
    console.log('Estadísticas:', result.rows[0]);
    console.log('\n✅ ¡Migración completada exitosamente!\n');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    await pool.end();
    process.exit(1);
  }
}

migrate();
