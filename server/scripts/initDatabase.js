import { resetDatabase } from '../utils/dbManager.js';

async function initDatabase() {
  try {
    console.log('🔧 Inicializando base de datos desde cero...');
    await resetDatabase();
    console.log('🎉 ¡Base de datos inicializada correctamente!');
    console.log('\n👤 Usuarios creados:');
    console.log('   Admin: username=admin, password=admin123');
    console.log('   Demo:  username=demo, password=password123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Función anterior mantenida por compatibilidad
async function initDatabaseLegacy() {
  try {
    console.log('🔧 Inicializando base de datos...');

    // Crear tabla de usuarios
    const { dbRun } = await import('../config/database.js');
    const bcrypt = await import('bcryptjs');

    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla users creada');

    // Crear tabla de categorías de preguntas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    `);
    console.log('✅ Tabla categories creada');

    // Crear tabla de preguntas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        image_url TEXT,
        difficulty INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);
    console.log('✅ Tabla questions creada');

    // Crear tabla de cuestionarios
    await dbRun(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        mode TEXT NOT NULL,
        total_questions INTEGER NOT NULL,
        correct_answers INTEGER DEFAULT 0,
        time_limit INTEGER NOT NULL,
        time_taken INTEGER,
        score REAL,
        completed BOOLEAN DEFAULT 0,
        passed BOOLEAN DEFAULT 0,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    console.log('✅ Tabla quizzes creada');

    // Crear tabla de respuestas de usuario
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        user_answer TEXT,
        is_correct BOOLEAN,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )
    `);
    console.log('✅ Tabla user_answers creada');

    // Crear tabla de progreso del usuario
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        questions_answered INTEGER DEFAULT 0,
        correct_answers INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        UNIQUE(user_id, category_id)
      )
    `);
    console.log('✅ Tabla user_progress creada');

    // Insertar categorías por defecto
    const categories = [
      { name: 'Señales de Tráfico', description: 'Señales de tráfico y señalización' },
      { name: 'Normas de Circulación', description: 'Reglas y normas de circulación' },
      { name: 'Seguridad Vial', description: 'Seguridad y prevención de accidentes' },
      { name: 'Mecánica Básica', description: 'Conocimientos básicos de mecánica' },
      { name: 'Primeros Auxilios', description: 'Primeros auxilios en accidentes' }
    ];

    for (const cat of categories) {
      await dbRun(
        'INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)',
        [cat.name, cat.description]
      );
    }
    console.log('✅ Categorías insertadas');

    // Insertar preguntas de ejemplo
    const sampleQuestions = [
      {
        category_id: 1,
        question: '¿Qué significa una señal triangular con borde rojo?',
        a: 'Prohibición',
        b: 'Peligro',
        c: 'Obligación',
        correct: 'B',
        explanation: 'Las señales triangulares con borde rojo indican peligro o advertencia.'
      },
      {
        category_id: 1,
        question: '¿Qué indica una señal circular con fondo azul?',
        a: 'Prohibición',
        b: 'Peligro',
        c: 'Obligación',
        correct: 'C',
        explanation: 'Las señales circulares con fondo azul indican obligación.'
      },
      {
        category_id: 2,
        question: '¿Cuál es la velocidad máxima en ciudad para turismos?',
        a: '40 km/h',
        b: '50 km/h',
        c: '60 km/h',
        correct: 'B',
        explanation: 'La velocidad máxima en ciudad es de 50 km/h para turismos.'
      },
      {
        category_id: 2,
        question: '¿A qué distancia debe colocarse el triángulo de emergencia?',
        a: '25 metros',
        b: '50 metros',
        c: '100 metros',
        correct: 'B',
        explanation: 'El triángulo debe colocarse a 50 metros del vehículo.'
      },
      {
        category_id: 3,
        question: '¿Cuál es la tasa máxima de alcohol permitida para conductores noveles?',
        a: '0.0 g/l',
        b: '0.15 g/l',
        c: '0.25 g/l',
        correct: 'B',
        explanation: 'Para conductores noveles la tasa máxima es de 0.15 g/l en sangre.'
      },
      {
        category_id: 3,
        question: '¿Qué debe hacer al ver un accidente?',
        a: 'Pasar rápidamente',
        b: 'Detenerse si puede ayudar',
        c: 'Filmar con el móvil',
        correct: 'B',
        explanation: 'Debe detenerse si puede prestar ayuda sin poner en peligro la circulación.'
      },
      {
        category_id: 4,
        question: '¿Con qué frecuencia debe revisarse el nivel de aceite?',
        a: 'Cada mes',
        b: 'Cada semana',
        c: 'Cada 6 meses',
        correct: 'A',
        explanation: 'El nivel de aceite debe revisarse al menos una vez al mes.'
      },
      {
        category_id: 4,
        question: '¿Cuál es la presión de neumáticos recomendada?',
        a: 'La indicada por el fabricante',
        b: 'Siempre 2.5 bar',
        c: 'No importa',
        correct: 'A',
        explanation: 'Debe seguirse la presión indicada por el fabricante del vehículo.'
      },
      {
        category_id: 5,
        question: '¿Qué es lo primero que debe hacer ante un accidente?',
        a: 'Mover al herido',
        b: 'Proteger la zona',
        c: 'Llamar a la policía',
        correct: 'B',
        explanation: 'Lo primero es proteger la zona para evitar nuevos accidentes (P-A-S).'
      },
      {
        category_id: 5,
        question: '¿Cómo se trata una hemorragia?',
        a: 'Aplicando un torniquete siempre',
        b: 'Presión directa sobre la herida',
        c: 'Con agua fría',
        correct: 'B',
        explanation: 'La hemorragia se trata con presión directa sobre la herida.'
      }
    ];

    for (const q of sampleQuestions) {
      await dbRun(
        `INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [q.category_id, q.question, q.a, q.b, q.c, q.correct, q.explanation]
      );
    }
    console.log('✅ Preguntas de ejemplo insertadas');

    // Crear usuarios
    const hashedPasswordDemo = await bcrypt.default.hash('password123', 10);
    await dbRun(
      'INSERT OR IGNORE INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
      ['demo', 'demo@test.com', hashedPasswordDemo, 0]
    );
    console.log('✅ Usuario demo creado (username: demo, password: password123)');

    const hashedPasswordAdmin = await bcrypt.default.hash('admin123', 10);
    await dbRun(
      'INSERT OR IGNORE INTO users (username, email, password, is_admin) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@testconduccion.com', hashedPasswordAdmin, 1]
    );
    console.log('✅ Usuario admin creado (username: admin, password: admin123)');

    console.log('🎉 ¡Base de datos inicializada correctamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

initDatabase();
