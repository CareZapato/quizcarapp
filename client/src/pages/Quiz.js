import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { PRACTICE_QUESTION_TIME } from '../config';
import './Quiz.css';

const Quiz = () => {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceStats, setPracticeStats] = useState({ correct: 0, total: 0 });
  const [questionTimeLeft, setQuestionTimeLeft] = useState(PRACTICE_QUESTION_TIME);
  const [loadingNext, setLoadingNext] = useState(false);
  const [abandoning, setAbandoning] = useState(false);
  const [fontSize, setFontSize] = useState('small'); // 'small', 'medium', 'large'
  const [answerFeedback, setAnswerFeedback] = useState({ show: false, isCorrect: null });
  
  const navigate = useNavigate();
  const location = useLocation();
  const mode = location.state?.mode;
  
  const toggleFontSize = () => {
    setFontSize(prev => {
      if (prev === 'small') return 'medium';
      if (prev === 'medium') return 'large';
      return 'small';
    });
  };
  
  // Ref para prevenir doble llamada a /quiz/start (causado por React StrictMode)
  const startQuizCalled = useRef(false);
  // Guard para evitar que handlePracticeTimeout se dispare más de una vez por pregunta
  const timeoutCalledRef = useRef(false);

  useEffect(() => {
    initQuiz();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Timer para modo normal (tiempo total)
    if (!isPracticeMode && timeLeft <= 0) return;

    if (!isPracticeMode) {
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, isPracticeMode]);

  useEffect(() => {
    // Timer por pregunta en modo práctica.
    // IMPORTANTE: questionTimeLeft NO está en las deps para evitar que el efecto
    // se re-ejecute cada segundo (lo que destruiría y re-crearía el intervalo cada
    // segundo, generando una carrera y llamadas dobles a handlePracticeTimeout).
    // El valor actual se lee via la forma funcional del setter (prev =>) sin necesitar la dep.
    // El timer solo se reinicia al cambiar de pregunta (currentIndex) o al entrar en práctica.
    if (!isPracticeMode) return;

    timeoutCalledRef.current = false; // reset del guard al arrancar cada pregunta
    setQuestionTimeLeft(PRACTICE_QUESTION_TIME); // asegurar que arranca desde el tope

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!timeoutCalledRef.current) {
            timeoutCalledRef.current = true;
            handlePracticeTimeout();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPracticeMode, currentIndex]);

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
              answersObj[q.id] = q.user_answer
                .split(',')
                .map(a => a.trim().toUpperCase())
                .sort();
            } else {
              answersObj[q.id] = q.user_answer.trim().toUpperCase();
            }
          }
        });
        setAnswers(answersObj);
        setLoading(false);
      } else if (mode) {
        // Iniciar nuevo cuestionario
        // Prevenir doble llamada causada por React StrictMode en desarrollo
        if (startQuizCalled.current) {
          console.log('⚠️  Llamada duplicada a /quiz/start prevenida');
          return;
        }
        startQuizCalled.current = true;
        
        console.log('Iniciando nuevo cuestionario con modo:', mode);
        const response = await axios.post('/quiz/start', { mode });
        console.log('Respuesta del servidor:', response.data);
        
        setQuiz({
          id: response.data.quizId,
          mode: response.data.mode,
          totalQuestions: response.data.totalQuestions,
          timeLimit: response.data.timeLimit,
          isInfinite: response.data.isInfinite || false
        });
        setQuestions(response.data.questions);
        setIsPracticeMode(response.data.isInfinite || false);
        
        if (response.data.isInfinite) {
          setQuestionTimeLeft(PRACTICE_QUESTION_TIME);
        } else {
          setTimeLeft(response.data.timeLimit);
        }
        
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
        // Normalizar currentAnswer a array o null
        let currentArray = null;
        if (Array.isArray(currentAnswer)) {
          currentArray = currentAnswer;
        } else if (currentAnswer) {
          currentArray = [currentAnswer];
        }
        
        if (currentArray && currentArray.includes(answer)) {
          // Deseleccionar: remover la opción del array
          const filtered = currentArray.filter(a => a !== answer);
          // SIEMPRE permitir deseleccionar, incluso si es la última
          newAnswer = filtered.length > 0 ? filtered : null;
        } else {
          // Seleccionar: agregar la opción
          newAnswer = currentArray ? [...currentArray, answer].sort() : [answer];
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
      
      // Si newAnswer es null o undefined, eliminar la respuesta completamente
      if (newAnswer === null || newAnswer === undefined) {
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
        
        console.log(`✓ Respuesta eliminada para pregunta ${questionId}`);
        return;
      }
      
      const response = await axios.post('/quiz/answer', {
        quizId: quiz.id,
        questionId,
        userAnswer: newAnswer
      });
      
      setAnswers(prev => ({
        ...prev,
        [questionId]: newAnswer
      }));
      
      console.log(`✓ Respuesta guardada para pregunta ${questionId}:`, newAnswer);

      // En modo práctica, avanzar automáticamente SOLO si es respuesta única
      if (isPracticeMode && !question?.has_multiple_answers) {
        // Mostrar feedback visual
        setAnswerFeedback({ show: true, isCorrect: response.data.isCorrect });
        
        // Actualizar estadísticas
        setPracticeStats(prev => ({
          correct: prev.correct + (response.data.isCorrect ? 1 : 0),
          total: prev.total + 1
        }));

        // Esperar un momento para mostrar feedback y avanzar
        setTimeout(() => {
          setAnswerFeedback({ show: false, isCorrect: null });
          handleNextPracticeQuestion();
        }, 1200);
      }
    } catch (error) {
      console.error('Error al guardar respuesta:', error);
    }
  };

  const handlePracticeTimeout = async () => {
    const question = questions[currentIndex];
    if (!question) return;

    try {
      // Registrar la pregunta como incorrecta (sin respuesta)
      await axios.post('/quiz/answer', {
        quizId: quiz.id,
        questionId: question.id,
        userAnswer: null
      });
    } catch (e) {
      console.error('Error al registrar timeout:', e);
    }

    // Actualizar stats: total +1, corrects sin cambio
    setPracticeStats(prev => ({ ...prev, total: prev.total + 1 }));

    // Mostrar feedback negativo breve y avanzar
    setAnswerFeedback({ show: true, isCorrect: false });
    setTimeout(() => {
      setAnswerFeedback({ show: false, isCorrect: null });
      handleNextPracticeQuestion();
    }, 1200);
  };

  const handleNextPracticeQuestion = async () => {
    if (loadingNext) return;
    
    try {
      setLoadingNext(true);
      
      // Obtener siguiente pregunta
      const response = await axios.post('/quiz/next-question', {
        quizId: quiz.id
      });

      // Agregar la nueva pregunta a la lista
      setQuestions(prev => {
        const updated = [...prev, response.data.question];
        return updated;
      });

      // Limpiar todas las respuestas para evitar alternativas preseleccionadas
      setAnswers({});

      // Avanzar al siguiente índice (nueva pregunta)
      setCurrentIndex(prev => prev + 1);
      
      // Resetear timer de pregunta — el useEffect lo reinicia al cambiar currentIndex
      setQuestionTimeLeft(PRACTICE_QUESTION_TIME);
      
      setLoadingNext(false);
    } catch (error) {
      console.error('Error al obtener siguiente pregunta:', error);
      alert('Error al cargar la siguiente pregunta');
      setLoadingNext(false);
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
      console.log('=== LLAMANDO A /quiz/complete ===');
      console.log('QuizId:', quiz.id);
      console.log('TimeTaken:', timeTaken);
      
      await axios.post('/quiz/complete', {
        quizId: quiz.id,
        timeTaken
      });
      
      console.log('Quiz completado exitosamente, navegando a resultados...');
      navigate(`/results/${quiz.id}`);
    } catch (error) {
      console.error('Error al completar cuestionario:', error);
      alert('Error al entregar el cuestionario');
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (abandoning) return; // Prevenir múltiples clicks

    // En modo práctica, preguntar si desea terminar y ver resultados
    if (isPracticeMode) {
      if (!window.confirm('¿Deseas terminar la práctica y ver tus resultados?')) {
        return;
      }
      // Navegar a resultados
      setAbandoning(true);
      try {
        await axios.post('/quiz/complete', {
          quizId: quiz.id,
          timeTaken: 0, // No importa el tiempo en modo práctica
          excludeQuestionId: questions[currentIndex]?.id
        });
        navigate(`/results/${quiz.id}`);
      } catch (error) {
        console.error('Error al finalizar práctica:', error);
        setAbandoning(false);
      }
      return;
    }

    // Para otros modos, abandonar normalmente
    if (!window.confirm('¿Estás seguro de que deseas abandonar este cuestionario? Se registrará como abandonado y volverás al inicio.')) {
      return;
    }

    setAbandoning(true);
    
    try {
      console.log('Enviando petición de abandono...');

      const response = await axios.post('/quiz/abandon', {
        quizId: quiz.id
      });

      console.log('Respuesta del servidor:', response.data);

      console.log('✅ Quiz abandonado, navegando al dashboard...');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error al abandonar cuestionario:', error);
      console.error('Detalles del error:', error.response?.data);
      alert('Error al abandonar el cuestionario: ' + (error.response?.data?.error || error.message));
      setAbandoning(false);
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
  const hasLongContent = currentQuestion && (
    (currentQuestion.question_text || '').length > 120 ||
    ['option_a', 'option_b', 'option_c', 'option_d', 'option_e']
      .some(key => (currentQuestion[key] || '').length > 70)
  );
  
  // Debug: verificar si viene question_number
  if (currentQuestion && !currentQuestion.question_number) {
    console.warn('⚠️ La pregunta no tiene question_number:', currentQuestion.id || currentQuestion.question_id);
  }

  return (
    <>
      {/* Renderizar controles en el Navbar usando Portal */}
      {typeof document !== 'undefined' && document.getElementById('quiz-navbar-controls') && ReactDOM.createPortal(
        <div className="quiz-navbar-content">
          <div className="quiz-navbar-info">
            {isPracticeMode ? (
              <>
                <span className="quiz-label">Pregunta {currentIndex + 1}</span>
                <div className="practice-stats-nav">
                  <span className="stat-correct">✓ {practiceStats.correct}</span>
                  <span className="stat-total">📊 {practiceStats.total}</span>
                  {practiceStats.total > 0 && (
                    <span className="stat-percentage">
                      {((practiceStats.correct / practiceStats.total) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="quiz-label">Pregunta {currentIndex + 1}/{questions.length}</span>
                <div className="progress-bar-nav">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <span className="quiz-answered">{getAnsweredCount()}</span>
              </>
            )}
          </div>
          
          <div className="quiz-navbar-actions">
            <button
              className="btn btn-font-size btn-nav"
              onClick={toggleFontSize}
              title={`Tamaño de fuente: ${fontSize === 'small' ? 'Pequeño' : fontSize === 'medium' ? 'Mediano' : 'Grande'}`}
            >
              {fontSize === 'small' && <span style={{fontSize: '10px', fontWeight: 'bold'}}>Aa</span>}
              {fontSize === 'medium' && <span style={{fontSize: '14px', fontWeight: 'bold'}}>Aa</span>}
              {fontSize === 'large' && <span style={{fontSize: '18px', fontWeight: 'bold'}}>Aa</span>}
            </button>
            
            <button
              className="btn btn-danger btn-nav"
              onClick={handleAbandon}
              disabled={abandoning}
              title="Abandonar cuestionario"
            >
              {abandoning ? '⏳' : `✕ ${isPracticeMode ? 'Terminar' : 'Abandonar'}`}
            </button>
            
            {!isPracticeMode && (
              <button
                className="btn btn-success btn-nav"
                onClick={handleSubmit}
                disabled={submitting}
                title="Terminar y entregar cuestionario"
              >
                {submitting ? '⏳' : '✓ Entregar'}
              </button>
            )}
            
            <div className={`quiz-timer-nav ${isPracticeMode ? 'practice' : ''} ${timeLeft < 300 || questionTimeLeft < 10 ? 'warning' : ''}`}>
              <FaClock />
              <span>{isPracticeMode ? formatTime(questionTimeLeft) : formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>,
        document.getElementById('quiz-navbar-controls')
      )}

      <div className={`quiz-container font-size-${fontSize} ${hasLongContent ? 'dense-text-mode' : ''}`}>
        {/* Question */}
        <div className="quiz-content">
        <div className="question-card">
          <div className="question-header">
            <span className="question-number">
              Pregunta {currentIndex + 1}
              {currentQuestion.question_number && (
                <span className="question-id"> (N° {currentQuestion.question_number})</span>
              )}
            </span>
          </div>
          
          <h2 className="question-text">
            <span className="question-inline-number">{currentIndex + 1})</span>
            {' '}{currentQuestion.question_text}
          </h2>
          
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
            
            // Mostrar contador de selecciones si hay respuestas
            if (isMultiAnswer && currentAnswer.length > 0) {
              return (
                <div className="multi-answer-selected-info">
                  📌 Respuestas seleccionadas: {currentAnswer.join(', ')} ({currentAnswer.length} {currentAnswer.length === 1 ? 'opción' : 'opciones'})
                </div>
              );
            }
            
            return null;
          })()}
          
          {/* Botón de confirmar en modo práctica con selección múltiple */}
          {isPracticeMode && currentQuestion.has_multiple_answers && answers[currentQuestion.id] && (
            <button
              className="btn btn-success btn-large confirm-button"
              onClick={async () => {
                const currentAnswer = answers[currentQuestion.id];
                if (!currentAnswer) return;
                
                try {
                  const response = await axios.post('/quiz/answer', {
                    quizId: quiz.id,
                    questionId: currentQuestion.id,
                    userAnswer: currentAnswer
                  });
                  
                  // Mostrar feedback visual
                  setAnswerFeedback({ show: true, isCorrect: response.data.isCorrect });
                  
                  // Actualizar estadísticas
                  setPracticeStats(prev => ({
                    correct: prev.correct + (response.data.isCorrect ? 1 : 0),
                    total: prev.total + 1
                  }));
                  
                  // Esperar un momento para mostrar feedback y avanzar
                  setTimeout(() => {
                    setAnswerFeedback({ show: false, isCorrect: null });
                    handleNextPracticeQuestion();
                  }, 1200);
                } catch (error) {
                  console.error('Error al confirmar respuesta:', error);
                }
              }}
              disabled={loadingNext}
            >
              {loadingNext ? '⏳ Cargando...' : '✓ Confirmar y Continuar'}
            </button>
          )}
        </div>

        {/* Navigation */}
        {!isPracticeMode && (
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
        )}
        
        {isPracticeMode && (
          <div className="practice-info">
            <p>⚡ Respuesta única: Avanza automáticamente al seleccionar</p>
            <p>✓ Respuesta múltiple: Selecciona tus opciones y presiona "Confirmar"</p>
            <p>⏱️ Si se acaba el tiempo, pasarás a la siguiente pregunta automáticamente</p>
          </div>
        )}
      </div>

      {/* Feedback visual para modo práctica */}
      {answerFeedback.show && (
        <div className={`answer-feedback ${answerFeedback.isCorrect ? 'correct' : 'incorrect'}`}>
          <div className="feedback-content">
            {answerFeedback.isCorrect ? (
              <>
                <FaCheckCircle className="feedback-icon" />
                <span className="feedback-text">¡Correcto!</span>
              </>
            ) : (
              <>
                <FaTimesCircle className="feedback-icon" />
                <span className="feedback-text">Incorrecto</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default Quiz;
