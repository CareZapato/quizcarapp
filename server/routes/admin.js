import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware para verificar si el usuario es administrador
const adminMiddleware = async (req, res, next) => {
  try {
    const user = await dbGet('SELECT is_admin FROM users WHERE id = $1', [req.userId]);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    next();
  } catch (error) {
    console.error('Error en adminMiddleware:', error);
    res.status(500).json({ error: 'Error al verificar permisos' });
  }
};

// Configuración de multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // El nombre se establecerá después en el endpoint con el ID de la pregunta
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `temp-${timestamp}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Aceptar solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// ============ RUTAS DE ADMINISTRACIÓN ============

// Obtener todas las preguntas (admin)
router.get('/questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const questions = await dbAll(`
      SELECT q.*, c.name as category_name 
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.id
      ORDER BY q.id DESC
    `);
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

// Obtener una pregunta específica
router.get('/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const question = await dbGet(
      `SELECT q.*, c.name as category_name 
       FROM questions q
       LEFT JOIN categories c ON q.category_id = c.id
       WHERE q.id = $1`,
      [req.params.id]
    );
    
    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }
    
    res.json(question);
  } catch (error) {
    console.error('Error al obtener pregunta:', error);
    res.status(500).json({ error: 'Error al obtener pregunta' });
  }
});

// Crear nueva pregunta
router.post('/questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      category_id,
      question_text,
      option_a,
      option_b,
      option_c,
      correct_answer,
      explanation,
      image_url,
      difficulty
    } = req.body;

    // Validación básica
    if (!category_id || !question_text || !option_a || !option_b || !option_c || !correct_answer) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const result = await dbRun(
      `INSERT INTO questions 
       (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [category_id, question_text, option_a, option_b, option_c, correct_answer.toUpperCase(), explanation, image_url, difficulty || 1]
    );

    res.status(201).json({
      message: 'Pregunta creada exitosamente',
      questionId: result.id
    });
  } catch (error) {
    console.error('Error al crear pregunta:', error);
    res.status(500).json({ error: 'Error al crear pregunta' });
  }
});

// Actualizar pregunta existente
router.put('/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      question_text,
      option_a,
      option_b,
      option_c,
      correct_answer,
      explanation,
      image_url,
      difficulty
    } = req.body;

    // Verificar que la pregunta existe
    const exists = await dbGet('SELECT id FROM questions WHERE id = $1', [id]);
    if (!exists) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    await dbRun(
      `UPDATE questions 
       SET category_id = $1, question_text = $2, option_a = $3, option_b = $4, option_c = $5, 
           correct_answer = $6, explanation = $7, image_url = $8, difficulty = $9
       WHERE id = $10`,
      [category_id, question_text, option_a, option_b, option_c, correct_answer.toUpperCase(), explanation, image_url, difficulty, id]
    );

    res.json({ message: 'Pregunta actualizada exitosamente' });
  } catch (error) {
    console.error('Error al actualizar pregunta:', error);
    res.status(500).json({ error: 'Error al actualizar pregunta' });
  }
});

// Eliminar pregunta
router.delete('/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la pregunta existe
    const exists = await dbGet('SELECT id FROM questions WHERE id = $1', [id]);
    if (!exists) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    // Verificar si la pregunta está siendo usada en cuestionarios
    const inUse = await dbGet(
      'SELECT COUNT(*) as count FROM user_answers WHERE question_id = $1',
      [id]
    );

    if (inUse.count > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar una pregunta que ya ha sido respondida en cuestionarios' 
      });
    }

    await dbRun('DELETE FROM questions WHERE id = $1', [id]);

    res.json({ message: 'Pregunta eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    res.status(500).json({ error: 'Error al eliminar pregunta' });
  }
});

