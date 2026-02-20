/**
 * Script para agregar índice único parcial que previene múltiples quizzes activos
 * Garantiza que un usuario solo pueda tener un quiz con status 'en_curso' a la vez
 */

console.log('🚀 Iniciando script de migración...');

import { dbRun, dbGet } from '../config/database.js';

async function addUniqueActiveQuizConstraint() {
  try {
    console.log('🔧 Agregando índice único para prevenir quizzes activos duplicados...');

    // Primero, limpiar cualquier quiz duplicado existente (mantener solo el más reciente)
    console.log('🧹 Limpiando quizzes activos duplicados existentes...');
    
    const duplicates = await dbRun(`
      DELETE FROM quizzes
      WHERE id IN (
        SELECT q.id
        FROM quizzes q
        JOIN quiz_statuses qs ON q.status_id = qs.id
        WHERE qs.code = 'en_curso'
        AND q.id NOT IN (
          SELECT MAX(q2.id)
          FROM quizzes q2
          JOIN quiz_statuses qs2 ON q2.status_id = qs2.id
          WHERE qs2.code = 'en_curso'
          GROUP BY q2.user_id
        )
      )
    `);
    
    console.log(`✅ ${duplicates.changes || 0} quiz(zes) duplicado(s) eliminado(s)`);

    // Crear índice único parcial
    // Este índice garantiza que solo puede existir UN quiz con status 'en_curso' por usuario
    await dbRun(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_quiz_per_user
      ON quizzes (user_id, status_id)
      WHERE status_id = (SELECT id FROM quiz_statuses WHERE code = 'en_curso')
    `);

    console.log('✅ Índice único creado exitosamente');
    console.log('   - Previene múltiples quizzes activos por usuario');
    console.log('   - Permite múltiples quizzes terminados/abandonados');

    // Verificar que el índice existe
    const indexCheck = await dbGet(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'quizzes' 
      AND indexname = 'idx_unique_active_quiz_per_user'
    `);

    if (indexCheck) {
      console.log('✅ Verificación: Índice encontrado correctamente');
    } else {
      console.warn('⚠️  Advertencia: No se pudo verificar el índice');
    }

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al agregar índice único:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  addUniqueActiveQuizConstraint();
}

export { addUniqueActiveQuizConstraint };
