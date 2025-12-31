import express from 'express';
import { dbAll, dbGet } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Obtener estadísticas generales del usuario
router.get('/overview', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Total de cuestionarios
    const totalQuizzes = await dbGet(
      'SELECT COUNT(*) as count FROM quizzes WHERE user_id = $1 AND completed = TRUE',
      [userId]
    );

    // Cuestionarios aprobados
    const passedQuizzes = await dbGet(
      'SELECT COUNT(*) as count FROM quizzes WHERE user_id = $1 AND passed = TRUE',
      [userId]
    );

    // Promedio de puntuación
    const avgScore = await dbGet(
      'SELECT AVG(score) as average FROM quizzes WHERE user_id = $1 AND completed = TRUE',
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
        id,
        mode,
        total_questions,
        correct_answers,
        score,
        passed,
        time_taken,
        started_at,
        completed_at
       FROM quizzes
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY completed_at DESC
       LIMIT 10`,
      [userId]
    );

    res.json({
      overview: {
        totalQuizzes: totalQuizzes.count,
        passedQuizzes: passedQuizzes.count,
        failedQuizzes: totalQuizzes.count - passedQuizzes.count,
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
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const quizzes = await dbAll(
      `SELECT 
        id,
        mode,
        total_questions,
        correct_answers,
        score,
        passed,
        time_taken,
        time_limit,
        started_at,
        completed_at
       FROM quizzes
       WHERE user_id = $1 AND completed = TRUE
       ORDER BY completed_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const totalCount = await dbGet(
      'SELECT COUNT(*) as count FROM quizzes WHERE user_id = $1 AND completed = TRUE',
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
