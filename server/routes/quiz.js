import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureQuizStatusSchema } from '../utils/quizStatusManager.js';

const router = express.Router();

// Configuración de modos de cuestionario
const QUIZ_MODES = {
  REAL: {
    name: 'real',
    totalQuestions: 35,
    timeLimit: 45 * 60, // 45 minutos en segundos
    passingScore: 85 // 85% para aprobar
  },
  EXTENDED: {
    name: 'extended',
    totalQuestions: 100,
    timeLimit: 90 * 60, // 90 minutos en segundos
    passingScore: 80 // 80% para aprobar
  },
  PRACTICE: {
    name: 'practice',
    totalQuestions: null, // Infinitas
    timeLimit: 60, // 60 segundos por pregunta
    passingScore: 85, // 85% para aprobar
    isInfinite: true
  }
};

const QUIZ_STATUS = {
  IN_PROGRESS: 'en_curso',
  FINISHED: 'terminado',
  ABANDONED: 'abandonado'
};

// Algoritmo Fisher-Yates para mezcla verdaderamente aleatoria
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Obtener IDs de preguntas vistas recientemente por el usuario (últimos N quizzes completados)
async function getRecentlySeenQuestionIds(userId, lastNQuizzes = 3) {
  if (!userId) return [];
  try {
    const recentQuizzes = await dbAll(
      `SELECT id FROM quizzes
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY completed_at DESC
       LIMIT $2`,
      [userId, lastNQuizzes]
    );
    if (recentQuizzes.length === 0) return [];
    const quizIds = recentQuizzes.map(q => q.id);
    const seen = await dbAll(
      `SELECT DISTINCT question_id FROM user_answers
       WHERE quiz_id IN (${quizIds.join(',')})`,
    );
    return seen.map(r => r.question_id);
  } catch (error) {
    console.error('Error al obtener preguntas recientes:', error);
    return [];
  }
}

// Función para seleccionar preguntas proporcionalmente de todas las categorías
// Prioriza preguntas que el usuario no ha visto recientemente
async function selectProportionalQuestions(totalQuestions, userId = null) {
  try {
    // Obtener IDs de preguntas vistas recientemente para evitar repetirlas
    const recentlySeenIds = await getRecentlySeenQuestionIds(userId);

    // Obtener todas las categorías
    const categories = await dbAll('SELECT id FROM categories');
    
    if (categories.length === 0) {
      throw new Error('No hay categorías disponibles');
    }

    // Calcular preguntas por categoría
    const questionsPerCategory = Math.floor(totalQuestions / categories.length);
    const remainder = totalQuestions % categories.length;

    let selectedQuestions = [];

    // Obtener preguntas de cada categoría, priorizando las no vistas recientemente
    for (let i = 0; i < categories.length; i++) {
      const categoryId = categories[i].id;
      const questionsToSelect = questionsPerCategory + (i < remainder ? 1 : 0);

      let questions = [];

      // Primero intentar obtener preguntas NO vistas recientemente
      if (recentlySeenIds.length > 0) {
        questions = await dbAll(
          `SELECT * FROM questions 
           WHERE category_id = $1 AND id NOT IN (${recentlySeenIds.join(',')})
           ORDER BY RANDOM() 
           LIMIT $2`,
          [categoryId, questionsToSelect]
        );
      } else {
        questions = await dbAll(
          `SELECT * FROM questions 
           WHERE category_id = $1
           ORDER BY RANDOM() 
           LIMIT $2`,
          [categoryId, questionsToSelect]
        );
      }

      // Si no hay suficientes preguntas nuevas, completar con las ya vistas
      if (questions.length < questionsToSelect) {
        const alreadyPickedIds = questions.map(q => q.id);
        const excludeIds = alreadyPickedIds.length > 0 ? alreadyPickedIds : [0];
        const needed = questionsToSelect - questions.length;
        const fallback = await dbAll(
          `SELECT * FROM questions 
           WHERE category_id = $1 AND id NOT IN (${excludeIds.join(',')})
           ORDER BY RANDOM() 
           LIMIT $2`,
          [categoryId, needed]
        );
        questions = questions.concat(fallback);
      }

      selectedQuestions = selectedQuestions.concat(questions);
    }

    // Si aún faltan preguntas, completar con cualquier pregunta no seleccionada
    if (selectedQuestions.length < totalQuestions) {
      const selectedIds = selectedQuestions.map(q => q.id);
      const additionalQuestions = await dbAll(
        `SELECT * FROM questions 
         WHERE id NOT IN (${selectedIds.length > 0 ? selectedIds.join(',') : 0})
         ORDER BY RANDOM() 
         LIMIT $1`,
        [totalQuestions - selectedQuestions.length]
      );
      selectedQuestions = selectedQuestions.concat(additionalQuestions);
    }

    // Mezclar con Fisher-Yates (verdaderamente aleatorio)
    return shuffleArray(selectedQuestions);
  } catch (error) {
    console.error('Error al seleccionar preguntas:', error);
    throw error;
  }
}

