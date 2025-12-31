# 🛠️ Guía de Desarrollo y Expansión

Esta guía te ayudará a extender y personalizar la aplicación según tus necesidades.

## 🚀 Añadir Nuevas Funcionalidades

### 1. Crear un Panel de Administración

#### Backend: Rutas de Administración

Crear `server/routes/admin.js`:

```javascript
import express from 'express';
import { dbAll, dbRun, dbGet } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Middleware adicional para verificar si es admin
const adminMiddleware = async (req, res, next) => {
  const user = await dbGet('SELECT is_admin FROM users WHERE id = ?', [req.userId]);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

// Obtener todas las preguntas
router.get('/questions', authMiddleware, adminMiddleware, async (req, res) => {
  const questions = await dbAll('SELECT * FROM questions ORDER BY id DESC');
  res.json(questions);
});

// Crear pregunta
router.post('/questions', authMiddleware, adminMiddleware, async (req, res) => {
  const { category_id, question_text, option_a, option_b, option_c, correct_answer, explanation } = req.body;
  const result = await dbRun(
    'INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [category_id, question_text, option_a, option_b, option_c, correct_answer, explanation]
  );
  res.json({ id: result.id });
});

// Actualizar pregunta
router.put('/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { question_text, option_a, option_b, option_c, correct_answer, explanation } = req.body;
  await dbRun(
    'UPDATE questions SET question_text = ?, option_a = ?, option_b = ?, option_c = ?, correct_answer = ?, explanation = ? WHERE id = ?',
    [question_text, option_a, option_b, option_c, correct_answer, explanation, id]
  );
  res.json({ success: true });
});

// Eliminar pregunta
router.delete('/questions/:id', authMiddleware, adminMiddleware, async (req, res) => {
  await dbRun('DELETE FROM questions WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

export default router;
```

#### Frontend: Página de Admin

