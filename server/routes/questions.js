import express from 'express';
import { dbAll, dbGet, dbRun } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Obtener todas las preguntas (admin)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const questions = await dbAll(`
      SELECT q.*, c.name as category_name 
      FROM questions q
      LEFT JOIN categories c ON q.category_id = c.id
      ORDER BY q.id
    `);
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

// Obtener categorías
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY name');
    res.json(categories);
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

// Obtener preguntas por categoría
router.get('/category/:categoryId', authMiddleware, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const questions = await dbAll(
      'SELECT * FROM questions WHERE category_id = $1 ORDER BY RANDOM()',
      [categoryId]
    );
    res.json(questions);
  } catch (error) {
    console.error('Error al obtener preguntas por categoría:', error);
    res.status(500).json({ error: 'Error al obtener preguntas' });
  }
});

// Agregar nueva pregunta
router.post('/', authMiddleware, async (req, res) => {
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

    const result = await dbRun(
      `INSERT INTO questions 
       (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [category_id, question_text, option_a, option_b, option_c, correct_answer, explanation, image_url, difficulty || 1]
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

export default router;
