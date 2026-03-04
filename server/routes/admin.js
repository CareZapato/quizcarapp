import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
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

// Configuración de multer para subir múltiples imágenes directas
const multiImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    // Conservar el nombre original del archivo
    cb(null, file.originalname);
  }
});

const multiImageUpload = multer({
  storage: multiImageStorage,
  limits: { fileSize: 10 * 1024 * 1024, files: 200 }, // 10 MB por imagen, máx 200 archivos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
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
      option_d,
      option_e,
      correct_answer,
      explanation,
      image_url,
      difficulty
    } = req.body;

    // Validación básica (category_id ya no es obligatorio, usará 0 por defecto)
    // Mínimo 2 opciones requeridas (A y B)
    if (!question_text || !option_a || !option_b || !correct_answer) {
      console.error('❌ Error en POST /questions: Faltan campos obligatorios');
      console.error(`   - question_text: ${question_text ? '✓' : '✗'}`);
      console.error(`   - option_a: ${option_a ? '✓' : '✗'}`);
      console.error(`   - option_b: ${option_b ? '✓' : '✗'}`);
      console.error(`   - correct_answer: ${correct_answer ? '✓' : '✗'}`);
      return res.status(400).json({ 
        error: 'Faltan campos requeridos (mínimo: question_text, option_a, option_b, correct_answer)',
        missing: [
          !question_text && 'question_text',
          !option_a && 'option_a',
          !option_b && 'option_b',
          !correct_answer && 'correct_answer'
        ].filter(Boolean)
      });
    }

    console.log(`✅ Creando nueva pregunta con opciones: A${option_b ? ', B' : ''}${option_c ? ', C' : ''}${option_d ? ', D' : ''}${option_e ? ', E' : ''}`);

    const result = await dbRun(
      `INSERT INTO questions 
       (category_id, question_text, option_a, option_b, option_c, option_d, option_e, 
        correct_answer, explanation, image_url, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [category_id || 0, question_text, option_a, option_b, option_c, option_d || null, 
       option_e || null, correct_answer.toUpperCase(), explanation, image_url, difficulty || 1]
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
      option_d,
      option_e,
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
           option_d = $6, option_e = $7, correct_answer = $8, explanation = $9, image_url = $10, 
           difficulty = $11
       WHERE id = $12`,
      [category_id, question_text, option_a, option_b, option_c, option_d || null, 
       option_e || null, correct_answer.toUpperCase(), explanation, image_url, difficulty, id]
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

// Subir múltiples imágenes directamente conservando el nombre original
router.post('/upload-images', authMiddleware, adminMiddleware, multiImageUpload.array('images', 200), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No se proporcionaron imágenes' });
  }

  const saved = req.files.map(f => f.originalname);
  console.log(`🖼️  ${saved.length} imagen(es) subida(s):`, saved);

  res.json({
    message: `${saved.length} imagen(es) guardada(s) correctamente`,
    saved,
    skipped: [],
    total: saved.length
  });

  } catch (error) {
    await fs.unlink(archivePath).catch(() => {});
    console.error('Error al extraer paquete de imágenes:', error);
    res.status(500).json({ error: 'Error al extraer el archivo: ' + error.message });
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

// Importar/Complementar preguntas desde JSON
router.post('/import-questions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { questions } = req.body;
    
    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: 'Se esperaba un array de preguntas' });
    }

    // Obtener todas las categorías válidas al inicio
    const validCategories = await dbAll('SELECT id FROM categories');
    const validCategoryIds = validCategories.map(c => c.id);
    const maxCategoryId = Math.max(...validCategoryIds);

    let importedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors = [];
    const warnings = [];

    for (const q of questions) {
      try {
        // Validar que al menos tenga question_number
        if (!q.question_number) {
          errors.push({ question_number: 'N/A', error: 'Falta el número de pregunta' });
          skippedCount++;
          continue;
        }

        // Validar y corregir category_id si es necesario
        let categoryId = q.category_id !== undefined ? q.category_id : 0;
        if (categoryId && !validCategoryIds.includes(categoryId)) {
          warnings.push({ 
            question_number: q.question_number, 
            warning: `category_id ${categoryId} no existe. Se usará categoría 0 (Indefinido). Categorías válidas: ${validCategoryIds.join(', ')}` 
          });
          categoryId = 0; // Usar categoría 0 "Indefinido" por defecto
        }

        // Verificar si ya existe una pregunta con ese número
        const existing = await dbGet(
          'SELECT * FROM questions WHERE question_number = $1',
          [q.question_number]
        );

        if (existing) {
          // Modo COMPLEMENTAR: actualizar solo campos proporcionados (no nulos/vacíos)
          const updates = [];
          const params = [];
          let paramIndex = 1;

          // Construir UPDATE dinámico solo con campos proporcionados
          if (q.question_text !== undefined && q.question_text !== '') {
            updates.push(`question_text = $${paramIndex++}`);
            params.push(q.question_text);
          }
          if (q.option_a !== undefined && q.option_a !== '') {
            updates.push(`option_a = $${paramIndex++}`);
            params.push(q.option_a);
          }
          if (q.option_b !== undefined && q.option_b !== '') {
            updates.push(`option_b = $${paramIndex++}`);
            params.push(q.option_b);
          }
          if (q.option_c !== undefined && q.option_c !== '') {
            updates.push(`option_c = $${paramIndex++}`);
            params.push(q.option_c);
          }
          if (q.option_d !== undefined && q.option_d !== '') {
            updates.push(`option_d = $${paramIndex++}`);
            params.push(q.option_d);
          }
          if (q.option_e !== undefined && q.option_e !== '') {
            updates.push(`option_e = $${paramIndex++}`);
            params.push(q.option_e);
          }
          if (q.correct_answer !== undefined && q.correct_answer !== '') {
            updates.push(`correct_answer = $${paramIndex++}`);
            params.push(q.correct_answer);
          }
          if (q.explanation !== undefined) {
            updates.push(`explanation = $${paramIndex++}`);
            params.push(q.explanation || null);
          }
          if (q.category_id !== undefined) {
            updates.push(`category_id = $${paramIndex++}`);
            params.push(categoryId); // Usar categoryId validado
          }
          if (q.difficulty !== undefined) {
            updates.push(`difficulty = $${paramIndex++}`);
            params.push(q.difficulty);
          }
          if (q.needs_image !== undefined) {
            updates.push(`needs_image = $${paramIndex++}`);
            params.push(q.needs_image);
          }
          if (q.image_url !== undefined) {
            updates.push(`image_url = $${paramIndex++}`);
            params.push(q.image_url || null);
          }

          if (updates.length > 0) {
            params.push(q.question_number);
            const query = `UPDATE questions SET ${updates.join(', ')} WHERE question_number = $${paramIndex}`;
            await dbRun(query, params);
            updatedCount++;
          } else {
            skippedCount++;
          }
        } else {
          // Modo INSERTAR: crear nueva pregunta (requiere campos mínimos - al menos 2 opciones)
          if (!q.question_text || !q.option_a || !q.option_b || !q.correct_answer) {
            console.error(`❌ [Pregunta ${q.question_number}] Error de validación: Faltan campos obligatorios`);
            console.error(`   - question_text: ${q.question_text ? '✓' : '✗ FALTA'}`);
            console.error(`   - option_a: ${q.option_a ? '✓' : '✗ FALTA'}`);
            console.error(`   - option_b: ${q.option_b ? '✓' : '✗ FALTA'}`);
            console.error(`   - correct_answer: ${q.correct_answer ? '✓' : '✗ FALTA'}`);
            errors.push({ 
              question_number: q.question_number, 
              error: 'Nueva pregunta requiere mínimo: question_text, option_a, option_b, correct_answer',
              missing_fields: [
                !q.question_text && 'question_text',
                !q.option_a && 'option_a', 
                !q.option_b && 'option_b',
                !q.correct_answer && 'correct_answer'
              ].filter(Boolean)
            });
            skippedCount++;
            continue;
          }

          console.log(`✅ [Pregunta ${q.question_number}] Insertando nueva pregunta:`);
          console.log(`   - Opciones: A${q.option_b ? ', B' : ''}${q.option_c ? ', C' : ''}${q.option_d ? ', D' : ''}${q.option_e ? ', E' : ''}`);
          console.log(`   - Respuesta correcta: ${q.correct_answer}`);
          console.log(`   - Categoría: ${categoryId}`);

          await dbRun(
            `INSERT INTO questions (question_number, question_text, option_a, option_b, option_c, 
                                   option_d, option_e, correct_answer, explanation, category_id, 
                                   difficulty, needs_image, image_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              q.question_number,
              q.question_text,
              q.option_a,
              q.option_b,
              q.option_c,
              q.option_d || null,
              q.option_e || null,
              q.correct_answer,
              q.explanation || null,
              categoryId, // Usar categoryId validado
              q.difficulty || 1,
              q.needs_image || false,
              q.image_url || null
            ]
          );
          importedCount++;
        }
      } catch (error) {
        console.error(`\n❌ ============ ERROR PROCESANDO PREGUNTA ${q.question_number} ============`);
        console.error(`Mensaje: ${error.message}`);
        console.error(`Código: ${error.code || 'N/A'}`);
        console.error(`Detalle: ${error.detail || 'Sin detalles'}`);
        console.error(`Constraint: ${error.constraint || 'N/A'}`);
        console.error(`Datos de la pregunta:`, JSON.stringify({
          question_number: q.question_number,
          category_id: categoryId,
          has_option_a: !!q.option_a,
          has_option_b: !!q.option_b,
          has_option_c: !!q.option_c,
          has_option_d: !!q.option_d,
          has_option_e: !!q.option_e,
          correct_answer: q.correct_answer
        }, null, 2));
        console.error(`Stack: ${error.stack}`);
        console.error(`========================================================\n`);
        errors.push({ 
          question_number: q.question_number, 
          error: error.message,
          code: error.code,
          detail: error.detail || 'Sin detalles adicionales',
          constraint: error.constraint
        });
        skippedCount++;
      }
    }

    console.log(`\n📊 ============ RESUMEN DE IMPORTACIÓN ============`);
    console.log(`✅ Nuevas insertadas: ${importedCount}`);
    console.log(`🔄 Actualizadas: ${updatedCount}`);
    console.log(`⏭️  Omitidas: ${skippedCount}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`================================================\n`);

    res.json({
      success: true,
      importedCount,
      updatedCount,
      skippedCount,
      totalProcessed: importedCount + updatedCount + skippedCount,
      validCategories: `1-${maxCategoryId}`,
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      message: `✅ ${importedCount} preguntas nuevas insertadas, ${updatedCount} preguntas actualizadas/complementadas, ${skippedCount} omitidas.${warnings.length > 0 ? ` ⚠️ ${warnings.length} advertencias de categorías corregidas.` : ''}`
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
        option_d,
        option_e,
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

    // Obtener categorías válidas
    const validCategories = await dbAll('SELECT id FROM categories');
    const validCategoryIds = validCategories.map(c => c.id);
    const maxCategoryId = Math.max(...validCategoryIds);

    let importedCount = 0;
    let categoriesImported = 0;
    const errors = [];
    const warnings = [];

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
      
      // Actualizar lista de categorías válidas después de importar nuevas
      if (categoriesImported > 0) {
        const updatedCategories = await dbAll('SELECT id FROM categories');
        validCategoryIds.length = 0;
        validCategoryIds.push(...updatedCategories.map(c => c.id));
      }
    }

    // Importar preguntas
    for (const q of questions) {
      try {
        // Validar campos requeridos (al menos 2 opciones)
        if (!q.question_text || !q.option_a || !q.option_b || !q.correct_answer) {
          console.error(`❌ [Pregunta ${q.question_number}] Error de validación en import-full`);
          console.error(`   - question_text: ${q.question_text ? '✓' : '✗ FALTA'}`);
          console.error(`   - option_a: ${q.option_a ? '✓' : '✗ FALTA'}`);
          console.error(`   - option_b: ${q.option_b ? '✓' : '✗ FALTA'}`);
          console.error(`   - correct_answer: ${q.correct_answer ? '✓' : '✗ FALTA'}`);
          errors.push({ 
            question_number: q.question_number, 
            error: 'Faltan campos requeridos (mínimo: question_text, option_a, option_b, correct_answer)',
            missing_fields: [
              !q.question_text && 'question_text',
              !q.option_a && 'option_a',
              !q.option_b && 'option_b', 
              !q.correct_answer && 'correct_answer'
            ].filter(Boolean)
          });
          continue;
        }

        console.log(`✅ [Pregunta ${q.question_number}] Importando (import-full):`);
        console.log(`   - Opciones: A${q.option_b ? ', B' : ''}${q.option_c ? ', C' : ''}${q.option_d ? ', D' : ''}${q.option_e ? ', E' : ''}`);

        // Validar y corregir category_id
        let categoryId = q.category_id !== undefined ? q.category_id : 0;
        if (categoryId && !validCategoryIds.includes(categoryId)) {
          warnings.push({ 
            question_number: q.question_number, 
            warning: `category_id ${categoryId} no existe. Se usará categoría 0 (Indefinido). Categorías válidas: ${validCategoryIds.join(', ')}` 
          });
          categoryId = 0;
        }

        await dbRun(
          `INSERT INTO questions (question_number, question_text, option_a, option_b, option_c, 
                                 option_d, option_e, correct_answer, explanation, category_id, 
                                 difficulty, needs_image, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            q.question_number || null,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d || null,
            q.option_e || null,
            q.correct_answer,
            q.explanation || null,
            categoryId, // Usar categoryId validado
            q.difficulty || 1,
            q.needs_image || false,
            q.image_url || null
          ]
        );

        importedCount++;
        console.log(`   ✓ Pregunta ${q.question_number} importada correctamente`);
      } catch (error) {
        console.error(`\n❌ ============ ERROR EN IMPORT-FULL PREGUNTA ${q.question_number} ============`);
        console.error(`Mensaje: ${error.message}`);
        console.error(`Código: ${error.code || 'N/A'}`);
        console.error(`Detalle: ${error.detail || 'Sin detalles'}`);
        console.error(`Constraint: ${error.constraint || 'N/A'}`);
        console.error(`=================================================================\n`);
        errors.push({ 
          question_number: q.question_number, 
          error: error.message,
          code: error.code,
          detail: error.detail || 'Sin detalles adicionales',
          constraint: error.constraint
        });
      }
    }

    console.log(`\n📊 ============ RESUMEN IMPORT-FULL ============`);
    console.log(`✅ Importadas: ${importedCount}`);
    console.log(`📁 Categorías: ${categoriesImported}`);
    console.log(`⚠️  Warnings: ${warnings.length}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`===============================================\n`);

    res.json({
      success: true,
      importedCount,
      categoriesImported,
      validCategories: validCategoryIds.join(', '),
      warnings: warnings.length > 0 ? warnings : undefined,
      errors: errors.length > 0 ? errors : undefined,
      message: `✅ Importación completa: ${importedCount} preguntas${categoriesImported > 0 ? `, ${categoriesImported} categorías` : ''}. ${errors.length > 0 ? `❌ ${errors.length} errores.` : ''}${warnings.length > 0 ? ` ⚠️ ${warnings.length} advertencias de categorías.` : ''}`
    });
  } catch (error) {
    console.error('Error en importación completa:', error);
    res.status(500).json({ error: 'Error en importación completa: ' + error.message });
  }
});

// Obtener JSON base (preguntas-backup-base.json)
router.get('/base-backup', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const baseBackupPath = path.join(__dirname, '../config/preguntas-backup-base.json');
    const baseBackupContent = await fs.readFile(baseBackupPath, 'utf8');
    res.json(JSON.parse(baseBackupContent));
  } catch (error) {
    console.error('Error al obtener JSON base:', error);
    res.status(500).json({ error: 'Error al cargar el JSON base: ' + error.message });
  }
});

// Restaurar desde JSON base
router.post('/restore-base', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    console.log('\n🔄 ============ INICIANDO RESTAURACIÓN DESDE JSON BASE ============\n');

    // Leer el archivo JSON base
    const baseBackupPath = path.join(__dirname, '../config/preguntas-backup-base.json');
    const baseBackupContent = await fs.readFile(baseBackupPath, 'utf8');
    const backupData = JSON.parse(baseBackupContent);

    if (!backupData.questions || !Array.isArray(backupData.questions)) {
      return res.status(400).json({ error: 'El archivo no tiene un formato válido' });
    }

    // 1. Limpiar base de datos (eliminar todas las preguntas y quizzes)
    console.log('🗑️  Eliminando registros existentes...');
    await dbRun('DELETE FROM user_answers');
    await dbRun('DELETE FROM quizzes');
    await dbRun('DELETE FROM questions');
    
    // Si hay categorías en el backup, también limpiar y restaurar categorías
    if (backupData.categories && Array.isArray(backupData.categories)) {
      await dbRun('DELETE FROM categories');
      
      for (const cat of backupData.categories) {
        await dbRun(
          `INSERT INTO categories (id, name, description) VALUES ($1, $2, $3)`,
          [cat.id, cat.name, cat.description || null]
        );
      }
      console.log(`✅ ${backupData.categories.length} categorías restauradas`);
    }

    // 2. Insertar las preguntas del JSON base
    let importedCount = 0;
    const errors = [];

    for (const q of backupData.questions) {
      try {
        await dbRun(
          `INSERT INTO questions (question_number, question_text, option_a, option_b, option_c, 
                                 option_d, option_e, correct_answer, explanation, category_id, 
                                 difficulty, needs_image, image_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            q.question_number || null,
            q.question_text,
            q.option_a,
            q.option_b,
            q.option_c,
            q.option_d || null,
            q.option_e || null,
            q.correct_answer,
            q.explanation || null,
            q.category_id || 0,
            q.difficulty || 1,
            q.needs_image || false,
            q.image_url || null
          ]
        );
        importedCount++;
      } catch (error) {
        console.error(`❌ Error al importar pregunta ${q.question_number}:`, error.message);
        errors.push({ question_number: q.question_number, error: error.message });
      }
    }

    console.log(`\n✅ ============ RESTAURACIÓN COMPLETADA ============`);
    console.log(`📊 Preguntas restauradas: ${importedCount}`);
    console.log(`❌ Errores: ${errors.length}`);
    console.log(`===============================================\n`);

    res.json({
      success: true,
      message: `Base de datos restaurada: ${importedCount} preguntas del JSON base`,
      importedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error en restauración desde JSON base:', error);
    res.status(500).json({ error: 'Error al restaurar desde JSON base: ' + error.message });
  }
});

export default router;
