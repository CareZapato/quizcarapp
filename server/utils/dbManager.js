import { dbRun, dbGet, dbAll, query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { SEED_DATA, TABLE_SCHEMAS } from '../config/seed.js';

// Verificar si una tabla existe (PostgreSQL)
async function tableExists(tableName) {
  try {
    const result = await dbGet(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
      [tableName]
    );
    return result.exists;
  } catch (error) {
    return false;
  }
}

// Verificar si una tabla está vacía
async function isTableEmpty(tableName) {
  try {
    const result = await dbGet(`SELECT COUNT(*) as count FROM ${tableName}`);
    return parseInt(result.count) === 0;
  } catch (error) {
    return true;
  }
}

// Crear todas las tablas
async function createTables() {
  console.log('📋 Creando/verificando tablas...');
  
  for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
    try {
      await dbRun(schema);
      console.log(`✅ Tabla ${tableName} verificada/creada`);
    } catch (error) {
      console.error(`❌ Error al crear tabla ${tableName}:`, error);
      throw error;
    }
  }
}

// Insertar datos iniciales
async function seedData() {
  console.log('🌱 Insertando datos iniciales...');

  try {
    // Insertar categorías
    const categoriesEmpty = await isTableEmpty('categories');
    if (categoriesEmpty) {
      console.log('📁 Insertando categorías...');
      for (const cat of SEED_DATA.categories) {
        if (cat.id !== undefined) {
          // Insertar con ID específico
          await dbRun(
            'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3)',
            [cat.id, cat.name, cat.description]
          );
        } else {
          // Insertar sin ID (autoincremental)
          await dbRun(
            'INSERT INTO categories (name, description) VALUES ($1, $2)',
            [cat.name, cat.description]
          );
        }
      }
      console.log('✅ Categorías insertadas (incluyendo categoría 0: Indefinido)');
    }

    // Insertar preguntas
    const questionsEmpty = await isTableEmpty('questions');
    if (questionsEmpty) {
      console.log('❓ Insertando preguntas de ejemplo...');
      for (const q of SEED_DATA.questions) {
        await dbRun(
          `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, 
                                  option_d, option_e, correct_answer, explanation, difficulty, needs_image)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [q.category_id, q.question, q.a, q.b, q.c, q.d || null, q.e || null, 
           q.correct, q.explanation, q.difficulty, false]
        );
      }
      console.log('✅ Preguntas insertadas');
    }

    // Insertar usuarios
    const usersEmpty = await isTableEmpty('users');
    if (usersEmpty) {
      console.log('👤 Creando usuarios iniciales...');
      
      // Usuario admin
      const adminExists = await dbGet('SELECT id FROM users WHERE username = $1', [SEED_DATA.adminUser.username]);
      if (!adminExists) {
        const adminHash = await bcrypt.hash(SEED_DATA.adminUser.password, 10);
        await dbRun(
          'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)',
          [SEED_DATA.adminUser.username, SEED_DATA.adminUser.email, adminHash, SEED_DATA.adminUser.is_admin]
        );
        console.log(`✅ Usuario admin creado (username: ${SEED_DATA.adminUser.username}, password: ${SEED_DATA.adminUser.password})`);
      }

      // Usuario demo
      const demoExists = await dbGet('SELECT id FROM users WHERE username = $1', [SEED_DATA.demoUser.username]);
      if (!demoExists) {
        const demoHash = await bcrypt.hash(SEED_DATA.demoUser.password, 10);
        await dbRun(
          'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4)',
          [SEED_DATA.demoUser.username, SEED_DATA.demoUser.email, demoHash, SEED_DATA.demoUser.is_admin]
        );
        console.log(`✅ Usuario demo creado (username: ${SEED_DATA.demoUser.username}, password: ${SEED_DATA.demoUser.password})`);
      }
    }

  } catch (error) {
    console.error('❌ Error al insertar datos:', error);
    throw error;
  }
}

// Verificar integridad de la base de datos
export async function verifyAndRestoreDatabase() {
  console.log('\n🔍 Verificando integridad de la base de datos...');

  try {
    // Verificar si todas las tablas existen
    const requiredTables = Object.keys(TABLE_SCHEMAS);
    const missingTables = [];

    for (const tableName of requiredTables) {
      const exists = await tableExists(tableName);
      if (!exists) {
        missingTables.push(tableName);
      }
    }

    if (missingTables.length > 0) {
      console.log(`⚠️  Tablas faltantes detectadas: ${missingTables.join(', ')}`);
      console.log('🔧 Restaurando base de datos...');
      await createTables();
      await seedData();
      console.log('✅ Base de datos restaurada exitosamente');
    } else {
      console.log('✅ Todas las tablas existen');
      
      // Verificar y actualizar estructura de columnas si es necesario
      await verifyColumnTypes();
      
      // Verificar si hay datos iniciales
      const categoriesEmpty = await isTableEmpty('categories');
      const questionsEmpty = await isTableEmpty('questions');
      
      if (categoriesEmpty || questionsEmpty) {
        console.log('⚠️  Datos iniciales faltantes, restaurando...');
        await seedData();
        console.log('✅ Datos iniciales restaurados');
      } else {
        console.log('✅ Datos iniciales presentes');
      }
    }

    console.log('🎉 Base de datos verificada y lista\n');
    return true;
  } catch (error) {
    console.error('❌ Error al verificar/restaurar base de datos:', error);
    throw error;
  }
}

// Verificar tipos de columnas y actualizarlos si es necesario
async function verifyColumnTypes() {
  console.log('🔍 Verificando tipos de columnas...');
  
  try {
    // Verificar correct_answer en questions
    const questionsCheck = await query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'correct_answer'
    `);
    
    if (questionsCheck.rows[0]?.data_type === 'character varying') {
      console.log('⚠️  Actualizando questions.correct_answer a TEXT...');
      await query('ALTER TABLE questions ALTER COLUMN correct_answer TYPE TEXT');
      console.log('✅ questions.correct_answer actualizado');
    }
    
    // Verificar user_answer en user_answers
    const answersCheck = await query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_answers' AND column_name = 'user_answer'
    `);
    
    if (answersCheck.rows[0]?.data_type === 'character varying') {
      console.log('⚠️  Actualizando user_answers.user_answer a TEXT...');
      await query('ALTER TABLE user_answers ALTER COLUMN user_answer TYPE TEXT');
      console.log('✅ user_answers.user_answer actualizado');
    }

    // Verificar y agregar columnas option_d y option_e si no existen
    const checkD = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_d'
    `);

    if (checkD.rows.length === 0) {
      console.log('⚠️  Agregando columna option_d...');
      await query('ALTER TABLE questions ADD COLUMN option_d TEXT');
      console.log('✅ Columna option_d agregada');
    }

    const checkE = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'option_e'
    `);

    if (checkE.rows.length === 0) {
      console.log('⚠️  Agregando columna option_e...');
      await query('ALTER TABLE questions ADD COLUMN option_e TEXT');
      console.log('✅ Columna option_e agregada');
    }
    
    console.log('✅ Tipos de columnas y estructura verificados');
  } catch (error) {
    console.log('ℹ️  Verificación de tipos de columnas omitida:', error.message);
  }
}

// Función para forzar reinicio de base de datos (útil para desarrollo)
export async function resetDatabase() {
  console.log('🔄 Reiniciando base de datos...');
  
  try {
    // Eliminar todas las tablas en orden inverso (por las FK)
    const tables = ['user_progress', 'user_answers', 'quizzes', 'questions', 'categories', 'users'];
    for (const tableName of tables) {
      await dbRun(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
    }
    console.log('🗑️  Tablas eliminadas');

    // Crear tablas e insertar datos
    await createTables();
    await seedData();
    
    console.log('✅ Base de datos reiniciada exitosamente');
  } catch (error) {
    console.error('❌ Error al reiniciar base de datos:', error);
    throw error;
  }
}