// Subir imagen para pregunta
router.post('/upload-image', authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const fs = require('fs').promises;
    const questionId = req.body.questionId;
    const timestamp = Date.now();
    const ext = path.extname(req.file.filename);
    
    // Nuevo nombre: idpregunta_fecha.ext o temp_fecha.ext si no hay questionId aún
    const newFilename = questionId 
      ? `${questionId}_${timestamp}${ext}`
      : `temp_${timestamp}${ext}`;
    
    const oldPath = req.file.path;
    const newPath = path.join(path.dirname(oldPath), newFilename);
    
    // Renombrar el archivo
    await fs.rename(oldPath, newPath);
    
    const imageUrl = `/uploads/${newFilename}`;
    
    res.json({
      message: 'Imagen subida exitosamente',
      imageUrl: imageUrl,
      filename: newFilename
    });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: 'Error al subir imagen' });
  }
});

// Obtener estadísticas generales (admin)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalUsers = await dbGet('SELECT COUNT(*)::integer as count FROM users');
    const totalQuestions = await dbGet('SELECT COUNT(*)::integer as count FROM questions');
    const totalQuizzes = await dbGet('SELECT COUNT(*)::integer as count FROM quizzes WHERE completed = true');
    const totalCategories = await dbGet('SELECT COUNT(*)::integer as count FROM categories');

    // Preguntas por categoría
    const questionsByCategory = await dbAll(`
      SELECT c.name, COUNT(q.id)::integer as count
      FROM categories c
      LEFT JOIN questions q ON c.id = q.category_id
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    // Usuarios más activos
    const topUsers = await dbAll(`
      SELECT u.username, COUNT(q.id)::integer as quiz_count, AVG(q.score)::real as avg_score
      FROM users u
      LEFT JOIN quizzes q ON u.id = q.user_id AND q.completed = true
      GROUP BY u.id, u.username
      ORDER BY quiz_count DESC
      LIMIT 10
    `);

    res.json({
      overview: {
        totalUsers: totalUsers.count,
        totalQuestions: totalQuestions.count,
        totalQuizzes: totalQuizzes.count,
        totalCategories: totalCategories.count
      },
      questionsByCategory,
      topUsers
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Obtener todas las categorías
router.get('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Importar preguntas desde JSON
router.post('/import-questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Se esperaba un array de preguntas' });
    }

    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const q of questions) {
      try {
        // Validar campos requeridos
        if (!q.question_number || !q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.correct_answer) {
          errors.push({ question_number: q.question_number, error: 'Faltan campos requeridos' });
          skippedCount++;
          continue;
        }

        // Verificar si ya existe una pregunta con ese número
        const existing = await dbGet(
          'SELECT id FROM questions WHERE question_number = $1',
          [q.question_number]
        );

        if (existing) {
          // Actualizar pregunta existente
          await dbRun(
            `UPDATE questions 
             SET question_text = $1, option_a = $2, option_b = $3, option_c = $4, 
                 correct_answer = $5, explanation = $6, category_id = $7, 
                 difficulty = $8, needs_image = $9
             WHERE question_number = $10`,
            [
              q.question_text,
              q.option_a,
              q.option_b,
              q.option_c,
              q.correct_answer,
              q.explanation || null,
              q.category_id || 1,
              q.difficulty || 1,
              q.needs_image || false,
              q.question_number
            ]
          );
        } else {
          // Insertar nueva pregunta
          await dbRun(
            `INSERT INTO questions (question_number, question_text, option_a, option_b, option_c, 
                                   correct_answer, explanation, category_id, difficulty, needs_image)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              q.question_number,
              q.question_text,
              q.option_a,
              q.option_b,
              q.option_c,
              q.correct_answer,
              q.explanation || null,
              q.category_id || 1,
              q.difficulty || 1,
              q.needs_image || false
            ]
          );
        }

        importedCount++;
      } catch (error) {
        console.error(`Error al procesar pregunta ${q.question_number}:`, error);
        errors.push({ question_number: q.question_number, error: error.message });
        skippedCount++;
      }
    }

    res.json({
      success: true,
      importedCount,
      skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      message: `${importedCount} preguntas importadas exitosamente. ${skippedCount} omitidas.`
    });
  } catch (error) {
    console.error('Error al importar preguntas:', error);
    res.status(500).json({ error: 'Error al importar preguntas' });
  }
});