Crear `client/src/pages/Admin.js`:

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({
    category_id: 1,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    correct_answer: 'A',
    explanation: ''
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const res = await axios.get('/api/admin/questions');
    setQuestions(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post('/api/admin/questions', formData);
    loadQuestions();
    // Resetear form
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar pregunta?')) {
      await axios.delete(`/api/admin/questions/${id}`);
      loadQuestions();
    }
  };

  return (
    <div className="container">
      <h1>Panel de Administración</h1>
      
      {/* Formulario para añadir/editar preguntas */}
      <form onSubmit={handleSubmit}>
        {/* Campos del formulario */}
      </form>

      {/* Lista de preguntas */}
      <div className="questions-list">
        {questions.map(q => (
          <div key={q.id} className="question-item">
            <p>{q.question_text}</p>
            <button onClick={() => handleDelete(q.id)}>Eliminar</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
```

### 2. Añadir Modo de Práctica por Categoría

#### Backend: Endpoint para Práctica por Categoría

En `server/routes/quiz.js`:

```javascript
// Iniciar práctica por categoría
router.post('/practice/:categoryId', authMiddleware, async (req, res) => {
  const { categoryId } = req.params;
  const { questionCount = 10 } = req.body;

  const questions = await dbAll(
    'SELECT * FROM questions WHERE category_id = ? ORDER BY RANDOM() LIMIT ?',
    [categoryId, questionCount]
  );

  // Similar lógica a /start pero sin tiempo límite
  // ...
});
```

#### Frontend: Página de Práctica

```javascript
const Practice = () => {
  const [categories, setCategories] = useState([]);

  const startPractice = async (categoryId) => {
    const res = await axios.post(`/api/quiz/practice/${categoryId}`, {
      questionCount: 10
    });
    // Redirigir a página de quiz con modo práctica
  };

  return (
    <div>
      <h1>Práctica por Categoría</h1>
      {categories.map(cat => (
        <button key={cat.id} onClick={() => startPractice(cat.id)}>
          Practicar {cat.name}
        </button>
      ))}
    </div>
  );
};
```

### 3. Sistema de Logros y Badges

#### Backend: Tabla de Logros

```sql
CREATE TABLE achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement TEXT,
  points INTEGER DEFAULT 0
);

CREATE TABLE user_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  achievement_id INTEGER,
  unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
```

Ejemplos de logros:
- "Primera Victoria" - Aprobar primer cuestionario
- "Perfeccionista" - Obtener 100% en un cuestionario
- "Persistente" - Completar 10 cuestionarios
- "Especialista" - 90% de precisión en una categoría

#### Backend: Verificar Logros

```javascript
async function checkAchievements(userId) {
  // Obtener estadísticas del usuario
  const stats = await getUserStats(userId);
  
  // Verificar logros
  if (stats.totalQuizzes === 1) {
    await unlockAchievement(userId, 'first-victory');
  }
  
  if (stats.perfectScores > 0) {
    await unlockAchievement(userId, 'perfectionist');
  }
  
  // ... más verificaciones
}
```

### 4. Exportar Resultados a PDF

#### Backend: Instalar Dependencia

```bash
npm install pdfkit
```

#### Backend: Endpoint para PDF

```javascript
import PDFDocument from 'pdfkit';

router.get('/quiz/:quizId/pdf', authMiddleware, async (req, res) => {
  const { quizId } = req.params;
  const data = await getQuizResults(quizId);
  
  const doc = new PDFDocument();
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=resultado-${quizId}.pdf`);
  
  doc.pipe(res);
  
  doc.fontSize(20).text('Resultados del Cuestionario', { align: 'center' });
  doc.fontSize(14).text(`Puntuación: ${data.score}%`);
  doc.fontSize(14).text(`Resultado: ${data.passed ? 'APROBADO' : 'SUSPENDIDO'}`);
  
  // Añadir más contenido...
  
  doc.end();
});
```

### 5. Modo Oscuro

#### Frontend: Context para Tema

```javascript
// context/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

#### Frontend: CSS para Modo Oscuro

```css
body.dark-mode {
  --white: #1f2937;
  --light: #374151;
  --dark: #f3f4f6;
  background: #111827;
  color: #f3f4f6;
}

body.dark-mode .card {
  background: #1f2937;
  color: #f3f4f6;
}
```

### 6. Notificaciones Push (PWA)

#### Frontend: Service Worker

```javascript
// public/service-worker.js
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/logo.png'
  });
});
```

#### Frontend: Solicitar Permiso

```javascript
const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notificaciones habilitadas');
    }
  }
};
```

### 7. Sistema de Comentarios en Preguntas

#### Backend: Tabla de Comentarios

```sql
CREATE TABLE question_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER,
  user_id INTEGER,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### Backend: Endpoints

```javascript
// Obtener comentarios de una pregunta
router.get('/questions/:id/comments', authMiddleware, async (req, res) => {
  const comments = await dbAll(
    'SELECT c.*, u.username FROM question_comments c JOIN users u ON c.user_id = u.id WHERE question_id = ?',
    [req.params.id]
  );
  res.json(comments);
});

// Añadir comentario
router.post('/questions/:id/comments', authMiddleware, async (req, res) => {
  const { comment } = req.body;
  await dbRun(
    'INSERT INTO question_comments (question_id, user_id, comment) VALUES (?, ?, ?)',
    [req.params.id, req.userId, comment]
  );
  res.json({ success: true });
});
```

### 8. Ranking de Usuarios

#### Backend: Endpoint de Ranking

```javascript
router.get('/ranking', authMiddleware, async (req, res) => {
  const ranking = await dbAll(`
    SELECT 
      u.username,
      COUNT(q.id) as total_quizzes,
      AVG(q.score) as avg_score,
      SUM(CASE WHEN q.passed = 1 THEN 1 ELSE 0 END) as passed_count
    FROM users u
    LEFT JOIN quizzes q ON u.id = q.user_id AND q.completed = 1
    GROUP BY u.id
    ORDER BY avg_score DESC, passed_count DESC
    LIMIT 100
  `);
  
  res.json(ranking);
});
```

