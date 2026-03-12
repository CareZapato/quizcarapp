import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaSave, FaArrowLeft, FaEnvelope, FaCalendar, FaKey } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [resetData, setResetData] = useState({ newPassword: '', confirmPassword: '' });
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validaciones
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        username: formData.username,
        email: formData.email
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await axios.put('/auth/profile', updateData);
      
      // Actualizar el contexto con los nuevos datos
      if (response.data.user) {
        updateUser(response.data.user);
      }

      setMessage({ type: 'success', text: 'Perfil actualizado exitosamente' });
      setEditing(false);
      
      // Limpiar campos de contraseña
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al actualizar el perfil' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleResetChange = (e) => {
    setResetData({ ...resetData, [e.target.name]: e.target.value });
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetMessage({ type: '', text: '' });
    setResetLoading(true);
    try {
      const response = await axios.post('/auth/reset-password', {
        username: user?.username,
        newPassword: resetData.newPassword,
        confirmPassword: resetData.confirmPassword
      });
      setResetMessage({ type: 'success', text: response.data.message });
      setResetData({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setResetMessage({ type: 'error', text: err.response?.data?.error || 'Error al restablecer la contraseña' });
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="container profile-page">
      <div className="profile-header">
        <button onClick={() => navigate('/dashboard')} className="btn btn-back">
          <FaArrowLeft /> Volver
        </button>
        <h1>Mi Perfil</h1>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-avatar">
            <FaUser />
          </div>
          
          <div className="profile-info-summary">
            <h2>{user?.username}</h2>
            <p className="profile-email">{user?.email || 'sin email'}</p>
            {user?.is_admin && (
              <span className="badge badge-admin">Administrador</span>
            )}
          </div>

          <div className="profile-meta">
            <div className="meta-item">
              <FaCalendar />
              <span>Miembro desde: {formatDate(user?.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="profile-form-card">
          <div className="form-card-header">
            <h3>Información Personal</h3>
            {!editing && (
              <button 
                onClick={() => setEditing(true)} 
                className="btn btn-primary btn-small"
              >
                Editar Perfil
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="username">
                <FaUser /> Nombre de Usuario
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editing}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <FaEnvelope /> Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!editing}
                placeholder="correo@ejemplo.com"
              />
            </div>

            {editing && (
              <>
                <div className="form-divider">
                  <span>Cambiar Contraseña (opcional)</span>
                </div>

                <div className="form-group">
                  <label htmlFor="currentPassword">
                    <FaLock /> Contraseña Actual
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Requerida si cambias la contraseña"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    <FaLock /> Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    <FaLock /> Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite la nueva contraseña"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        username: user?.username || '',
                        email: user?.email || '',
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                      setMessage({ type: '', text: '' });
                    }}
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success"
                    disabled={loading}
                  >
                    <FaSave /> {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>

      <div className="profile-container">
        <div className="profile-form-card" style={{ gridColumn: '1 / -1' }}>
          <div className="form-card-header">
            <h3><FaKey /> Restablecer Contraseña</h3>
          </div>

          {resetMessage.text && (
            <div className={`alert alert-${resetMessage.type}`}>
              {resetMessage.text}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="resetNewPassword">
                <FaLock /> Nueva Contraseña
              </label>
              <input
                type="password"
                id="resetNewPassword"
                name="newPassword"
                value={resetData.newPassword}
                onChange={handleResetChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resetConfirmPassword">
                <FaLock /> Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                id="resetConfirmPassword"
                name="confirmPassword"
                value={resetData.confirmPassword}
                onChange={handleResetChange}
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={resetLoading}>
                <FaKey /> {resetLoading ? 'Guardando...' : 'Restablecer Contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
