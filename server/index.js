import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

// Importar rutas
import authRoutes from './routes/auth.js';
import questionRoutes from './routes/questions.js';
import quizRoutes from './routes/quiz.js';
import statsRoutes from './routes/stats.js';
import adminRoutes from './routes/admin.js';

// Importar utilidades
import { verifyAndRestoreDatabase } from './utils/dbManager.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Función para obtener la IP local
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (aplicaciones móviles, postman, etc)
    if (!origin) return callback(null, true);
    
    // Permitir localhost y IPs de red local
    const allowedOrigins = [
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:3001$/,
      /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:3001$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:3001$/
    ];
    
    const isAllowed = allowedOrigins.some(pattern => {
      if (pattern instanceof RegExp) {
        return pattern.test(origin);
      }
      return pattern === origin;
    });
    
    if (isAllowed || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware de logging básico de peticiones
app.use((req, res, next) => {
  const now = new Date().toISOString();
  console.log(`[${now}] ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos (imágenes de preguntas)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de health check — debe ir antes del wildcard del frontend
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Servir el frontend en producción
if (process.env.NODE_ENV === 'production') {
  const buildPath      = path.join(__dirname, '../client/build');
  const buildIndexPath = path.join(buildPath, 'index.html');

  // Verificar en el arranque si el build existe
  import('fs').then(({ existsSync }) => {
    if (!existsSync(buildIndexPath)) {
      console.error('⚠️  ADVERTENCIA: client/build no encontrado. Asegúrate de que el Build Command incluye "cd client && npm install && npm run build".');
    } else {
      console.log('✅ Frontend build encontrado:', buildPath);
    }
  });

  app.use(express.static(buildPath));

  app.get('*', (req, res) => {
    res.sendFile(buildIndexPath, (err) => {
      if (err) {
        res.status(503).send('Frontend no disponible. El servidor está activo pero el build del cliente no se generó durante el deploy.');
      }
    });
  });
}

// Middleware global de manejo de errores para loguear problemas (incluyendo CORS)
app.use((err, req, res, next) => {
  console.error('❌ Error en la petición:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    origin: req.headers.origin || 'N/A'
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Verificar e inicializar base de datos antes de iniciar el servidor
async function startServer() {
  try {
    // Verificar y restaurar BD si es necesario
    await verifyAndRestoreDatabase();

    // Iniciar servidor en todas las interfaces (0.0.0.0)
    app.listen(PORT, '0.0.0.0', () => {
      const localIp = getLocalIpAddress();
      console.log('\n🚀 ===== SERVIDOR INICIADO =====');
      console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`\n🌐 Acceso disponible en:`);
      console.log(`   → Local:    http://localhost:${PORT}`);
      console.log(`   → Red:      http://${localIp}:${PORT}`);
      console.log(`   → API:      http://${localIp}:${PORT}/api`);
      console.log('\n💡 Para acceder desde otros dispositivos en la red, usa la IP de red');
      console.log('================================\n');
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
