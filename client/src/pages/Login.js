import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaLock } from 'react-icons/fa';
import './Auth.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetData, setResetData] = useState({ username: '', newPassword: '', confirmPassword: '' });
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });
  const [resetLoading, setResetLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMessage({ type: '', text: '' });
    setResetLoading(true);
    try {
      const response = await axios.post('/auth/reset-password', resetData);
      setResetMessage({ type: 'success', text: response.data.message });
      setResetData({ username: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.error || 'Error al resetear la contraseña' });
    } finally {
      setResetLoading(false);
    }
  };

  const closeReset = () => {
    setShowReset(false);
    setResetMessage({ type: '', text: '' });
    setResetData({ username: '', newPassword: '', confirmPassword: '' });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🚗 Test de Conducción</h1>
          <p>Inicia sesión para comenzar</p>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Usuario</label>
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
          </p>
          <p>
            <button
              type="button"
              className="btn-link"
              onClick={() => { setShowReset(true); setResetMessage({ type: '', text: '' }); }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>
          <p className="demo-info">
            <strong>Usuario demo:</strong> demo / password123
          </p>
        </div>
      </div>

      {/* Modal restablecer contraseña */}
      {showReset && (
        <div className="reset-modal-overlay" onClick={closeReset}>
          <div className="reset-modal-card" onClick={e => e.stopPropagation()}>
            <div className="reset-modal-header">
              <div className="reset-modal-icon">🔑</div>
              <h2>Restablecer Contraseña</h2>
              <p>Ingresa tu usuario y la nueva contraseña</p>
            </div>

            {resetMessage.text && (
              <div className={`alert alert-${resetMessage.type}`}>
                {resetMessage.text}
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="auth-form">
              <div className="form-group">
                <label>Usuario</label>
                <div className="input-group">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={resetData.username}
                    onChange={handleResetChange}
                    placeholder="Nombre de usuario"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    className="form-control"
                    name="newPassword"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Confirmar Nueva Contraseña</label>
                <div className="input-group">
                  <FaLock className="input-icon" />
                  <input
                    type="password"
                    className="form-control"
                    name="confirmPassword"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                {resetLoading ? 'Guardando...' : 'Restablecer Contraseña'}
              </button>
            </form>

            <div className="reset-modal-footer">
              <button type="button" className="btn-link" onClick={closeReset}>
                ← Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
