import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import './Quiz.css';

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode;

  useEffect(() => {
    initQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  const initQuiz = async () => {
    try {
      // Verificar si hay un cuestionario en progreso
      const currentRes = await axios.get('/quiz/current');
      
      if (currentRes.data.hasActiveQuiz) {
        // Cargar cuestionario existente
        const { quiz: existingQuiz, questions: existingQuestions } = currentRes.data;
        
        console.log('Cuestionario cargado:', existingQuiz);
        console.log('Preguntas cargadas:', existingQuestions?.length || 0);
        
        if (!existingQuestions || existingQuestions.length === 0) {
          console.error('No hay preguntas en el cuestionario');
          setLoading(false);
          return;
        }
        
        // Normalizar las preguntas: asegurarse de que tengan el campo 'id' y todas las opciones
        const normalizedQuestions = existingQuestions.map(q => ({
          id: q.question_id || q.id,
          question_text: q.question_text,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d || null,
          option_e: q.option_e || null,
          image_url: q.image_url,
          category_id: q.category_id,
          user_answer: q.user_answer,
          has_multiple_answers: q.has_multiple_answers || false
        }));
        
        console.log('Preguntas normalizadas:', normalizedQuestions.length);
        
        setQuiz(existingQuiz);
        setQuestions(normalizedQuestions);
        
        // Calcular tiempo restante
        const startTime = new Date(existingQuiz.startedAt).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = existingQuiz.timeLimit - elapsed;
        setTimeLeft(remaining > 0 ? remaining : 0);
        
        // Cargar respuestas previas
        const answersObj = {};
        normalizedQuestions.forEach(q => {
          if (q.user_answer) {
            // Verificar si es multi-respuesta
            if (q.user_answer.includes(',')) {
              answersObj[q.id] = q.user_answer.split(',').sort();
            } else {
              answersObj[q.id] = q.user_answer;
            }
          }
        });
        setAnswers(answersObj);
        setLoading(false);
      } else if (mode) {
        // Iniciar nuevo cuestionario
        console.log('Iniciando nuevo cuestionario con modo:', mode);
        const response = await axios.post('/quiz/start', { mode });
        console.log('Respuesta del servidor:', response.data);
        
        setQuiz({
          id: response.data.quizId,
          mode: response.data.mode,
          totalQuestions: response.data.totalQuestions,
          timeLimit: response.data.timeLimit
        });
        setQuestions(response.data.questions);
        setTimeLeft(response.data.timeLimit);
        setLoading(false);
      } else {
        // No hay modo especificado ni cuestionario en progreso
        console.log('No hay modo ni cuestionario en progreso, redirigiendo...');
        navigate('/dashboard');
        return;
      }
    } catch (error) {
      console.error('Error al iniciar cuestionario:', error);
      console.error('Detalles del error:', error.response?.data || error.message);
      // No redirigir inmediatamente, dejar que el usuario vea el error y pueda abandonar
      setLoading(false);
    }
  };

  const handleAnswer = async (questionId, answer) => {
    try {
      const question = questions.find(q => q.id === questionId);
      const currentAnswer = answers[questionId];
      let newAnswer;
      
      // Si la pregunta tiene múltiples respuestas correctas, siempre usar modo array
      if (question?.has_multiple_answers) {
        if (Array.isArray(currentAnswer)) {
          // Ya es array
          if (currentAnswer.includes(answer)) {
            // Remover respuesta
            newAnswer = currentAnswer.filter(a => a !== answer);
            if (newAnswer.length === 0) {
              // Permitir deseleccionar todas (deja la pregunta sin responder)
              newAnswer = null;
            }
          } else {
            // Agregar respuesta
            newAnswer = [...currentAnswer, answer].sort();
          }
        } else if (currentAnswer) {
          // Convertir a array
          if (currentAnswer === answer) {
            // Deseleccionar
            newAnswer = null;
          } else {
            newAnswer = [currentAnswer, answer].sort();
          }
        } else {
          // Primera selección en modo múltiple
          newAnswer = [answer];
        }
      } else {
        // Modo respuesta única
        if (currentAnswer === answer) {
          // Click en la misma opción: deseleccionar
          newAnswer = null;
        } else {
          // Seleccionar nueva opción
          newAnswer = answer;
        }
      }
      
      // Si newAnswer es null, eliminar la respuesta
      if (newAnswer === null) {
        await axios.post('/quiz/answer', {
          quizId: quiz.id,
          questionId,
          userAnswer: null
        });
        
        setAnswers(prev => {
          const newAnswers = { ...prev };
          delete newAnswers[questionId];
          return newAnswers;
        });
        return;
      }
      
      await axios.post('/quiz/answer', {
        quizId: quiz.id,
        questionId,
        userAnswer: newAnswer
      });
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswer
      }));
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `Tienes ${unanswered.length} preguntas sin responder. ¿Deseas entregar el cuestionario de todas formas?`
      );
      if (!confirm) return;
    }

    setSubmitting(true);
    
    try {
      const timeTaken = quiz.timeLimit - timeLeft;
      await axios.post('/quiz/complete', {
        quizId: quiz.id,
        timeTaken
      });
      
      navigate(`/results/${quiz.id}`);
    } catch (error) {
      console.error('Error al completar cuestionario:', error);
      alert('Error al entregar el cuestionario');
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!window.confirm('¿Estás seguro de que deseas abandonar este cuestionario? Perderás todo el progreso.')) {
      return;
    }

    try {
      await axios.post('/quiz/abandon', {
        quizId: quiz.id
      });
      
      alert('Cuestionario abandonado exitosamente');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al abandonar cuestionario:', error);
      alert('Error al abandonar el cuestionario');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="container">
        <div className="admin-form-container">
          <div className="alert alert-error">
            <h3>⚠️ No se pudo cargar el cuestionario</h3>
            <p>Puede que haya un cuestionario bloqueado o incompleto.</p>
          </div>
          <div className="form-actions" style={{ marginTop: '20px' }}>
            <button
              className="btn btn-danger"
              onClick={async () => {
                try {
                  // Obtener el cuestionario actual para poder abandonarlo
                  const currentRes = await axios.get('/quiz/current');
                  if (currentRes.data.hasActiveQuiz) {
                    await axios.post('/quiz/abandon', {
                      quizId: currentRes.data.quiz.id
                    });
                    alert('Cuestionario abandonado exitosamente');
                  }
                  navigate('/dashboard');
                } catch (err) {
                  console.error('Error al abandonar:', err);
                  alert('No se pudo abandonar el cuestionario. Por favor contacta al administrador.');
                }
              }}
            >
              🗑️ Abandonar Cuestionario Bloqueado
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/dashboard')}
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="quiz-container">
      {/* Header */}
      <div className="quiz-header">
        <div className="quiz-progress">
          <span>Pregunta {currentIndex + 1} de {questions.length}</span>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span>{getAnsweredCount()} respondidas</span>
        </div>
        
        <div className="quiz-header-actions">
          <button
            className="btn btn-danger btn-small"
            onClick={handleAbandon}
            title="Abandonar cuestionario"
          >
            ✕ Abandonar
          </button>
          
          <button
            className="btn btn-success btn-small"
            onClick={handleSubmit}
            disabled={submitting}
            title="Terminar y entregar cuestionario"
          >
            {submitting ? 'Entregando...' : '✓ Entregar'}
          </button>
          
          <div className={`quiz-timer ${timeLeft < 300 ? 'warning' : ''}`}>
            <FaClock />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="quiz-content">
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">Pregunta {currentIndex + 1}</span>
          </div>
          
          <h2 className="question-text">{currentQuestion.question_text}</h2>
          
          {currentQuestion.has_multiple_answers && (
            <div className="multi-answer-indicator">
              ✓ Esta pregunta tiene múltiples respuestas correctas. Puedes seleccionar más de una opción.
            </div>
          )}
          
          {currentQuestion.image_url && (
            <div className="question-image">
              <img src={currentQuestion.image_url} alt="Imagen de la pregunta" />
            </div>
          )}
          
          <div className="options">
            {['A', 'B', 'C', 'D', 'E'].map(option => {
              const optionKey = `option_${option.toLowerCase()}`;
              const optionText = currentQuestion[optionKey];
              
              // No mostrar la opción si no tiene texto
              if (!optionText || optionText.trim() === '') {
                return null;
              }
              
              const currentAnswer = answers[currentQuestion.id];
              const isSelected = Array.isArray(currentAnswer) 
                ? currentAnswer.includes(option)
                : currentAnswer === option;
              const isMultiAnswer = Array.isArray(currentAnswer);
              
              return (
                <button
                  key={option}
                  className={`option-button ${isSelected ? 'selected' : ''} ${isMultiAnswer ? 'multi-mode' : ''}`}
                  onClick={() => handleAnswer(currentQuestion.id, option)}
                >
                  <span className="option-letter">{option}</span>
                  <span className="option-text">{optionText}</span>
                  {isSelected && <FaCheckCircle className="check-icon" />}
                </button>
              );
            })}
          </div>
          
          {(() => {
            const currentAnswer = answers[currentQuestion.id];
            const isMultiAnswer = Array.isArray(currentAnswer);
            return isMultiAnswer && currentAnswer.length > 0 && (
              <div className="multi-answer-selected-info">
                📌 Respuestas seleccionadas: {currentAnswer.join(', ')} ({currentAnswer.length} {currentAnswer.length === 1 ? 'opción' : 'opciones'})
              </div>
            );
          })()}
        </div>

        {/* Navigation */}
        <div className="quiz-navigation">
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>
          
          <div className="question-dots">
            {questions.map((_, index) => (
              <button
                key={index}
                className={`dot ${index === currentIndex ? 'active' : ''} ${answers[questions[index].id] ? 'answered' : ''}`}
                onClick={() => setCurrentIndex(index)}
                title={`Pregunta ${index + 1}`}
              />
            ))}
          </div>
          
          {currentIndex < questions.length - 1 ? (
            <button
              className="btn btn-primary"
              onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
            >
              Siguiente →
            </button>
          ) : (
            <button
              className="btn btn-success"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Entregando...' : 'Entregar Cuestionario'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
