import express from 'express';
import { dbAll, dbGet } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureQuizStatusSchema } from '../utils/quizStatusManager.js';

const router = express.Router();

// Obtener estadísticas generales del usuario
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const userId = req.userId;

    // Total de cuestionarios
    const totalQuizzes = await dbGet(
      `SELECT COUNT(*) as count
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code IN ('terminado', 'abandonado')`,
      [userId]
    );

    // Cuestionarios aprobados
    const passedQuizzes = await dbGet(
      `SELECT COUNT(*) as count
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code = 'terminado' AND q.passed = TRUE`,
      [userId]
    );

    // Cuestionarios abandonados
    const abandonedQuizzes = await dbGet(
      `SELECT COUNT(*) as count
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code = 'abandonado'`,
      [userId]
    );

    // Promedio de puntuación
    const avgScore = await dbGet(
      `SELECT AVG(q.score) as average
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code = 'terminado'`,
      [userId]
    );

    // Total de preguntas respondidas
    const totalQuestions = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers ua
       JOIN quizzes q ON ua.quiz_id = q.id
       WHERE q.user_id = $1 AND ua.user_answer IS NOT NULL`,
      [userId]
    );

    // Total de respuestas correctas
    const correctAnswers = await dbGet(
      `SELECT COUNT(*) as count 
       FROM user_answers ua
       JOIN quizzes q ON ua.quiz_id = q.id
       WHERE q.user_id = $1 AND ua.is_correct = TRUE`,
      [userId]
    );

    // Progreso por categoría
    const categoryProgress = await dbAll(
      `SELECT 
        c.name as category_name,
        up.questions_answered,
        up.correct_answers,
        ROUND((CAST(up.correct_answers AS NUMERIC) / up.questions_answered * 100), 2) as accuracy
       FROM user_progress up
       JOIN categories c ON up.category_id = c.id
       WHERE up.user_id = $1
       ORDER BY c.name`,
      [userId]
    );

    // Últimos 10 cuestionarios
    const recentQuizzes = await dbAll(
      `SELECT 
        q.id,
        q.mode,
        q.total_questions,
        q.correct_answers,
        q.score,
        q.passed,
        q.time_taken,
        q.started_at,
        q.completed_at,
        qs.code as status_code,
        qs.name as status_name,
        COALESCE(ua.answered_questions, 0) as answered_questions
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       LEFT JOIN (
         SELECT quiz_id, COUNT(*) FILTER (WHERE user_answer IS NOT NULL)::integer as answered_questions
         FROM user_answers
         GROUP BY quiz_id
       ) ua ON ua.quiz_id = q.id
       WHERE q.user_id = $1 AND qs.code IN ('terminado', 'abandonado')
       ORDER BY q.completed_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      overview: {
        totalQuizzes: totalQuizzes.count,
        passedQuizzes: passedQuizzes.count,
        failedQuizzes: totalQuizzes.count - passedQuizzes.count - abandonedQuizzes.count,
        abandonedQuizzes: abandonedQuizzes.count,
        averageScore: avgScore.average ? Math.round(avgScore.average * 100) / 100 : 0,
        totalQuestionsAnswered: totalQuestions.count,
        correctAnswers: correctAnswers.count,
        accuracy: totalQuestions.count > 0 
          ? Math.round((correctAnswers.count / totalQuestions.count) * 100 * 100) / 100
          : 0
      },
      categoryProgress,
      recentQuizzes
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// Obtener historial completo de cuestionarios
router.get('/history', authMiddleware, async (req, res) => {
  try {
    await ensureQuizStatusSchema();

    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const quizzes = await dbAll(
      `SELECT 
        q.id,
        q.mode,
        q.total_questions,
        q.correct_answers,
        q.score,
        q.passed,
        q.time_taken,
        q.time_limit,
        q.started_at,
        q.completed_at,
        qs.code as status_code,
        qs.name as status_name,
        COALESCE(ua.answered_questions, 0) as answered_questions
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       LEFT JOIN (
         SELECT quiz_id, COUNT(*) FILTER (WHERE user_answer IS NOT NULL)::integer as answered_questions
         FROM user_answers
         GROUP BY quiz_id
       ) ua ON ua.quiz_id = q.id
       WHERE q.user_id = $1 AND qs.code IN ('terminado', 'abandonado')
       ORDER BY q.completed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalCount = await dbGet(
      `SELECT COUNT(*) as count
       FROM quizzes q
       JOIN quiz_statuses qs ON q.status_id = qs.id
       WHERE q.user_id = $1 AND qs.code IN ('terminado', 'abandonado')`,
      [userId]
    );

    res.json({
      quizzes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount.count / limit),
        totalItems: totalCount.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

export default router;