// Iniciar un nuevo cuestionario
router.post('/start', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { mode } = req.body;
    const userId = req.userId;

    // Evitar múltiples quizzes en curso para el mismo usuario
    const existingInProgressQuiz = await dbGet(
      `SELECT q.id
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code = $2
       ORDER BY q.started_at DESC
       LIMIT 1`,
      [userId, QUIZ_STATUS.IN_PROGRESS]
    );

    if (existingInProgressQuiz) {
      return res.status(409).json({
        error: 'Ya tienes un cuestionario en curso. Continúa ese cuestionario o abandónalo.',
        hasActiveQuiz: true,
        quizId: existingInProgressQuiz.id
      });
    }

    let quizConfig;
    if (mode === 'practice') {
      quizConfig = QUIZ_MODES.PRACTICE;
    } else if (mode === 'extended') {
      quizConfig = QUIZ_MODES.EXTENDED;
    } else {
      quizConfig = QUIZ_MODES.REAL;
    }

    // Para modo práctica, solo tomar 1 pregunta aleatoria al inicio (evitando las vistas recientemente)
    let questions;
    if (quizConfig.isInfinite) {
      const recentlySeenIds = await getRecentlySeenQuestionIds(userId);
      if (recentlySeenIds.length > 0) {
        questions = await dbAll(
          `SELECT * FROM questions WHERE id NOT IN (${recentlySeenIds.join(',')}) ORDER BY RANDOM() LIMIT 1`
        );
      }
      // Si no hay preguntas no vistas (pool agotado), tomar cualquiera
      if (!questions || questions.length === 0) {
        questions = await dbAll(
          'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1'
        );
      }
    } else {
      // Seleccionar preguntas proporcionalmente para otros modos, evitando repeticiones
      questions = await selectProportionalQuestions(quizConfig.totalQuestions, userId);
    }

    // Validar que haya preguntas disponibles
    if (questions.length === 0) {
      return res.status(400).json({ error: 'No hay preguntas disponibles' });
    }

    // Validar preguntas solo para modos no infinitos
    if (!quizConfig.isInfinite && questions.length < quizConfig.totalQuestions) {
      return res.status(400).json({
        error: `No hay suficientes preguntas. Se requieren ${quizConfig.totalQuestions}, solo hay ${questions.length}`
      });
    }

    // Crear el cuestionario (para modo infinito, total_questions es 0 inicialmente)
    let quizResult;
    try {
      quizResult = await dbRun(
        `INSERT INTO quizzes (user_id, status_id, mode, total_questions, time_limit)
         VALUES ($1, (SELECT id FROM quiz_statuses WHERE code = $2), $3, $4, $5)
         RETURNING id`,
        [userId, QUIZ_STATUS.IN_PROGRESS, quizConfig.name, quizConfig.isInfinite ? 0 : quizConfig.totalQuestions, quizConfig.timeLimit]
      );
    } catch (dbError) {
      // Si error de unique constraint (código 23505), verificar si es por quiz duplicado
      if (dbError.code === '23505' && dbError.constraint === 'idx_unique_active_quiz_per_user') {
        console.warn('⚠️  Intento de crear quiz duplicado detectado por índice único');
        const existing = await dbGet(
          `SELECT q.id
           FROM quizzes q
           JOIN quiz_statuses qs ON q.status_id = qs.id
           WHERE q.user_id = $1 AND qs.code = $2
           LIMIT 1`,
          [userId, QUIZ_STATUS.IN_PROGRESS]
        );
        if (existing) {
          return res.status(409).json({
            error: 'Ya tienes un cuestionario en curso.',
            hasActiveQuiz: true,
            quizId: existing.id
          });
        }
      }
      throw dbError;
    }

    const quizId = quizResult.id;

    // Insertar las preguntas del cuestionario (sin respuesta aún)
    for (const question of questions) {
      await dbRun(
        'INSERT INTO user_answers (quiz_id, question_id) VALUES ($1, $2)',
        [quizId, question.id]
      );
    }

    // Preparar preguntas sin mostrar la respuesta correcta (incluir todas las opciones A-E)
    const questionsForClient = questions.map(q => ({
      id: q.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d || null,
      option_e: q.option_e || null,
      image_url: q.image_url,
      category_id: q.category_id,
      has_multiple_answers: q.correct_answer.includes(',') // Indicar si tiene múltiples respuestas
    }));

    res.json({
      quizId,
      mode: quizConfig.name,
      totalQuestions: quizConfig.isInfinite ? null : quizConfig.totalQuestions,
      timeLimit: quizConfig.timeLimit,
      questions: questionsForClient,
      startedAt: new Date().toISOString(),
      isInfinite: quizConfig.isInfinite || false
    });
  } catch (error) {
    console.error('Error al iniciar cuestionario:', error);
    res.status(500).json({ error: 'Error al iniciar cuestionario' });
  }
});

