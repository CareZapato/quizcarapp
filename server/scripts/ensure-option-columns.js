import pg from 'pg';
const { Pool } = pg;

// Script para asegurar que las columnas option_d y option_e existen
// Se ejecuta automáticamente durante el deploy y restauración de base de datos

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'testconduccion',
  password: process.env.DB_PASSWORD || '123456',
  port: process.env.DB_PORT || 5432,
});

async function ensureOptionColumns() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verificando columnas option_d y option_e...');

    // Verificar si option_d existe
    const checkD = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_d'
    `);

    if (checkD.rows.length === 0) {
      console.log('➕ Agregando columna option_d...');
      await client.query('ALTER TABLE questions ADD COLUMN option_d TEXT');
      console.log('✅ Columna option_d agregada');
    } else {
      console.log('✓ Columna option_d ya existe');
    }

    // Verificar si option_e existe
    const checkE = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_e'
    `);

    if (checkE.rows.length === 0) {
      console.log('➕ Agregando columna option_e...');
      await client.query('ALTER TABLE questions ADD COLUMN option_e TEXT');
      console.log('✅ Columna option_e agregada');
    } else {
      console.log('✓ Columna option_e ya existe');
    }

    console.log('🎉 Verificación completada - Base de datos actualizada');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar/agregar columnas:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureOptionColumns()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default ensureOptionColumns;
