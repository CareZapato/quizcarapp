import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaTrophy, FaClock, FaCheckCircle, FaTimesCircle, FaHome } from 'react-icons/fa';
import './Results.css';

const Results = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(true);
  const [closing, setClosing] = useState(false);
  
  const { quizId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    loadResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const loadResults = async () => {
    try {
      console.log('=== CARGANDO RESULTADOS ===');
      console.log('QuizId desde URL:', quizId);
      
      const response = await axios.get(`/quiz/${quizId}/results`);
      console.log('Datos de resultados recibidos:', {
        quizId: response.data.quiz.id,
        mode: response.data.quiz.mode,
        completed: response.data.quiz.completed,
        score: response.data.quiz.score
      });
      
      setData(response.data);
    } catch (error) {
      console.error('Error al cargar resultados:', error);
      alert('Error al cargar los resultados');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = async () => {
    if (closing) return;
    
    setClosing(true);
    
    try {
      // Obtener el quiz actual desde el servidor (igual que Dashboard)
      const currentQuizRes = await axios.get('/quiz/current');
      
      if (!currentQuizRes.data.hasActiveQuiz) {
        console.log('No hay quiz activo, navegando al dashboard...');
        window.location.href = '/dashboard';
        return;
      }
      
      const currentQuizId = currentQuizRes.data.quiz.id;
      console.log('Quiz activo en servidor:', currentQuizId);
      console.log('Quiz desde URL:', quizId);
      console.log('Enviando petición de cierre...');
      
      // Llamar al endpoint abandon para cerrar el quiz
      const response = await axios.post('/quiz/abandon', {
        quizId: currentQuizId
      });
      
      console.log('Respuesta del servidor:', response.data);
      console.log('Esperando que la base de datos complete la transacción...');
      
      // IMPORTANTE: Esperar para asegurar que la BD commitee la transacción
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // VERIFICAR que el quiz realmente fue eliminado
      console.log('Verificando que el quiz fue eliminado...');
      const verifyRes = await axios.get('/quiz/current');
      console.log('Estado después de cerrar:', verifyRes.data);
      
      if (verifyRes.data.hasActiveQuiz) {
        console.error('❌ ERROR: El quiz NO fue eliminado!');
        alert('Error: No se pudo cerrar el cuestionario. Inténtalo desde el Dashboard.');
        setClosing(false);
        return;
      }
      
      console.log('✅ Quiz eliminado exitosamente, navegando al dashboard...');
      // Recargar la página completamente
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al cerrar cuestionario:', error);
      console.error('Detalles del error:', error.response?.data);
      window.location.href = '/dashboard';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container">
        <div className="alert alert-error">
          No se pudieron cargar los resultados
        </div>
      </div>
    );
  }

  const { quiz, answers } = data;
  const percentage = quiz.score;
  const passed = quiz.passed;

  return (
    <div className="results-container">
      {/* Hero Section */}
      <div className={`results-hero ${passed ? 'success' : 'fail'}`}>
        <div className="results-icon">
          {passed ? '🎉' : '😔'}
        </div>
        <h1>{passed ? '¡Felicitaciones!' : 'No Aprobado'}</h1>
        <p>
          {passed
            ? '¡Has aprobado el cuestionario!'
            : 'Sigue practicando, lo lograrás en el próximo intento'}
        </p>
        
        <div className="score-display">
          <div className="score-circle">
            <svg viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={passed ? '#10b981' : '#ef4444'}
                strokeWidth="20"
                strokeDasharray={`${(percentage / 100) * 565.48} 565.48`}
                strokeDashoffset="141.37"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{percentage.toFixed(1)}%</span>
              <span className="score-label">Puntuación</span>
            </div>
          </div>
        </div>
        
        {/* Botón Cerrar Resultado en Hero */}
        <div className="hero-actions">
          <button
            className="btn btn-primary btn-small"
            onClick={handleClose}
            disabled={closing}
            title="Finalizar revisión y volver al inicio"
          >
            <FaHome /> {closing ? 'Cerrando...' : 'Finalizar Revisión'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="results-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#d1fae5' }}>
            <FaCheckCircle style={{ color: '#10b981' }} />
          </div>
          <div className="stat-info">
            <h3>{quiz.correctAnswers}</h3>
            <p>Respuestas Correctas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <FaTimesCircle style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-info">
            <h3>{quiz.totalQuestions - quiz.correctAnswers}</h3>
            <p>Respuestas Incorrectas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <FaClock style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-info">
            <h3>{formatTime(quiz.timeTaken)}</h3>
            <p>Tiempo Utilizado</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <FaTrophy style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-info">
            <h3>
              {quiz.mode === 'real' && 'Modo Real'}
              {quiz.mode === 'extended' && 'Modo Extenso'}
              {quiz.mode === 'practice' && 'Modo Práctica'}
            </h3>
            <p>{quiz.totalQuestions} Preguntas</p>
          </div>
        </div>
      </div>

      {/* Review Answers */}
      <div className="results-review">
        <div className="review-header">
          <h2>Revisión de Respuestas</h2>
          <button
            className="btn btn-primary"
            onClick={() => setShowAnswers(!showAnswers)}
          >
            {showAnswers ? 'Ocultar' : 'Mostrar'} Detalles
          </button>
        </div>

        {showAnswers && (
          <div className="answers-list">
            {answers.map((answer, index) => {
              const isCorrect = answer.is_correct === true || answer.is_correct === 1;
              const userAnswered = answer.user_answer !== null && answer.user_answer !== '';
              
              return (
                <div key={answer.id} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'} ${!userAnswered ? 'unanswered' : ''}`}>
                  <div className="answer-header">
                    <div className="answer-number">
                      {!userAnswered ? (
                        <FaTimesCircle style={{ color: '#9ca3af' }} />
                      ) : isCorrect ? (
                        <FaCheckCircle style={{ color: '#10b981' }} />
                      ) : (
                        <FaTimesCircle style={{ color: '#ef4444' }} />
                      )}
                      <span>Pregunta {index + 1}</span>
                      {answer.has_multiple_answers && (
                        <span className="badge multi-badge">Múltiple</span>
                      )}
                    </div>
                    <span className="answer-category">{answer.category_name}</span>
                  </div>

                  <h3 className="answer-question">{answer.question_text}</h3>

                  {answer.image_url && (
                    <div className="answer-image">
                      <img src={answer.image_url} alt="Imagen de la pregunta" />
                    </div>
                  )}

                  <div className="answer-options">
                    {['A', 'B', 'C', 'D', 'E'].map(option => {
                      const optionKey = `option_${option.toLowerCase()}`;
                      const optionText = answer[optionKey];
                      
                      // No mostrar la opción si no tiene texto
                      if (!optionText || optionText.trim() === '') {
                        return null;
                      }
                      
                      // Normalizar respuestas para comparación
                      const correctAnswers = typeof answer.correct_answer === 'string'
                        ? answer.correct_answer.split(',').map(a => a.trim())
                        : [answer.correct_answer];
                      
                      const userAnswers = answer.user_answer 
                        ? (typeof answer.user_answer === 'string'
                            ? answer.user_answer.split(',').map(a => a.trim())
                            : [answer.user_answer])
                        : [];
                      
                      const isUserAnswer = userAnswers.includes(option);
                      const isCorrectAnswer = correctAnswers.includes(option);
                      
                      let className = 'answer-option';
                      if (isCorrectAnswer) className += ' correct-answer';
                      if (isUserAnswer && !isCorrectAnswer) className += ' wrong-answer';
                      if (isUserAnswer && isCorrectAnswer) className += ' user-correct';
                      
                      return (
                        <div key={option} className={className}>
                          <span className="option-letter">{option}</span>
                          <span className="option-text">{optionText}</span>
                          <div className="option-badges">
                            {isCorrectAnswer && !isUserAnswer && <span className="badge correct-badge">✓ Correcta</span>}
                            {isUserAnswer && !isCorrectAnswer && <span className="badge wrong-badge">✗ Tu respuesta</span>}
                            {isUserAnswer && isCorrectAnswer && <span className="badge correct-user-badge">✓ Tu respuesta correcta</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {!userAnswered && (
                    <div className="alert alert-info">
                      No respondiste esta pregunta
                    </div>
                  )}

                  {answer.explanation && (
                    <div className="answer-explanation">
                      <strong>Explicación:</strong> {answer.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="results-actions">
        <button
          className="btn btn-primary"
          onClick={() => navigate('/dashboard')}
        >
          <FaHome /> <span>Volver al Inicio</span>
        </button>
        {quiz.mode !== 'practice' && (
          <button
            className="btn btn-success"
            onClick={() => navigate('/quiz', { state: { mode: quiz.mode } })}
          >
            <FaCheckCircle /> <span>Intentar de Nuevo</span>
          </button>
        )}
        {quiz.mode === 'practice' && (
          <button
            className="btn btn-success"
            onClick={() => {
              navigate('/dashboard');
              setTimeout(() => {
                navigate('/quiz', { state: { mode: 'practice' } });
              }, 100);
            }}
          >
            <FaCheckCircle /> <span>Nueva Práctica</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Results;