// Guardar respuesta de una pregunta
router.post('/answer', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { quizId, questionId, userAnswer } = req.body;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      `SELECT q.*, qs.code AS status_code
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.id = $1 AND q.user_id = $2`,
      [quizId, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (quiz.status_code !== QUIZ_STATUS.IN_PROGRESS) {
      return res.status(400).json({ error: 'El cuestionario ya fue completado' });
    }

    // Si userAnswer es null, solo limpiar la respuesta
    if (userAnswer === null || userAnswer === undefined) {
      await dbRun(
        `UPDATE user_answers 
         SET user_answer = NULL, is_correct = FALSE
         WHERE quiz_id = $1 AND question_id = $2`,
        [quizId, questionId]
      );

      return res.json({
        message: 'Respuesta eliminada',
        isCorrect: false
      });
    }

    // Obtener la pregunta para verificar la respuesta
    const question = await dbGet(
      'SELECT correct_answer FROM questions WHERE id = $1',
      [questionId]
    );

    if (!question) {
      return res.status(404).json({ error: 'Pregunta no encontrada' });
    }

    // Normalizar respuestas para comparación
    const correctAnswers = question.correct_answer.split(',').map(a => a.trim().toUpperCase()).sort();
    const userAnswers = (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
      .map(a => a.trim().toUpperCase())
      .sort();
    
    // Comparar arrays
    const isCorrect = JSON.stringify(correctAnswers) === JSON.stringify(userAnswers);

    // Convertir respuesta del usuario a string para guardar
    const userAnswerStr = Array.isArray(userAnswer) ? userAnswer.join(',') : userAnswer;

    // Actualizar la respuesta del usuario
    await dbRun(
      `UPDATE user_answers 
       SET user_answer = $1, is_correct = $2
       WHERE quiz_id = $3 AND question_id = $4`,
      [userAnswerStr, isCorrect, quizId, questionId]
    );

    res.json({
      message: 'Respuesta guardada',
      isCorrect
    });
  } catch (error) {
    console.error('Error al guardar respuesta:', error);
    res.status(500).json({ error: 'Error al guardar respuesta' });
  }
});

