import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaChartBar, FaSignOutAlt, FaCog, FaHome } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isAdmin = Boolean(user?.is_admin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          🚗 Test de Conducción
        </Link>
        {isAdmin && (
          <Link to="/admin" className="navbar-link admin-link" title="Administración" aria-label="Administración">
            <FaCog />
            <span className="nav-text">Admin</span>
          </Link>
        )}
          
        <div className="navbar-menu">
          <div className="navbar-menu-left">
            <Link to="/dashboard" className="navbar-link" title="Inicio" aria-label="Inicio">
              <FaHome />
              <span className="nav-text">Inicio</span>
            </Link>
            <Link to="/stats" className="navbar-link" title="Estadísticas" aria-label="Estadísticas">
              <FaChartBar />
              <span className="nav-text">Estadísticas</span>
            </Link>
          </div>

          <div className="navbar-menu-right">
            <div className="navbar-user" title={user.username} aria-label={`Usuario: ${user.username}`}>
              <FaUser />
              <span className="nav-text">{user.username}</span>
            </div>
            <button onClick={handleLogout} className="btn-logout" title="Salir" aria-label="Salir">
              <FaSignOutAlt />
              <span className="nav-text">Salir</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
