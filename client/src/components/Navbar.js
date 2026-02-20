import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaChartBar, FaSignOutAlt, FaCog, FaHome, FaCar } from 'react-icons/fa';
import './Navbar.css';

const Navbar = ({ quizMode = null }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = Boolean(user?.is_admin);
  const isQuizPage = location.pathname === '/quiz';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <nav className={`navbar ${isQuizPage ? 'quiz-mode' : ''}`}>
      <div className="navbar-container">
        {!isQuizPage ? (
          // Navbar normal
          <>
            <Link to="/dashboard" className="navbar-brand">
              <FaCar className="brand-icon" />
              <span className="brand-text">DriverTest</span>
              <span className="brand-version">v0.4.2</span>
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
                <Link to="/profile" className="navbar-link" title="Perfil" aria-label="Perfil">
                  <FaUser />
                  <span className="nav-text">Perfil</span>
                </Link>
                <button onClick={handleLogout} className="btn-logout" title="Salir" aria-label="Salir">
                  <FaSignOutAlt />
                  <span className="nav-text">Salir</span>
                </button>
              </div>
            </div>
          </>
        ) : (
          // Navbar modo quiz - espacio para que Quiz.js inyecte los controles
          <div id="quiz-navbar-controls" className="quiz-navbar-controls">
            {/* Los controles del quiz se renderizarán aquí desde Quiz.js */}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