// Obtener siguiente pregunta para modo práctica
router.post('/next-question', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { quizId } = req.body;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario y es modo práctica
    const quiz = await dbGet(
      `SELECT q.*, qs.code AS status_code
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.id = $1 AND q.user_id = $2 AND q.mode = $3`,
      [quizId, userId, 'practice']
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado o no es modo práctica' });
    }

    if (quiz.status_code !== QUIZ_STATUS.IN_PROGRESS) {
      return res.status(400).json({ error: 'El cuestionario no está en curso' });
    }

    // Obtener IDs de preguntas ya respondidas en este quiz
    const answeredQuestions = await dbAll(
      'SELECT question_id FROM user_answers WHERE quiz_id = $1',
      [quizId]
    );

    const answeredIds = answeredQuestions.map(q => q.question_id);

    // Combinar con preguntas vistas en sesiones anteriores recientes
    const recentlySeenIds = await getRecentlySeenQuestionIds(userId, 2);
    const allExcludedIds = [...new Set([...answeredIds, ...recentlySeenIds])];

    // Seleccionar una nueva pregunta al azar (priorizando las no vistas recientemente)
    let newQuestion;
    if (allExcludedIds.length > 0) {
      newQuestion = await dbGet(
        `SELECT * FROM questions 
         WHERE id NOT IN (${allExcludedIds.join(',')})
         ORDER BY RANDOM() 
         LIMIT 1`
      );
    }

    // Si no hay preguntas totalmente nuevas, evitar al menos las del quiz actual
    if (!newQuestion && answeredIds.length > 0) {
      newQuestion = await dbGet(
        `SELECT * FROM questions 
         WHERE id NOT IN (${answeredIds.join(',')})
         ORDER BY RANDOM() 
         LIMIT 1`
      );
    }

    // Si no hay preguntas nuevas, reciclar una al azar
    if (!newQuestion) {
      newQuestion = await dbGet(
        'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1'
      );
    }

    if (!newQuestion) {
      return res.status(400).json({ error: 'No hay preguntas disponibles' });
    }

    // Insertar la nueva pregunta en user_answers
    await dbRun(
      'INSERT INTO user_answers (quiz_id, question_id) VALUES ($1, $2)',
      [quizId, newQuestion.id]
    );

    // Incrementar total_questions en el quiz
    await dbRun(
      'UPDATE quizzes SET total_questions = total_questions + 1 WHERE id = $1',
      [quizId]
    );

    // Preparar pregunta para el cliente
    const questionForClient = {
      id: newQuestion.id,
      question_text: newQuestion.question_text,
      option_a: newQuestion.option_a,
      option_b: newQuestion.option_b,
      option_c: newQuestion.option_c,
      option_d: newQuestion.option_d || null,
      option_e: newQuestion.option_e || null,
      image_url: newQuestion.image_url,
      category_id: newQuestion.category_id,
      has_multiple_answers: newQuestion.correct_answer.includes(',')
    };

    res.json({
      question: questionForClient
    });
  } catch (error) {
    console.error('Error al obtener siguiente pregunta:', error);
    res.status(500).json({ error: 'Error al obtener siguiente pregunta' });
  }
});

// Completar cuestionario
router.post('/complete', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { quizId, timeTaken, excludeQuestionId } = req.body;
    const userId = req.userId;

    console.log('=== INICIO COMPLETE ===');
    console.log('QuizId:', quizId);
    console.log('UserId:', userId);
    console.log('TimeTaken:', timeTaken);

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      `SELECT q.*, qs.code AS status_code
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.id = $1 AND q.user_id = $2`,
      [quizId, userId]
    );

    if (!quiz) {
      console.log('❌ Cuestionario no encontrado');
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    console.log('Quiz ANTES de completar:', {
      id: quiz.id,
      mode: quiz.mode,
      status: quiz.status_code
    });

    if (quiz.status_code !== QUIZ_STATUS.IN_PROGRESS) {
      return res.status(400).json({ error: 'Solo se puede finalizar un cuestionario en curso' });
    }

    // Si se termina práctica manualmente, excluir la pregunta actual sin contestar
    if (excludeQuestionId && quiz.mode === 'practice') {
      await dbRun(
        'DELETE FROM user_answers WHERE quiz_id = $1 AND question_id = $2 AND user_answer IS NULL',
        [quizId, excludeQuestionId]
      );
    }

    // Calcular resultados
    const correctAnswers = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers 
       WHERE quiz_id = $1 AND is_correct = TRUE`,
      [quizId]
    );

    // Total de preguntas presentadas al usuario (incluyendo las que se pas\u00f3 por tiempo)
    const totalServed = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers 
       WHERE quiz_id = $1`,
      [quizId]
    );

    const correctCount = correctAnswers.count;

    // Para el modo pr\u00e1ctica, el score se calcula sobre TODAS las preguntas presentadas
    // (correctas + incorrectas + tiempo agotado). As\u00ed una pregunta sin contestar cuenta como error.
    let totalForScore = quiz.total_questions;
    if (quiz.mode === 'practice') {
      totalForScore = totalServed.count || 1; // Evitar divisi\u00f3n por cero
    }
    
    const score = (correctCount / totalForScore) * 100;
    
    // Determinar si aprobó según el modo
    let quizConfig;
    if (quiz.mode === 'extended') {
      quizConfig = QUIZ_MODES.EXTENDED;
    } else if (quiz.mode === 'practice') {
      quizConfig = QUIZ_MODES.PRACTICE;
    } else {
      quizConfig = QUIZ_MODES.REAL;
    }
    const passed = score >= quizConfig.passingScore;

    // Actualizar el cuestionario (actualizar total_questions para modo práctica)
    if (quiz.mode === 'practice') {
      const result = await dbRun(
        `UPDATE quizzes 
         SET status_id = (SELECT id FROM quiz_statuses WHERE code = $1),
             total_questions = $2,
             correct_answers = $3,
             score = $4,
             time_taken = $5,
             completed = TRUE,
             passed = $6,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [QUIZ_STATUS.FINISHED, totalServed.count, correctCount, score, timeTaken, passed, quizId]
      );
      console.log('UPDATE para modo práctica - Rows affected:', result.changes);
    } else {
      const result = await dbRun(
        `UPDATE quizzes 
         SET status_id = (SELECT id FROM quiz_statuses WHERE code = $1),
             correct_answers = $2,
             score = $3,
             time_taken = $4,
             completed = TRUE,
             passed = $5,
             completed_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [QUIZ_STATUS.FINISHED, correctCount, score, timeTaken, passed, quizId]
      );
      console.log('UPDATE para modo normal/extended - Rows affected:', result.changes);
    }

    // Verificar que se actualizó correctamente
    const updatedQuiz = await dbGet(
      `SELECT q.id, q.mode, q.completed, q.score, q.passed, q.completed_at, qs.code as status
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.id = $1`,
      [quizId]
    );
    console.log('Quiz DESPUÉS de completar:', updatedQuiz);
    console.log('=== FIN COMPLETE ===');

    // Actualizar progreso del usuario por categoría
    const answeredByCategory = await dbAll(
      `SELECT q.category_id, 
              COUNT(*) as total,
              SUM(CASE WHEN ua.is_correct = TRUE THEN 1 ELSE 0 END) as correct
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.quiz_id = $1
       GROUP BY q.category_id`,
      [quizId]
    );

    for (const cat of answeredByCategory) {
      await dbRun(
        `INSERT INTO user_progress (user_id, category_id, questions_answered, correct_answers)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT(user_id, category_id) 
         DO UPDATE SET 
           questions_answered = user_progress.questions_answered + $5,
           correct_answers = user_progress.correct_answers + $6,
           last_updated = CURRENT_TIMESTAMP`,
        [userId, cat.category_id, cat.total, cat.correct, cat.total, cat.correct]
      );
    }

    res.json({
      message: 'Cuestionario completado',
      score,
      correctAnswers: correctCount,
      totalQuestions: quiz.total_questions,
      passed,
      timeTaken
    });
  } catch (error) {
    console.error('Error al completar cuestionario:', error);
    res.status(500).json({ error: 'Error al completar cuestionario' });
  }
});