### 9. Recordatorios de Práctica

#### Backend: Tarea Programada

```javascript
import cron from 'node-cron';

// Enviar recordatorio cada día a las 10:00
cron.schedule('0 10 * * *', async () => {
  const inactiveUsers = await getInactiveUsers(7); // 7 días sin actividad
  
  for (const user of inactiveUsers) {
    await sendReminderEmail(user.email);
  }
});
```

### 10. Multijugador / Desafíos

#### Backend: Sistema de Desafíos

```sql
CREATE TABLE challenges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  creator_id INTEGER,
  opponent_id INTEGER,
  mode TEXT,
  status TEXT DEFAULT 'pending',
  creator_score REAL,
  opponent_score REAL,
  winner_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (opponent_id) REFERENCES users(id)
);
```

```javascript
// Crear desafío
router.post('/challenge', authMiddleware, async (req, res) => {
  const { opponentId, mode } = req.body;
  const result = await dbRun(
    'INSERT INTO challenges (creator_id, opponent_id, mode) VALUES (?, ?, ?)',
    [req.userId, opponentId, mode]
  );
  res.json({ challengeId: result.id });
});
```

## 🔧 Mejoras de Rendimiento

### 1. Implementar Caché con Redis

```bash
npm install redis
```

```javascript
import redis from 'redis';

const client = redis.createClient();

// Cachear preguntas
const cacheQuestions = async () => {
  const questions = await dbAll('SELECT * FROM questions');
  await client.set('questions', JSON.stringify(questions), 'EX', 3600);
};

// Obtener desde caché
const getQuestions = async () => {
  const cached = await client.get('questions');
  if (cached) return JSON.parse(cached);
  
  const questions = await dbAll('SELECT * FROM questions');
  await client.set('questions', JSON.stringify(questions), 'EX', 3600);
  return questions;
};
```

### 2. Paginación Eficiente

```javascript
router.get('/questions', authMiddleware, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const questions = await dbAll(
    'SELECT * FROM questions ORDER BY id LIMIT ? OFFSET ?',
    [limit, offset]
  );

  const total = await dbGet('SELECT COUNT(*) as count FROM questions');

  res.json({
    questions,
    pagination: {
      page,
      limit,
      total: total.count,
      pages: Math.ceil(total.count / limit)
    }
  });
});
```

### 3. Lazy Loading de Imágenes

```javascript
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setImageSrc(src);
        observer.disconnect();
      }
    });

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return <img ref={imgRef} src={imageSrc || '/placeholder.jpg'} alt={alt} />;
};
```

## 🧪 Testing

### Backend: Tests con Jest

```bash
npm install --save-dev jest supertest
```

```javascript
// server/tests/auth.test.js
import request from 'supertest';
import app from '../index.js';

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@test.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'demo',
        password: 'password123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });
});
```

### Frontend: Tests con React Testing Library

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

```javascript
// client/src/pages/Login.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Login from './Login';

test('renders login form', () => {
  render(<Login />);
  expect(screen.getByPlaceholderText(/usuario/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
});

test('submits login form', async () => {
  render(<Login />);
  
  fireEvent.change(screen.getByPlaceholderText(/usuario/i), {
    target: { value: 'demo' }
  });
  
  fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
    target: { value: 'password123' }
  });
  
  fireEvent.click(screen.getByText(/iniciar sesión/i));
  
  // Verificar navegación o mensaje de éxito
});
```

## 📚 Recursos Adicionales

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [JWT.io](https://jwt.io/)
- [React Router](https://reactrouter.com/)

---

**¡Con estas herramientas puedes llevar tu aplicación al siguiente nivel! 🚀**
