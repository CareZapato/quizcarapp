import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaCheckCircle, FaTimesCircle, FaPlay } from 'react-icons/fa';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasActiveQuiz, setHasActiveQuiz] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, [location]); // Recargar cuando cambie la ubicación

  const loadData = async () => {
    try {
      console.log('=== Dashboard loadData() iniciado ===');
      setHasActiveQuiz(false);

      // Agregar timestamp para evitar caché
      const timestamp = Date.now();
      const [statsRes, currentQuizRes] = await Promise.all([
        axios.get(`/stats/overview?_t=${timestamp}`),
        axios.get(`/quiz/current?_t=${timestamp}`)
      ]);
      
      console.log('Respuesta de /quiz/current:', currentQuizRes.data);
      console.log('hasActiveQuiz:', currentQuizRes.data.hasActiveQuiz);
      
      setStats(statsRes.data);
      setHasActiveQuiz(
        Boolean(currentQuizRes.data?.hasActiveQuiz) &&
        currentQuizRes.data?.quiz?.status === 'en_curso'
      );
      console.log('=== Dashboard loadData() completado ===');
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setHasActiveQuiz(false);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (mode) => {
    try {
      const currentQuizRes = await axios.get('/quiz/current?_t=' + Date.now());
      const active = Boolean(currentQuizRes.data?.hasActiveQuiz) && currentQuizRes.data?.quiz?.status === 'en_curso';

      if (active) {
        setHasActiveQuiz(true);
        alert('Ya tienes un cuestionario en curso. Debes continuarlo o abandonarlo antes de iniciar uno nuevo.');
        return;
      }

      navigate('/quiz', { state: { mode } });
    } catch (error) {
      console.error('Error al validar cuestionario en curso:', error);
      alert('No se pudo validar el estado del cuestionario. Inténtalo nuevamente.');
    }
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
            <div className="stat-icon" style={{ background: '#e5e7eb' }}>
              📴
            </div>
            <div className="stat-info">
              <h3>{stats.overview.abandonedQuizzes || 0}</h3>
              <p>Abandonados</p>
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
                  <span className={`quiz-badge ${quiz.status_code === 'abandonado' ? 'neutral' : 'info'}`}>
                    {quiz.status_code === 'abandonado' ? '⏹ Abandonado' : '✓ Terminado'}
                  </span>
                  <span className="quiz-mode">
                    {quiz.mode === 'real' && 'Modo Real'}
                    {quiz.mode === 'extended' && 'Modo Extenso'}
                    {quiz.mode === 'practice' && 'Modo Práctica'}
                  </span>
                  <span className="quiz-date">
                    {new Date(quiz.completed_at).toLocaleString('es-ES', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <div className="quiz-score">
                  <strong>{quiz.status_code === 'abandonado' ? '--' : `${quiz.score ? quiz.score.toFixed(1) : '0.0'}%`}</strong>
                  <span className="quiz-metric">Respondidas: {quiz.answered_questions || 0}/{quiz.total_questions}</span>
                  <span className="quiz-metric">Correctas: {quiz.correct_answers}/{quiz.total_questions}</span>
                </div>
                <button 
                  onClick={() => navigate(`/results/${quiz.id}`)}
                  className="btn btn-outline"
                  disabled={quiz.status_code === 'abandonado'}
                >
                  {quiz.status_code === 'abandonado' ? 'Sin Revisión' : 'Ver Detalles'}
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