// Abandonar cuestionario
router.post('/abandon', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { quizId } = req.body;
    const userId = req.userId;

    console.log('=== INICIO ABANDONO ===');
    console.log('QuizId recibido:', quizId);
    console.log('UserId:', userId);

    // Buscar quiz en curso a abandonar (el indicado o el más reciente)
    let targetQuiz;
    if (quizId) {
      targetQuiz = await dbGet(
        `SELECT q.id
         FROM quizzes q
         JOIN quiz_statuses qs ON q.status_id = qs.id
         WHERE q.id = $1 AND q.user_id = $2 AND qs.code = $3`,
        [quizId, userId, QUIZ_STATUS.IN_PROGRESS]
      );
    }

    if (!targetQuiz) {
      targetQuiz = await dbGet(
        `SELECT q.id
         FROM quizzes q
         JOIN quiz_statuses qs ON q.status_id = qs.id
         WHERE q.user_id = $1 AND qs.code = $2
         ORDER BY q.started_at DESC
         LIMIT 1`,
        [userId, QUIZ_STATUS.IN_PROGRESS]
      );
    }

    if (!targetQuiz) {
      console.log('✅ No hay quiz en curso para abandonar');
      return res.json({
        message: 'No hay quizzes activos',
        deleted: false
      });
    }

    const result = await dbRun(
      `UPDATE quizzes
       SET status_id = (SELECT id FROM quiz_statuses WHERE code = $1),
           completed = TRUE,
           completed_at = CURRENT_TIMESTAMP,
           passed = FALSE,
           score = COALESCE(score, 0)
       WHERE id = $2 AND user_id = $3`,
      [QUIZ_STATUS.ABANDONED, targetQuiz.id, userId]
    );

    console.log('Quizzes actualizados como abandonados:', result.changes);
    console.log('=== FIN ABANDONO ===');

    res.json({
      message: 'Cuestionario abandonado exitosamente',
      deleted: true,
      count: result.changes,
      quizId: targetQuiz.id
    });
  } catch (error) {
    console.error('❌ Error al abandonar cuestionario:', error);
    res.status(500).json({ error: 'Error al abandonar cuestionario' });
  }
});

