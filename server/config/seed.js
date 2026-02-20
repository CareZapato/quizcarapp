// Datos iniciales de la aplicación (seed)

export const SEED_DATA = {
  categories: [
    { id: 0, name: 'Indefinido', description: 'Categoría por defecto para preguntas sin categoría específica' },
    { id: 1, name: 'Señales de Tráfico', description: 'Señales de tráfico y señalización' },
    { id: 2, name: 'Normas de Circulación', description: 'Reglas y normas de circulación' },
    { id: 3, name: 'Seguridad Vial', description: 'Seguridad y prevención de accidentes' },
    { id: 4, name: 'Mecánica Básica', description: 'Conocimientos básicos de mecánica' },
    { id: 5, name: 'Primeros Auxilios', description: 'Primeros auxilios en accidentes' },
    { id: 6, name: 'Sistemas y Equipos del Vehículo', description: 'Conocimientos sobre sistemas y equipos de seguridad del vehículo' }
  ],

  // No hay preguntas por defecto - deben importarse desde JSON
  questions: [],

  adminUser: {
    username: 'admin',
    email: 'admin@testconduccion.com',
    password: 'admin123',
    is_admin: 1
  },

  demoUser: {
    username: 'demo',
    email: 'demo@test.com',
    password: 'password123',
    is_admin: 0
  }
};

// Definición de esquemas de tablas (PostgreSQL)
export const TABLE_SCHEMAS = {
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      is_admin INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  categories: `
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT
    )
  `,
  
  questions: `
    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      question_number INTEGER,
      category_id INTEGER,
      question_text TEXT NOT NULL,
      option_a TEXT NOT NULL,
      option_b TEXT NOT NULL,
      option_c TEXT,
      option_d TEXT,
      option_e TEXT,
      correct_answer TEXT NOT NULL,
      has_multiple_answers BOOLEAN DEFAULT FALSE,
      explanation TEXT,
      image_url TEXT,
      needs_image BOOLEAN DEFAULT FALSE,
      difficulty INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `,
  
  quizzes: `
    CREATE TABLE IF NOT EXISTS quizzes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      mode VARCHAR(50) NOT NULL,
      total_questions INTEGER NOT NULL,
      correct_answers INTEGER DEFAULT 0,
      time_limit INTEGER NOT NULL,
      time_taken INTEGER,
      score REAL,
      completed BOOLEAN DEFAULT FALSE,
      passed BOOLEAN DEFAULT FALSE,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
  
  user_answers: `
    CREATE TABLE IF NOT EXISTS user_answers (
      id SERIAL PRIMARY KEY,
      quiz_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      user_answer TEXT,
      is_correct BOOLEAN,
      answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )
  `,
  
  user_progress: `
    CREATE TABLE IF NOT EXISTS user_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      questions_answered INTEGER DEFAULT 0,
      correct_answers INTEGER DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(user_id, category_id)
    )
  `
};
