import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEdit, FaTrash, FaPlus, FaImage, FaSave, FaTimes, FaExclamationTriangle, FaCheckCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './Admin.css';

const Admin = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [stats, setStats] = useState(null);
  const [showImportForm, setShowImportForm] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [questionsMap, setQuestionsMap] = useState(null);
  const [expandedQuestions, setExpandedQuestions] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [questionsPerPage] = useState(10);
  const [showBackupSection, setShowBackupSection] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [quickUploadModal, setQuickUploadModal] = useState({ show: false, questionId: null, questionNumber: null });
  const [quickUploadingImage, setQuickUploadingImage] = useState(false);
  const [previewModal, setPreviewModal] = useState({ show: false, question: null });

  const [formData, setFormData] = useState({
    question_number: '',
    category_id: 1,
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_answer: ['A'], // Array para múltiples respuestas
    explanation: '',
    image_url: '',
    difficulty: 1,
    needs_image: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [questionsRes, categoriesRes, statsRes] = await Promise.all([
        axios.get('/admin/questions'),
        axios.get('/admin/categories'),
        axios.get('/admin/stats')
      ]);
      
      setQuestions(questionsRes.data);
      setCategories(categoriesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (error.response?.status === 403) {
        alert('No tienes permisos de administrador');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadQuestionsMap = async () => {
    try {
      const [mapRes, questionsRes] = await Promise.all([
        axios.get('/admin/questions-map'),
        axios.get('/admin/questions')
      ]);
      setQuestionsMap(mapRes.data);
      setQuestions(questionsRes.data);
    } catch (error) {
      console.error('Error al cargar mapa de preguntas:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleCorrectAnswerChange = (option) => {
    setFormData(prev => {
      const currentAnswers = Array.isArray(prev.correct_answer) 
        ? prev.correct_answer 
        : [prev.correct_answer];
      
      let newAnswers;
      if (currentAnswers.includes(option)) {
        // Remover la opción
        newAnswers = currentAnswers.filter(a => a !== option);
        // Asegurar al menos una respuesta correcta
        if (newAnswers.length === 0) {
          return prev;
        }
      } else {
        // Agregar la opción
        newAnswers = [...currentAnswers, option].sort();
      }
      
      return {
        ...prev,
        correct_answer: newAnswers
      };
    });
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    const formDataImage = new FormData();
    formDataImage.append('image', file);
    
    // Agregar el ID de la pregunta si existe para nombrar el archivo correctamente
    if (editingQuestion?.id) {
      formDataImage.append('questionId', editingQuestion.id);
    }

    try {
      setUploadingImage(true);
      const response = await axios.post('/admin/upload-image', formDataImage, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setFormData(prev => ({
        ...prev,
        image_url: response.data.imageUrl
      }));

      alert('Imagen subida correctamente');
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('Error al subir imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      await handleImageUpload(file);
    }
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          await handleImageUpload(blob);
        }
        break;
      }
    }
  };

  const handleQuickPaste = async (e, questionId) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = items[i].getAsFile();
        if (blob) {
          await handleQuickImageUpload(blob, questionId);
        }
        break;
      }
    }
  };

  const handleQuickImageUpload = async (file, questionId) => {
    setQuickUploadingImage(true);
    try {
      const formDataImage = new FormData();
      formDataImage.append('image', file);
      formDataImage.append('questionId', questionId);
      
      const uploadRes = await axios.post('/admin/upload-image', formDataImage, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const fullQuestion = questions.find(fq => fq.id === questionId);
      await axios.put(`/admin/questions/${questionId}`, {
        ...fullQuestion,
        image_url: uploadRes.data.imageUrl
      });
      
      alert('✅ Imagen agregada exitosamente');
      setQuickUploadModal({ show: false, questionId: null, questionNumber: null });
      loadQuestionsMap();
      loadData();
    } catch (error) {
      console.error('Error al subir imagen:', error);
      alert('❌ Error al subir imagen');
    } finally {
      setQuickUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Preparar datos: convertir array de respuestas a string
      const dataToSend = {
        ...formData,
        correct_answer: Array.isArray(formData.correct_answer)
          ? formData.correct_answer.join(',')
          : formData.correct_answer
      };

      if (editingQuestion) {
        // Actualizar pregunta existente
        await axios.put(`/admin/questions/${editingQuestion.id}`, dataToSend);
        alert('Pregunta actualizada correctamente');
      } else {
        // Crear nueva pregunta
        await axios.post('/admin/questions', dataToSend);
        alert('Pregunta creada correctamente');
      }

      // Resetear formulario
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error al guardar pregunta:', error);
      alert('Error al guardar pregunta');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    // Convertir correct_answer a array si es string
    const correctAnswerArray = typeof question.correct_answer === 'string'
      ? question.correct_answer.split(',').map(a => a.trim())
      : question.correct_answer;
    
    setFormData({
      question_number: question.question_number || '',
      category_id: question.category_id,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d || '',
      correct_answer: correctAnswerArray,
      explanation: question.explanation || '',
      image_url: question.image_url || '',
      difficulty: question.difficulty,
      needs_image: question.needs_image || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta pregunta?')) {
      return;
    }

    try {
      await axios.delete(`/admin/questions/${id}`);
      alert('Pregunta eliminada correctamente');
      loadData();
    } catch (error) {
      console.error('Error al eliminar pregunta:', error);
      alert(error.response?.data?.error || 'Error al eliminar pregunta');
    }
  };

  const resetForm = () => {
    setFormData({
      question_number: '',
      category_id: 1,
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_answer: ['A'],
      explanation: '',
      image_url: '',
      difficulty: 1,
      needs_image: false
    });
    setEditingQuestion(null);
    setShowForm(false);
  };

  const toggleQuestionExpanded = (questionId) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  const getQuestionStatus = (question) => {
    const issues = [];
    
    if (question.needs_image && !question.image_url) {
      issues.push('missing_image');
    }
    
    if (!question.explanation || question.explanation.trim() === '') {
      issues.push('missing_explanation');
    }
    
    if (!question.question_number) {
      issues.push('missing_number');
    }
    
    return issues;
  };

  // Pagination
  const indexOfLastQuestion = currentPage * questionsPerPage;
  const indexOfFirstQuestion = indexOfLastQuestion - questionsPerPage;
  const currentQuestions = questions.slice(indexOfFirstQuestion, indexOfLastQuestion);
  const totalPages = Math.ceil(questions.length / questionsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    setExpandedQuestions(new Set()); // Colapsar todas al cambiar de página
  };

  const handleImportJson = async () => {
    try {
      setImporting(true);
      const questionsData = JSON.parse(jsonInput);
      
      const response = await axios.post('/admin/import-questions', {
        questions: Array.isArray(questionsData) ? questionsData : [questionsData]
      });

      // Mostrar resultado de la importación
      const importedCount = response.data.importedCount || 0;
      const skippedCount = response.data.skippedCount || 0;
      const errorCount = response.data.errors?.length || 0;
      
      let message = `✅ ${importedCount} pregunta(s) importada(s) exitosamente.`;
      if (skippedCount > 0) {
        message += `\n⚠️ ${skippedCount} pregunta(s) omitidas.`;
      }
      if (errorCount > 0) {
        message += `\n❌ ${errorCount} pregunta(s) con errores (ver consola).`;
        console.error('Errores en importación:', response.data.errors);
      }
      
      alert(message);

      // Limpiar solo el textarea pero mantener el formulario abierto
      setJsonInput('');
      
      // Recargar las preguntas para ver las nuevas
      loadData();
      
      // Hacer scroll al textarea para continuar importando
      document.querySelector('.json-input')?.focus();
    } catch (error) {
      console.error('Error al importar:', error);
      alert('❌ Error al importar preguntas. Verifica el formato JSON.\n\nRevisa la consola para más detalles.');
    } finally {
      setImporting(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      const response = await axios.get('/admin/export-questions');
      
      // Crear archivo JSON para descargar
      const dataStr = JSON.stringify(response.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `preguntas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert(`✅ Exportadas ${response.data.total_questions} preguntas correctamente.`);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('❌ Error al exportar preguntas.');
    }
  };

  const handleRestoreBackup = async () => {
    if (!backupJsonInput.trim()) {
      alert('⚠️ Por favor pega el JSON del backup antes de restaurar.');
      return;
    }

    if (confirmationText !== 'RESTAURAR') {
      alert('⚠️ Por favor escribe "RESTAURAR" para confirmar la operación.');
      return;
    }

    try {
      setImporting(true);
      const data = JSON.parse(backupJsonInput);
      
      const response = await axios.post('/admin/import-full', {
        questions: data.questions || (Array.isArray(data) ? data : [data]),
        categories: data.categories || null,
        replaceAll: true
      });

      const importedCount = response.data.importedCount || 0;
      const categoriesImported = response.data.categoriesImported || 0;
      const errorCount = response.data.errors?.length || 0;
      
      let message = `✅ Importación completa exitosa!\n\n`;
      message += `📝 ${importedCount} preguntas importadas\n`;
      if (categoriesImported > 0) {
        message += `📁 ${categoriesImported} categorías importadas\n`;
      }
      if (errorCount > 0) {
        message += `\n❌ ${errorCount} preguntas con errores (ver consola)`;
        console.error('Errores:', response.data.errors);
      }
      
      alert(message);

      setJsonInput('');
      setShowImportForm(false);
      loadData();
    } catch (error) {
      console.error('Error en importación completa:', error);
      alert('❌ Error en importación completa. Verifica el formato JSON.\n\nRevisa la consola para más detalles.');
    } finally {
      setImporting(false);
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
    <div className="admin-container">
      <div className="admin-header">
        <h1>⚙️ Panel de Administración</h1>
        <div className="admin-actions">
          <button
            className="btn btn-info btn-small"
            onClick={() => {
              setViewMode(viewMode === 'list' ? 'map' : 'list');
              if (viewMode === 'list') loadQuestionsMap();
            }}
          >
            {viewMode === 'list' ? '🗺️ Ver Mapa de Imágenes' : '📋 Ver Lista'}
          </button>
          <button
            className="btn btn-info btn-small"
            onClick={() => setShowBackupSection(!showBackupSection)}
            title="Backup y Restauración de la BD"
          >
            💾 Backup/Restore
          </button>
          <button
            className="btn btn-warning btn-small"
            onClick={() => setShowImportForm(!showImportForm)}
          >
            📥 Importar JSON
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <FaPlus /> {showForm ? 'Cancelar' : 'Nueva Pregunta'}
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <h3>{stats.overview.totalQuestions}</h3>
            <p>Preguntas</p>
          </div>
          <div className="stat-card">
            <h3>{stats.overview.totalCategories}</h3>
            <p>Categorías</p>
          </div>
          <div className="stat-card">
            <h3>{stats.overview.totalUsers}</h3>
            <p>Usuarios</p>
          </div>
          <div className="stat-card">
            <h3>{stats.overview.totalQuizzes}</h3>
            <p>Cuestionarios</p>
          </div>
        </div>
      )}

      {/* Sección de Backup y Restauración */}
      {showBackupSection && (
        <div className="backup-section">
          <div className="backup-container">
            <div className="backup-header">
              <h2>💾 Backup y Restauración de Base de Datos</h2>
              <button 
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setShowBackupSection(false);
                  setBackupJsonInput('');
                  setConfirmationText('');
                }}
              >
                ✕ Cerrar
              </button>
            </div>
            
            <div className="backup-grid">
              {/* Exportar Backup */}
              <div className="backup-box">
                <div className="backup-box-icon export">📤</div>
                <h3>Exportar Backup</h3>
                <p className="backup-description">
                  Descarga un archivo JSON con toda la base de datos: preguntas, categorías, respuestas correctas, explicaciones, etc.
                </p>
                <div className="backup-info">
                  <FaCheckCircle className="info-icon" />
                  <span>Respaldo completo y seguro</span>
                </div>
                <div className="backup-info">
                  <FaCheckCircle className="info-icon" />
                  <span>Incluye metadatos y timestamp</span>
                </div>
                <button
                  className="btn btn-success btn-large"
                  onClick={handleExportBackup}
                >
                  📥 Descargar Backup Completo
                </button>
              </div>

              {/* Restaurar Backup */}
              <div className="backup-box danger">
                <div className="backup-box-icon import">📥</div>
                <h3>Restaurar Backup</h3>
                <p className="backup-description">
                  <strong>⚠️ PELIGRO:</strong> Esta operación eliminará TODA la base de datos actual y la reemplazará con el backup.
                </p>
                <div className="backup-warning">
                  <FaExclamationTriangle className="warning-icon" />
                  <span>Esta acción NO se puede deshacer</span>
                </div>
                <div className="backup-warning">
                  <FaExclamationTriangle className="warning-icon" />
                  <span>Se perderán todas las preguntas actuales</span>
                </div>
                
                <textarea
                  value={backupJsonInput}
                  onChange={(e) => setBackupJsonInput(e.target.value)}
                  placeholder="Pega aquí el contenido del archivo de backup (JSON)..."
                  rows="8"
                  className="backup-textarea"
                />
                
                <div className="confirmation-box">
                  <label>Para confirmar, escribe <strong>RESTAURAR</strong>:</label>
                  <input
                    type="text"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder="Escribe: RESTAURAR"
                    className="confirmation-input"
                  />
                </div>
                
                <button
                  className="btn btn-danger btn-large"
                  onClick={handleRestoreBackup}
                  disabled={importing || !backupJsonInput.trim() || confirmationText !== 'RESTAURAR'}
                >
                  {importing ? '⏳ Restaurando...' : '🔄 Restaurar Base de Datos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulario de Importación JSON */}
      {showImportForm && (
        <div className="admin-form-container import-form">
          <h2>📥 Importar Preguntas desde JSON</h2>
          <p className="help-text">
            Pega un JSON con las preguntas. El formato debe incluir: question_number, question_text, option_a, option_b, option_c, correct_answer, needs_image (boolean).
            <br />
            <strong>Múltiples respuestas:</strong> Para preguntas con múltiples respuestas correctas, separa las opciones con comas (ej: "A,B" o "A,B,C").
          </p>
          <div className="json-example">
            <strong>Ejemplos:</strong>
            <pre>{`[
  {
    "question_number": 1,
    "question_text": "¿Pregunta simple?",
    "option_a": "Opción A",
    "option_b": "Opción B",
    "option_c": "Opción C",
    "correct_answer": "A",
    "explanation": "Explicación opcional",
    "category_id": 1,
    "difficulty": 1,
    "needs_image": false
  },
  {
    "question_number": 2,
    "question_text": "¿Pregunta múltiple?",
    "option_a": "Opción A correcta",
    "option_b": "Opción B correcta",
    "option_c": "Opción C incorrecta",
    "correct_answer": "A,B",
    "explanation": "A y B son correctas",
    "category_id": 1,
    "difficulty": 2,
    "needs_image": false
  }
]`}</pre>
          </div>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Pega aquí tu JSON..."
            rows="15"
            className="json-input"
          />
          <div className="import-status-info">
            💡 <strong>Tip:</strong> Esta función agrega o actualiza preguntas sin borrar las existentes. El formulario permanecerá abierto para pegar más preguntas.
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-success"
              onClick={handleImportJson}
              disabled={importing || !jsonInput.trim()}
            >
              {importing ? '⏳ Importando...' : '✓ Importar Preguntas'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={handleExportBackup}
              title="Descargar todas las preguntas en formato JSON"
            >
              📤 Exportar JSON
            </button>
            <button
              type="button"
              className="btn btn-info btn-small"
              onClick={() => setJsonInput('')}
              disabled={!jsonInput.trim()}
            >
              🗑️ Limpiar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowImportForm(false);
                setJsonInput('');
              }}
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Mapa de Preguntas */}
      {viewMode === 'map' && questionsMap && (
        <div className="questions-map-container">
          <h2>🗺️ Mapa de Preguntas e Imágenes</h2>
          <div className="map-stats">
            <div className="map-stat complete">
              <span className="count">{questionsMap.stats.withImages}</span>
              <span className="label">Con imagen</span>
            </div>
            <div className="map-stat missing">
              <span className="count">{questionsMap.stats.needingImages}</span>
              <span className="label">Falta imagen</span>
            </div>
            <div className="map-stat not-required">
              <span className="count">{questionsMap.stats.notRequired}</span>
              <span className="label">No requiere</span>
            </div>
            <div className="map-stat total">
              <span className="count">{questionsMap.stats.total}</span>
              <span className="label">Total</span>
            </div>
          </div>
          <div className="questions-grid">
            {questionsMap.questions.map(q => {
              const fullQuestion = questions.find(fq => fq.id === q.id);
              const optionsCount = fullQuestion ? ['option_a', 'option_b', 'option_c', 'option_d'].filter(key => fullQuestion[key]).length : 0;
              const correctAnswers = fullQuestion ? (Array.isArray(fullQuestion.correct_answer) ? fullQuestion.correct_answer : fullQuestion.correct_answer.split(',')).length : 0;
              
              return (
                <div
                  key={q.id}
                  className={`question-grid-item status-${q.image_status}`}
                >
                  <div className="grid-item-header">
                    <div className="grid-item-number">
                      <span className="number-badge">#{q.question_number || q.id}</span>
                    </div>
                    <div className="grid-item-status">
                      {q.image_status === 'complete' && <span className="status-badge complete">✓</span>}
                      {q.image_status === 'missing' && <span className="status-badge missing">!</span>}
                      {q.image_status === 'not_required' && <span className="status-badge not-required">○</span>}
                    </div>
                  </div>
                  
                  <div className="grid-item-preview">
                    <p className="question-preview-text">{q.question_text.substring(0, 60)}{q.question_text.length > 60 ? '...' : ''}</p>
                  </div>
                  
                  <div className="grid-item-info">
                    <div className="info-badge">
                      <span className="info-icon">🔤</span>
                      <span className="info-text">{optionsCount} opciones</span>
                    </div>
                    <div className="info-badge success">
                      <span className="info-icon">✓</span>
                      <span className="info-text">{correctAnswers} correcta{correctAnswers !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  
                  <div className="grid-item-actions">
                  <button
                    className="btn-icon btn-view"
                    onClick={() => {
                      const fullQuestion = questions.find(fq => fq.id === q.id);
                      if (fullQuestion) {
                        setPreviewModal({ show: true, question: fullQuestion });
                      }
                    }}
                    title="Ver pregunta"
                  >
                    👁️
                  </button>
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => {
                      const fullQuestion = questions.find(fq => fq.id === q.id);
                      if (fullQuestion) {
                        handleEdit(fullQuestion);
                        setViewMode('list');
                        setShowForm(true);
                      }
                    }}
                    title="Editar pregunta"
                  >
                    ✏️
                  </button>
                  {q.image_status === 'missing' && (
                    <button
                      className="btn-icon btn-upload"
                      title="Subir imagen (Ctrl+V para pegar)"
                      onClick={() => setQuickUploadModal({ show: true, questionId: q.id, questionNumber: q.question_number || q.id })}
                    >
                      📤
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
          <div className="map-legend">
            <div className="legend-item">
              <span className="legend-icon complete">✓</span>
              <span>Con imagen</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon missing">!</span>
              <span>Falta imagen (needs_image=true)</span>
            </div>
            <div className="legend-item">
              <span className="legend-icon not-required">○</span>
              <span>No requiere imagen</span>
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && viewMode === 'list' && (
        <div className="admin-form-container">
          <h2>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</h2>
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-row">
              <div className="form-group">
                <label>Número de Pregunta</label>
                <input
                  type="number"
                  name="question_number"
                  value={formData.question_number}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="Número opcional"
                />
              </div>

              <div className="form-group">
                <label>Categoría *</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Dificultad *</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                >
                  <option value="1">Fácil</option>
                  <option value="2">Media</option>
                  <option value="3">Difícil</option>
                </select>
              </div>

              <div className="form-group">
                <label>Respuesta(s) Correcta(s) * <span className="help-inline">(Puedes seleccionar múltiples)</span></label>
                <div className="checkbox-group">
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.correct_answer.includes('A')}
                      onChange={() => handleCorrectAnswerChange('A')}
                    />
                    <span className="checkbox-label-text">Opción A</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.correct_answer.includes('B')}
                      onChange={() => handleCorrectAnswerChange('B')}
                    />
                    <span className="checkbox-label-text">Opción B</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.correct_answer.includes('C')}
                      onChange={() => handleCorrectAnswerChange('C')}
                    />
                    <span className="checkbox-label-text">Opción C</span>
                  </label>
                  <label className="checkbox-option">
                    <input
                      type="checkbox"
                      checked={formData.correct_answer.includes('D')}
                      onChange={() => handleCorrectAnswerChange('D')}
                    />
                    <span className="checkbox-label-text">Opción D</span>
                  </label>
                </div>
                {formData.correct_answer.length > 1 && (
                  <div className="multi-answer-note">
                    ℹ️ Esta pregunta tiene múltiples respuestas correctas: {formData.correct_answer.join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Pregunta *</label>
              <textarea
                name="question_text"
                value={formData.question_text}
                onChange={handleInputChange}
                required
                className="form-control"
                rows="3"
                placeholder="Escribe la pregunta aquí..."
              />
            </div>

            <div className="form-group">
              <label>Opción A *</label>
              <input
                type="text"
                name="option_a"
                value={formData.option_a}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="Primera opción"
              />
            </div>

            <div className="form-group">
              <label>Opción B *</label>
              <input
                type="text"
                name="option_b"
                value={formData.option_b}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="Segunda opción"
              />
            </div>

            <div className="form-group">
              <label>Opción C *</label>
              <input
                type="text"
                name="option_c"
                value={formData.option_c}
                onChange={handleInputChange}
                required
                className="form-control"
                placeholder="Tercera opción"
              />
            </div>

            <div className="form-group">
              <label>Opción D <span className="optional-label">(opcional)</span></label>
              <input
                type="text"
                name="option_d"
                value={formData.option_d}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Cuarta opción (opcional)"
              />
            </div>

            <div className="form-group">
              <label>Explicación</label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleInputChange}
                className="form-control"
                rows="2"
                placeholder="Explicación de la respuesta correcta (opcional)"
              />
            </div>

            <div className="form-group">
              <label><FaImage /> Imagen (opcional)</label>
              <div className="image-upload">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="needs_image"
                    checked={formData.needs_image}
                    onChange={handleCheckboxChange}
                  />
                  Esta pregunta necesita imagen (marcar para recordatorio)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  disabled={uploadingImage}
                  className="file-input"
                />
                
                {/* Área para pegar imágenes */}
                <div 
                  className="paste-area"
                  onPaste={handlePaste}
                  tabIndex={0}
                >
                  📋 O pega una imagen aquí (Ctrl+V)
                </div>
                
                {uploadingImage && <span className="uploading">Subiendo...</span>}
                {formData.image_url && (
                  <div className="image-preview">
                    <img src={formData.image_url} alt="Preview" />
                    <div className="image-actions">
                      <label className="btn btn-primary btn-small">
                        ✏️ Cambiar
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          style={{ display: 'none' }}
                        />
                      </label>
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      >
                        <FaTimes /> Quitar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                <FaSave /> {editingQuestion ? 'Actualizar' : 'Crear'} Pregunta
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                <FaTimes /> Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Preguntas */}
      {viewMode === 'list' && (
        <div className="questions-section">
          <div className="questions-section-header">
            <h2>Preguntas ({questions.length})</h2>
            <div className="questions-info">
              Mostrando {indexOfFirstQuestion + 1} - {Math.min(indexOfLastQuestion, questions.length)} de {questions.length}
            </div>
          </div>

          <div className="questions-list">
            {currentQuestions.map(question => {
              const isExpanded = expandedQuestions.has(question.id);
              const issues = getQuestionStatus(question);
              const hasIssues = issues.length > 0;

              return (
                <div key={question.id} className={`question-card ${hasIssues ? 'has-issues' : ''}`}>
                  <div className="question-card-header">
                    <div className="question-header-left">
                      <span className="question-id">#{question.id}</span>
                      {question.question_number && (
                        <span className="question-number">P{question.question_number}</span>
                      )}
                      <span className="question-category">{question.category_name}</span>
                      <span className={`question-difficulty diff-${question.difficulty}`}>
                        {question.difficulty === 1 ? 'Fácil' : question.difficulty === 2 ? 'Media' : 'Difícil'}
                      </span>
                    </div>

                    <div className="question-header-right">
                      {/* Status Icons */}
                      <div className="question-status-icons">
                        {issues.includes('missing_image') && (
                          <span className="status-icon missing-image" title="Falta imagen">
                            <FaImage />
                          </span>
                        )}
                        {issues.includes('missing_explanation') && (
                          <span className="status-icon missing-explanation" title="Falta explicación">
                            <FaExclamationTriangle />
                          </span>
                        )}
                        {issues.includes('missing_number') && (
                          <span className="status-icon missing-number" title="Falta número de pregunta">
                            #?
                          </span>
                        )}
                        {!hasIssues && (
                          <span className="status-icon complete" title="Pregunta completa">
                            <FaCheckCircle />
                          </span>
                        )}
                      </div>

                      <button
                        className="btn-expand"
                        onClick={() => toggleQuestionExpanded(question.id)}
                        title={isExpanded ? 'Colapsar' : 'Expandir'}
                      >
                        {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                      </button>
                    </div>
                  </div>

                  <div className="question-preview">
                    <p className="question-text-preview">
                      {question.question_text.length > 100 && !isExpanded
                        ? question.question_text.substring(0, 100) + '...'
                        : question.question_text}
                    </p>
                  </div>

                  {isExpanded && (
                    <div className="question-card-body">
                      {question.image_url && (
                        <div className="question-image-small">
                          <img src={question.image_url} alt="Imagen" />
                        </div>
                      )}

                      <div className="question-options">
                        {(() => {
                          const correctAnswers = typeof question.correct_answer === 'string'
                            ? question.correct_answer.split(',').map(a => a.trim())
                            : [question.correct_answer];
                          
                          return (
                            <>
                              <div className={`option ${correctAnswers.includes('A') ? 'correct' : ''}`}>
                                <strong>A:</strong> {question.option_a}
                                {correctAnswers.includes('A') && correctAnswers.length > 1 && <span className="multi-badge">✓</span>}
                              </div>
                              <div className={`option ${correctAnswers.includes('B') ? 'correct' : ''}`}>
                                <strong>B:</strong> {question.option_b}
                                {correctAnswers.includes('B') && correctAnswers.length > 1 && <span className="multi-badge">✓</span>}
                              </div>
                              <div className={`option ${correctAnswers.includes('C') ? 'correct' : ''}`}>
                                <strong>C:</strong> {question.option_c}
                                {correctAnswers.includes('C') && correctAnswers.length > 1 && <span className="multi-badge">✓</span>}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                      
                      {(() => {
                        const correctAnswers = typeof question.correct_answer === 'string'
                          ? question.correct_answer.split(',').map(a => a.trim())
                          : [question.correct_answer];
                        return correctAnswers.length > 1 && (
                          <div className="multi-answer-indicator">
                            ℹ️ Esta pregunta tiene {correctAnswers.length} respuestas correctas
                          </div>
                        );
                      })()}

                      {question.explanation && (
                        <div className="question-explanation">
                          <strong>Explicación:</strong> {question.explanation}
                        </div>
                      )}

                      <div className="question-card-actions">
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => handleEdit(question)}
                        >
                          <FaEdit /> Editar
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDelete(question.id)}
                        >
                          <FaTrash /> Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              
              <div className="pagination-numbers">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Mostrar solo páginas cercanas a la actual
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        className={`pagination-number ${currentPage === pageNumber ? 'active' : ''}`}
                        onClick={() => paginate(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return <span key={pageNumber} className="pagination-ellipsis">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                className="pagination-btn"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de Upload Rápido */}
      {quickUploadModal.show && (
        <div className="modal-overlay" onClick={() => setQuickUploadModal({ show: false, questionId: null, questionNumber: null })}>
          <div className="modal-content quick-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Subir Imagen - Pregunta #{quickUploadModal.questionNumber}</h3>
              <button 
                className="btn-close"
                onClick={() => setQuickUploadModal({ show: false, questionId: null, questionNumber: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div 
                className="quick-paste-area"
                onPaste={(e) => handleQuickPaste(e, quickUploadModal.questionId)}
                tabIndex={0}
                autoFocus
              >
                <div className="paste-icon">📋</div>
                <p className="paste-instructions">
                  <strong>Presiona Ctrl+V para pegar una imagen</strong>
                </p>
                <p className="paste-hint">O arrastra una imagen aquí</p>
              </div>
              
              <div className="upload-divider">
                <span>o</span>
              </div>
              
              <label className="btn btn-primary btn-block">
                📁 Seleccionar archivo
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleQuickImageUpload(file, quickUploadModal.questionId);
                    }
                  }}
                />
              </label>
              
              {quickUploadingImage && (
                <div className="uploading-indicator">
                  <div className="spinner"></div>
                  <span>Subiendo imagen...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {previewModal.show && previewModal.question && (
        <div className="modal-overlay" onClick={() => setPreviewModal({ show: false, question: null })}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👁️ Vista Previa - Pregunta #{previewModal.question.question_number || previewModal.question.id}</h3>
              <button 
                className="btn-close"
                onClick={() => setPreviewModal({ show: false, question: null })}
              >
                ✕
              </button>
            </div>
            <div className="modal-body preview-body">
              {/* Número y Categoría */}
              <div className="preview-header">
                <div className="preview-number">
                  <span className="label">Número</span>
                  <span className="value">#{previewModal.question.question_number || previewModal.question.id}</span>
                </div>
                <div className="preview-category">
                  <span className="label">Categoría</span>
                  <span className="value">{categories.find(c => c.id === previewModal.question.category_id)?.name || 'Sin categoría'}</span>
                </div>
              </div>

              {/* Pregunta */}
              <div className="preview-question">
                <h4>Pregunta:</h4>
                <p>{previewModal.question.question_text}</p>
              </div>

              {/* Imagen */}
              {previewModal.question.image_url && (
                <div className="preview-image">
                  <h4>Imagen:</h4>
                  <img src={previewModal.question.image_url} alt="Imagen de la pregunta" />
                </div>
              )}

              {/* Alternativas */}
              <div className="preview-options">
                <h4>Alternativas:</h4>
                {(() => {
                  const correctAnswers = Array.isArray(previewModal.question.correct_answer) 
                    ? previewModal.question.correct_answer 
                    : previewModal.question.correct_answer.split(',');
                  
                  return ['A', 'B', 'C', 'D'].map(option => {
                    const optionKey = `option_${option.toLowerCase()}`;
                    const optionText = previewModal.question[optionKey];
                    const isCorrect = correctAnswers.includes(option);
                    
                    return optionText ? (
                      <div key={option} className={`preview-option ${isCorrect ? 'correct' : ''}`}>
                        <div className="option-label">
                          <span className="option-letter">{option}</span>
                          {isCorrect && <span className="correct-badge">✓ Correcta</span>}
                        </div>
                        <div className="option-text">{optionText}</div>
                      </div>
                    ) : null;
                  });
                })()}
              </div>

              {/* Explicación */}
              {previewModal.question.explanation && (
                <div className="preview-explanation">
                  <h4>💡 Explicación:</h4>
                  <p>{previewModal.question.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
