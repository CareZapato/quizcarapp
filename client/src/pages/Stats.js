import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaChartLine, FaCheckCircle, FaTimesCircle, FaTrophy } from 'react-icons/fa';
import './Stats.css';

const Stats = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        axios.get('/stats/overview'),
        axios.get(`/stats/history?page=${currentPage}&limit=10`)
      ]);
      
      setStats(statsRes.data);
      setHistory(historyRes.data.quizzes);
      setPagination(historyRes.data.pagination);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container">
        <div className="alert alert-error">
          No se pudieron cargar las estadísticas
        </div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      <div className="stats-header">
        <h1>📊 Mis Estadísticas</h1>
        <p>Analiza tu progreso y rendimiento</p>
      </div>

      {/* Overview Cards */}
      <div className="overview-grid">
        <div className="overview-card highlight">
          <div className="card-icon" style={{ background: '#dbeafe' }}>
            <FaChartLine style={{ color: '#3b82f6' }} />
          </div>
          <div className="card-content">
            <h2>{stats.overview.totalQuizzes}</h2>
            <p>Cuestionarios Completados</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon" style={{ background: '#d1fae5' }}>
            <FaCheckCircle style={{ color: '#10b981' }} />
          </div>
          <div className="card-content">
            <h2>{stats.overview.passedQuizzes}</h2>
            <p>Aprobados</p>
            <span className="percentage">
              {stats.overview.totalQuizzes > 0
                ? ((stats.overview.passedQuizzes / stats.overview.totalQuizzes) * 100).toFixed(1)
                : 0}% de éxito
            </span>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon" style={{ background: '#fee2e2' }}>
            <FaTimesCircle style={{ color: '#ef4444' }} />
          </div>
          <div className="card-content">
            <h2>{stats.overview.failedQuizzes}</h2>
            <p>Suspendidos</p>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-icon" style={{ background: '#fef3c7' }}>
            <FaTrophy style={{ color: '#f59e0b' }} />
          </div>
          <div className="card-content">
            <h2>{stats.overview.averageScore.toFixed(1)}%</h2>
            <p>Promedio General</p>
            <span className="percentage">
              {stats.overview.accuracy.toFixed(1)}% precisión
            </span>
          </div>
        </div>
      </div>

      {/* Progreso por Categoría */}
      {stats.categoryProgress && stats.categoryProgress.length > 0 && (
        <div className="category-section">
          <h2>Progreso por Categoría</h2>
          <div className="category-grid">
            {stats.categoryProgress.map((cat) => (
              <div key={cat.category_name} className="category-card">
                <h3>{cat.category_name}</h3>
                <div className="category-stats">
                  <div className="stat">
                    <span className="stat-value">{cat.questions_answered}</span>
                    <span className="stat-label">Preguntas</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{cat.correct_answers}</span>
                    <span className="stat-label">Correctas</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{cat.accuracy}%</span>
                    <span className="stat-label">Precisión</span>
                  </div>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${cat.accuracy}%`,
                      background: cat.accuracy >= 80 ? '#10b981' : cat.accuracy >= 60 ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historial de Cuestionarios */}
      <div className="history-section">
        <h2>Historial de Cuestionarios</h2>
        
        {history.length === 0 ? (
          <div className="empty-state">
            <p>Aún no has completado ningún cuestionario</p>
            <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
              Comenzar Ahora
            </button>
          </div>
        ) : (
          <>
            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Modo</th>
                    <th>Resultado</th>
                    <th>Puntuación</th>
                    <th>Tiempo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((quiz) => (
                    <tr key={quiz.id}>
                      <td>{new Date(quiz.completed_at).toLocaleString('es-ES')}</td>
                      <td>
                        <span className="mode-badge">
                          {quiz.mode === 'real' ? '🚗 Real' : '📚 Extenso'}
                        </span>
                      </td>
                      <td>
                        <span className={`result-badge ${quiz.passed ? 'passed' : 'failed'}`}>
                          {quiz.passed ? '✓ Aprobado' : '✗ Suspendido'}
                        </span>
                      </td>
                      <td>
                        <strong>{quiz.score.toFixed(1)}%</strong>
                        <br />
                        <small>{quiz.correct_answers}/{quiz.total_questions}</small>
                      </td>
                      <td>{formatTime(quiz.time_taken)}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/results/${quiz.id}`)}
                          className="btn-small btn-primary"
                        >
                          Ver Detalles
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="btn btn-secondary"
                >
                  ← Anterior
                </button>
                
                <span className="page-info">
                  Página {currentPage} de {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={currentPage === pagination.totalPages}
                  className="btn btn-secondary"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Stats;