// Obtener resultados detallados de un cuestionario
router.get('/:quizId/results', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const { quizId } = req.params;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      `SELECT q.*, qs.code AS status_code
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.id = $1 AND q.user_id = $2`,
      [quizId, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (quiz.status_code !== QUIZ_STATUS.FINISHED) {
      return res.status(400).json({ error: 'El cuestionario no ha sido completado' });
    }

    // Obtener todas las respuestas con detalles
    // En modo práctica (quiz infinito), solo consideramos las preguntas que tienen
    // una respuesta registrada para que el resumen coincida exactamente con lo contestado.
    let answersQuery = `SELECT 
        ua.id,
        ua.user_answer,
        ua.is_correct,
        q.id as question_id,
        q.question_number,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.option_e,
        q.correct_answer,
        CASE
          WHEN q.correct_answer LIKE '%,%' THEN TRUE
          ELSE FALSE
        END AS has_multiple_answers,
        q.explanation,
        q.image_url,
        c.name as category_name
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       LEFT JOIN categories c ON q.category_id = c.id
       WHERE ua.quiz_id = $1`;

    if (quiz.mode === 'practice') {
      // Incluir también preguntas sin respuesta (tiempo agotado): user_answer IS NULL
      // No filtrar nada extra, se muestran todas con su estado real.
    }

    answersQuery += ' ORDER BY ua.id';

    const answers = await dbAll(answersQuery, [quizId]);

    res.json({
      quiz: {
        id: quiz.id,
        status: quiz.status_code,
        mode: quiz.mode,
        totalQuestions: quiz.total_questions,
        correctAnswers: quiz.correct_answers,
        score: quiz.score,
        passed: quiz.passed,
        timeTaken: quiz.time_taken,
        timeLimit: quiz.time_limit,
        startedAt: quiz.started_at,
        completedAt: quiz.completed_at
      },
      answers
    });
  } catch (error) {
    console.error('Error al obtener resultados:', error);
    res.status(500).json({ error: 'Error al obtener resultados' });
  }
});

// Obtener cuestionario en progreso
router.get('/current', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    // Deshabilitar caché para este endpoint
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const userId = req.userId;

    console.log('=== GET /current llamado ===');
    console.log('UserId:', userId);
    
    // Primero ver TODOS los quizzes del usuario para debug
    const allQuizzes = await dbAll(
      `SELECT q.id, q.mode, q.completed, q.started_at, q.completed_at, qs.code as status
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1
       ORDER BY started_at DESC`,
      [userId]
    );
    console.log('Todos los quizzes del usuario:', allQuizzes);

    const quiz = await dbGet(
      `SELECT q.*, qs.code AS status_code
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code = $2 AND q.completed = FALSE
       ORDER BY q.started_at DESC
       LIMIT 1`,
      [userId, QUIZ_STATUS.IN_PROGRESS]
    );

    if (!quiz) {
      console.log('✅ No hay quiz activo (status=en_curso)');
      return res.json({ hasActiveQuiz: false });
    }
    
    console.log('⚠️  Quiz activo encontrado:', {
      id: quiz.id,
      mode: quiz.mode,
      status: quiz.status_code,
      started_at: quiz.started_at,
      completed_at: quiz.completed_at
    });

    // Obtener todas las preguntas del cuestionario con sus respuestas (incluir opciones D y E)
    const questions = await dbAll(
      `SELECT 
        q.id as question_id,
        q.question_number,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.option_e,
        q.correct_answer,
        q.image_url,
        q.category_id,
        ua.user_answer,
        ua.id as answer_id
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       WHERE ua.quiz_id = $1
       ORDER BY ua.id`,
      [quiz.id]
    );
    
    // Agregar indicador de múltiples respuestas
    const questionsWithMetadata = questions.map(q => ({
      ...q,
      has_multiple_answers: q.correct_answer ? q.correct_answer.includes(',') : false
    }));

    res.json({
      hasActiveQuiz: true,
      quiz: {
        id: quiz.id,
        status: quiz.status_code,
        mode: quiz.mode,
        totalQuestions: quiz.total_questions,
        timeLimit: quiz.time_limit,
        startedAt: quiz.started_at
      },
      questions: questionsWithMetadata
    });
  } catch (error) {
    console.error('Error al obtener cuestionario actual:', error);
    res.status(500).json({ error: 'Error al obtener cuestionario actual' });
  }
});

export default router;