// Obtener mapa de preguntas con estado de imágenes
router.get('/questions-map', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const questions = await dbAll(`
      SELECT 
        id, 
        question_number, 
        question_text, 
        category_id,
        image_url, 
        needs_image,
        CASE 
          WHEN image_url IS NOT NULL THEN 'complete'
          WHEN needs_image = true THEN 'missing'
          ELSE 'not_required'
        END as image_status
      FROM questions
      ORDER BY question_number, id
    `);

    const stats = {
      total: questions.length,
      withImages: questions.filter(q => q.image_url).length,
      needingImages: questions.filter(q => q.needs_image && !q.image_url).length,
      notRequired: questions.filter(q => !q.needs_image && !q.image_url).length
    };

    res.json({ questions, stats });
  } catch (error) {
    console.error('Error al obtener mapa de preguntas:', error);
    res.status(500).json({ error: 'Error al obtener mapa de preguntas' });
  }
});

// Exportar todas las preguntas en formato JSON
router.get('/export-questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const questions = await dbAll(`
      SELECT 
        question_number,
        question_text,
        option_a,
        option_b,
        option_c,
        correct_answer,
        explanation,
        category_id,
        difficulty,
        needs_image,
        image_url
      FROM questions
      ORDER BY question_number ASC, id ASC
    `);

    // Obtener también las categorías para referencia
    const categories = await dbAll('SELECT id, name, description FROM categories ORDER BY id');

    const exportData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      total_questions: questions.length,
      categories: categories,
      questions: questions
    };

    res.json(exportData);
  } catch (error) {
    console.error('Error al exportar preguntas:', error);
    res.status(500).json({ error: 'Error al exportar preguntas' });
  }
});

// Importación masiva completa (borra y reemplaza todo)
router.post('/import-full', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questions, categories, replaceAll } = req.body;
    
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Se esperaba un array de preguntas' });
    }

    let importedCount = 0;
    let categoriesImported = 0;
    const errors = [];

    // Si se solicita reemplazar todo, eliminar preguntas existentes
    if (replaceAll === true) {
      await dbRun('DELETE FROM user_answers');
      await dbRun('DELETE FROM questions');
      console.log('Base de datos limpiada para importación completa');
    }

    // Importar categorías si se proporcionan
    if (Array.isArray(categories) && categories.length > 0) {
      for (const cat of categories) {
        try {
          const existing = await dbGet('SELECT id FROM categories WHERE id = $1', [cat.id]);
          if (!existing) {
            await dbRun(
              'INSERT INTO categories (id, name, description) VALUES ($1, $2, $3) RETURNING id',
              [cat.id, cat.name, cat.description || null]
            );
            categoriesImported++;
          }
        } catch (error) {
          console.error(`Error al importar categoría ${cat.id}:`, error);
        }
      }
    }

    // Importar preguntas
    for (const q of questions) {
      try {
        // Validar campos requeridos
        if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.correct_answer) {
          errors.push({ question_number: q.question_number, error: 'Faltan campos requeridos' });
          continue;
        }

        await dbRun(
          `INSERT INTO questions (question_number, question_text, option_a, option_b, option_c, 
                                 correct_answer, explanation, category_id, difficulty, needs_image, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            q.question_number || null,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.correct_answer,
            q.explanation || null,
            q.category_id || 1,
            q.difficulty || 1,
            q.needs_image || false,
            q.image_url || null
          ]
        );

        importedCount++;
      } catch (error) {
        console.error(`Error al procesar pregunta ${q.question_number}:`, error);
        errors.push({ question_number: q.question_number, error: error.message });
      }
    }

    res.json({
      success: true,
      importedCount,
      categoriesImported,
      errors: errors.length > 0 ? errors : undefined,
      message: `Importación completa: ${importedCount} preguntas${categoriesImported > 0 ? `, ${categoriesImported} categorías` : ''}. ${errors.length > 0 ? `${errors.length} errores.` : ''}`
    });
  } catch (error) {
    console.error('Error en importación completa:', error);
    res.status(500).json({ error: 'Error en importación completa: ' + error.message });
  }
});

export default router;
