import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Context
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Stats from './pages/Stats';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

// Configurar axios para usar la URL base dinámica
let API_URL = process.env.REACT_APP_API_URL || '/api';

// Normalizar la URL de API en el navegador
if (typeof window !== 'undefined') {
  const hostname = window.location.hostname;

  try {
    if (!API_URL) {
      API_URL = '/api';
    } else if (API_URL.startsWith('http')) {
      const parsed = new URL(API_URL);

      // Si el host de la API no coincide con el host que sirve el front,
      // usamos ruta relativa para evitar problemas cuando accedemos por IP/hostname.
      if (parsed.hostname !== hostname) {
        API_URL = '/api';
      }
    }
  } catch (e) {
    // Si hay cualquier problema parseando la URL, usar ruta relativa segura
    API_URL = '/api';
  }
}

axios.defaults.baseURL = API_URL;

// Configurar axios para NO cachear peticiones
axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';

// Log para debugging
console.log('API URL configurada:', API_URL);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <PrivateRoute>
                  <Quiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/results/:quizId"
              element={
                <PrivateRoute>
                  <Results />
                </PrivateRoute>
              }
            />
            <Route
              path="/stats"
              element={
                <PrivateRoute>
                  <Stats />
                </PrivateRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <PrivateRoute>
                  <Admin />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
