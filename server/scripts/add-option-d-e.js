import pool from '../config/database.js';

async function addOptionColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Agregando columnas option_d y option_e...');
    
    // Verificar si ya existen las columnas
    const checkD = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_d'
    `);
    
    const checkE = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_e'
    `);
    
    // Agregar option_d si no existe
    if (checkD.rows.length === 0) {
      await client.query(`
        ALTER TABLE questions 
        ADD COLUMN option_d TEXT DEFAULT NULL
      `);
      console.log('✅ Columna option_d agregada');
    } else {
      console.log('ℹ️  Columna option_d ya existe');
    }
    
    // Agregar option_e si no existe
    if (checkE.rows.length === 0) {
      await client.query(`
        ALTER TABLE questions 
        ADD COLUMN option_e TEXT DEFAULT NULL
      `);
      console.log('✅ Columna option_e agregada');
    } else {
      console.log('ℹ️  Columna option_e ya existe');
    }
    
    console.log('🎉 Migración completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addOptionColumns();
