import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

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
    passingScore: 0, // Sin puntaje mínimo
    isInfinite: true
  }
};

// Función para seleccionar preguntas proporcionalmente de todas las categorías
async function selectProportionalQuestions(totalQuestions) {
  try {
    // Obtener todas las categorías
    const categories = await dbAll('SELECT id FROM categories');
    
    if (categories.length === 0) {
      throw new Error('No hay categorías disponibles');
    }

    // Calcular preguntas por categoría
    const questionsPerCategory = Math.floor(totalQuestions / categories.length);
    const remainder = totalQuestions % categories.length;

    let selectedQuestions = [];

    // Obtener preguntas de cada categoría
    for (let i = 0; i < categories.length; i++) {
      const categoryId = categories[i].id;
      const questionsToSelect = questionsPerCategory + (i < remainder ? 1 : 0);

      const questions = await dbAll(
        `SELECT * FROM questions 
         WHERE category_id = $1 
         ORDER BY RANDOM() 
         LIMIT $2`,
        [categoryId, questionsToSelect]
      );

      selectedQuestions = selectedQuestions.concat(questions);
    }

    // Si no hay suficientes preguntas, completar con aleatorias
    if (selectedQuestions.length < totalQuestions) {
      const additionalQuestions = await dbAll(
        `SELECT * FROM questions 
         WHERE id NOT IN (${selectedQuestions.map(q => q.id).join(',') || 0})
         ORDER BY RANDOM() 
         LIMIT $1`,
        [totalQuestions - selectedQuestions.length]
      );
      selectedQuestions = selectedQuestions.concat(additionalQuestions);
    }

    // Mezclar las preguntas
    return selectedQuestions.sort(() => Math.random() - 0.5);
  } catch (error) {
    console.error('Error al seleccionar preguntas:', error);
    throw error;
  }
}

// Iniciar un nuevo cuestionario
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { mode } = req.body;
    const userId = req.userId;

    let quizConfig;
    if (mode === 'practice') {
      quizConfig = QUIZ_MODES.PRACTICE;
    } else if (mode === 'extended') {
      quizConfig = QUIZ_MODES.EXTENDED;
    } else {
      quizConfig = QUIZ_MODES.REAL;
    }

    // Para modo práctica, solo tomar 1 pregunta aleatoria al inicio
    let questions;
    if (quizConfig.isInfinite) {
      questions = await dbAll(
        'SELECT * FROM questions ORDER BY RANDOM() LIMIT 1'
      );
    } else {
      // Seleccionar preguntas proporcionalmente para otros modos
      questions = await selectProportionalQuestions(quizConfig.totalQuestions);
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
    const quizResult = await dbRun(
      `INSERT INTO quizzes (user_id, mode, total_questions, time_limit)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, quizConfig.name, quizConfig.isInfinite ? 0 : quizConfig.totalQuestions, quizConfig.timeLimit]
    );

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
    const { quizId, questionId, userAnswer } = req.body;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [quizId, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (quiz.completed) {
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
    const { quizId } = req.body;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario y es modo práctica
    const quiz = await dbGet(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2 AND mode = $3',
      [quizId, userId, 'practice']
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado o no es modo práctica' });
    }

    // Obtener IDs de preguntas ya respondidas
    const answeredQuestions = await dbAll(
      'SELECT question_id FROM user_answers WHERE quiz_id = $1',
      [quizId]
    );

    const answeredIds = answeredQuestions.map(q => q.question_id);

    // Seleccionar una nueva pregunta al azar (evitando las ya respondidas si es posible)
    let newQuestion;
    if (answeredIds.length > 0) {
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
    const { quizId, timeTaken } = req.body;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [quizId, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    // Calcular resultados
    const correctAnswers = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers 
       WHERE quiz_id = $1 AND is_correct = TRUE`,
      [quizId]
    );

    const totalAnswered = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers 
       WHERE quiz_id = $1 AND user_answer IS NOT NULL`,
      [quizId]
    );

    const correctCount = correctAnswers.count;
    
    // Para el modo práctica, calcular el score basado en preguntas respondidas
    let totalForScore = quiz.total_questions;
    if (quiz.mode === 'practice') {
      totalForScore = totalAnswered.count || 1; // Evitar división por cero
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
      await dbRun(
        `UPDATE quizzes 
         SET total_questions = $1, correct_answers = $2, score = $3, time_taken = $4, completed = TRUE, passed = $5, completed_at = CURRENT_TIMESTAMP
         WHERE id = $6`,
        [totalAnswered.count, correctCount, score, timeTaken, passed, quizId]
      );
    } else {
      await dbRun(
        `UPDATE quizzes 
         SET correct_answers = $1, score = $2, time_taken = $3, completed = TRUE, passed = $4, completed_at = CURRENT_TIMESTAMP
         WHERE id = $5`,
        [correctCount, score, timeTaken, passed, quizId]
      );
    }

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
    const { quizId } = req.body;
    const userId = req.userId;

    console.log('Abandonando cuestionario:', { quizId, userId });

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [quizId, userId]
    );

    if (!quiz) {
      console.log('Cuestionario no encontrado');
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (quiz.completed) {
      console.log('Cuestionario ya completado');
      return res.status(400).json({ error: 'El cuestionario ya fue completado' });
    }

    // Eliminar las respuestas primero (clave foránea)
    const deleteAnswers = await dbRun('DELETE FROM user_answers WHERE quiz_id = $1', [quizId]);
    console.log('Respuestas eliminadas:', deleteAnswers.changes);
    
    // Eliminar el cuestionario
    const deleteQuiz = await dbRun('DELETE FROM quizzes WHERE id = $1', [quizId]);
    console.log('Cuestionario eliminado:', deleteQuiz.changes);

    res.json({
      message: 'Cuestionario abandonado exitosamente',
      deleted: true
    });
  } catch (error) {
    console.error('Error al abandonar cuestionario:', error);
    res.status(500).json({ error: 'Error al abandonar cuestionario' });
  }
});

// Obtener resultados detallados de un cuestionario
router.get('/:quizId/results', authMiddleware, async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.userId;

    // Verificar que el cuestionario pertenece al usuario
    const quiz = await dbGet(
      'SELECT * FROM quizzes WHERE id = $1 AND user_id = $2',
      [quizId, userId]
    );

    if (!quiz) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    if (!quiz.completed) {
      return res.status(400).json({ error: 'El cuestionario no ha sido completado' });
    }

    // Obtener todas las respuestas con detalles
    const answers = await dbAll(
      `SELECT 
        ua.id,
        ua.user_answer,
        ua.is_correct,
        q.id as question_id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.option_e,
        q.correct_answer,
        q.has_multiple_answers,
        q.explanation,
        q.image_url,
        c.name as category_name
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       LEFT JOIN categories c ON q.category_id = c.id
       WHERE ua.quiz_id = $1
       ORDER BY ua.id`,
      [quizId]
    );

    res.json({
      quiz: {
        id: quiz.id,
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
    const userId = req.userId;

    const quiz = await dbGet(
      `SELECT * FROM quizzes 
       WHERE user_id = $1 AND completed = FALSE 
       ORDER BY started_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (!quiz) {
      return res.json({ hasActiveQuiz: false });
    }

    // Obtener todas las preguntas del cuestionario con sus respuestas (incluir opciones D y E)
    const questions = await dbAll(
      `SELECT 
        q.id as question_id,
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
