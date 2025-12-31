import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaCheckCircle, FaTimesCircle, FaPlay } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveQuiz, setHasActiveQuiz] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, currentQuizRes] = await Promise.all([
        axios.get('/stats/overview'),
        axios.get('/quiz/current')
      ]);
      
      setStats(statsRes.data);
      setHasActiveQuiz(currentQuizRes.data.hasActiveQuiz);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (mode) => {
    navigate('/quiz', { state: { mode } });
  };

  const continueQuiz = () => {
    navigate('/quiz');
  };

  const handleAbandonQuiz = async () => {
    if (!window.confirm('¿Estás seguro de que deseas abandonar el cuestionario en progreso? Perderás todo el avance.')) {
      return;
    }

    try {
      const currentQuizRes = await axios.get('/quiz/current');
      if (currentQuizRes.data.hasActiveQuiz) {
        await axios.post('/quiz/abandon', {
          quizId: currentQuizRes.data.quiz.id
        });
        alert('Cuestionario abandonado exitosamente');
        // Recargar datos para actualizar el estado
        loadData();
      }
    } catch (error) {
      console.error('Error al abandonar cuestionario:', error);
      alert('Error al abandonar el cuestionario');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <h1>Panel de Control</h1>
        <p>Bienvenido a tu plataforma de práctica de conducción</p>
      </div>

      {hasActiveQuiz && (
        <div className="alert alert-info">
          <FaClock />
          <div>
            <strong>Tienes un cuestionario en progreso</strong>
            <p>Continúa donde lo dejaste o abandónalo para iniciar uno nuevo</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={continueQuiz} className="btn btn-primary">
              Continuar
            </button>
            <button onClick={handleAbandonQuiz} className="btn btn-danger btn-small">
              Abandonar
            </button>
          </div>
        </div>
      )}

      {/* Estadísticas rápidas */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#dbeafe' }}>
              📝
            </div>
            <div className="stat-info">
              <h3>{stats.overview.totalQuizzes}</h3>
              <p>Cuestionarios Realizados</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#d1fae5' }}>
              <FaCheckCircle style={{ color: '#10b981' }} />
            </div>
            <div className="stat-info">
              <h3>{stats.overview.passedQuizzes}</h3>
              <p>Aprobados</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fee2e2' }}>
              <FaTimesCircle style={{ color: '#ef4444' }} />
            </div>
            <div className="stat-info">
              <h3>{stats.overview.failedQuizzes}</h3>
              <p>Suspendidos</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: '#fef3c7' }}>
              🎯
            </div>
            <div className="stat-info">
              <h3>{stats.overview.averageScore.toFixed(1)}%</h3>
              <p>Promedio</p>
            </div>
          </div>
        </div>
      )}

      {/* Modos de cuestionario */}
      <div className="quiz-modes">
        <h2>Elige un Modo de Cuestionario</h2>
        <div className="modes-grid">
          <div className="mode-card">
            <div className="mode-icon">🚗</div>
            <h3>Modo Real</h3>
            <div className="mode-details">
              <p><strong>35 preguntas</strong></p>
              <p><FaClock /> 45 minutos</p>
              <p>Aprobado: 85%</p>
            </div>
            <p className="mode-description">
              Simula el examen real de conducción con el mismo número de preguntas y tiempo límite.
            </p>
            <button 
              onClick={() => startQuiz('real')} 
              className="btn btn-primary"
              disabled={hasActiveQuiz}
            >
              <FaPlay /> Iniciar Modo Real
            </button>
          </div>

          <div className="mode-card">
            <div className="mode-icon">📚</div>
            <h3>Modo Extenso</h3>
            <div className="mode-details">
              <p><strong>100 preguntas</strong></p>
              <p><FaClock /> 90 minutos</p>
              <p>Aprobado: 80%</p>
            </div>
            <p className="mode-description">
              Practica con más preguntas para abarcar todos los temas en profundidad.
            </p>
            <button 
              onClick={() => startQuiz('extended')} 
              className="btn btn-secondary"
              disabled={hasActiveQuiz}
            >
              <FaPlay /> Iniciar Modo Extenso
            </button>
          </div>

          <div className="mode-card practice-mode">
            <div className="mode-icon">⚡</div>
            <h3>Modo Práctica</h3>
            <div className="mode-details">
              <p><strong>∞ Preguntas</strong></p>
              <p><FaClock /> 1 min por pregunta</p>
              <p>Sin límite</p>
            </div>
            <p className="mode-description">
              Practica sin límites. Responde preguntas al azar, una tras otra. ¡Sal cuando quieras!
            </p>
            <button 
              onClick={() => startQuiz('practice')} 
              className="btn btn-success"
              disabled={hasActiveQuiz}
            >
              <FaPlay /> Iniciar Práctica
            </button>
          </div>
        </div>
      </div>

      {/* Últimos resultados */}
      {stats && stats.recentQuizzes.length > 0 && (
        <div className="recent-quizzes">
          <h2>Últimos Cuestionarios</h2>
          <div className="quiz-list">
            {stats.recentQuizzes.slice(0, 5).map((quiz) => (
              <div key={quiz.id} className="quiz-item">
                <div className="quiz-info">
                  <span className={`quiz-badge ${quiz.passed ? 'success' : 'danger'}`}>
                    {quiz.passed ? '✓ Aprobado' : '✗ Suspendido'}
                  </span>
                  <span className="quiz-mode">
                    {quiz.mode === 'real' ? 'Modo Real' : 'Modo Extenso'}
                  </span>
                  <span className="quiz-date">
                    {new Date(quiz.completed_at).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div className="quiz-score">
                  <strong>{quiz.score.toFixed(1)}%</strong>
                  <span>{quiz.correct_answers}/{quiz.total_questions}</span>
                </div>
                <button 
                  onClick={() => navigate(`/results/${quiz.id}`)}
                  className="btn btn-outline"
                >
                  Ver Detalles
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
