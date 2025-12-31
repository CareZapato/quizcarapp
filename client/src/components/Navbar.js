import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaChartBar, FaSignOutAlt, FaCog } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // El campo is_admin viene en el objeto user después del login
    if (user && user.is_admin) {
      setIsAdmin(true);
    }
  }, [user]);

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
            <Link to="/admin" className="navbar-link admin-link">
              <FaCog /> Admin
            </Link>
          )}
          
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            Inicio
          </Link>
          <Link to="/stats" className="navbar-link">
            <FaChartBar /> Estadísticas
          </Link>
          <div className="navbar-user">
            <FaUser />
            <span>{user.username}</span>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            <FaSignOutAlt /> Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
