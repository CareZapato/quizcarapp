# 🚗 Test de Conducción Web - Inicio Rápido

## ⚡ Instalación y Configuración (5 minutos)

### Paso 1: Instalar Dependencias

```bash
# Instalar dependencias del backend y frontend
npm run install-all
```

### Paso 2: Inicializar Base de Datos

```bash
# Crear las tablas e insertar datos de ejemplo
npm run init-db
```

Esto creará:
- ✅ Base de datos SQLite
- ✅ Tablas necesarias
- ✅ 10 preguntas de ejemplo
- ✅ Usuario demo (username: **demo**, password: **password123**)

### Paso 3: Iniciar la Aplicación

**Opción A - Desarrollo (2 terminales):**

```bash
# Terminal 1 - Backend (puerto 3000)
npm run dev

# Terminal 2 - Frontend (puerto 3001)
cd client
npm start
```

**Opción B - Producción:**

```bash
# Build del frontend
npm run build

# Iniciar servidor (frontend y backend juntos)
NODE_ENV=production npm start
```

### Paso 4: Acceder a la Aplicación

Abre tu navegador en:
- **Desarrollo:** http://localhost:3001
- **Producción:** http://localhost:3000

**Credenciales de prueba:**
- Usuario: `demo`
- Contraseña: `password123`

## 📋 Comandos Disponibles

```bash
# Instalar todas las dependencias
npm run install-all

# Inicializar base de datos
npm run init-db

# Iniciar backend en desarrollo
npm run dev

# Iniciar frontend en desarrollo
cd client && npm start

# Build del frontend para producción
npm run build

# Iniciar en producción
npm start
```

## 🎯 Primeros Pasos en la Aplicación

1. **Login** con las credenciales demo
2. En el **Dashboard**, verás dos modos:
   - 🚗 **Modo Real:** 35 preguntas, 45 min
   - 📚 **Modo Extenso:** 100 preguntas, 90 min
3. Haz clic en **"Iniciar"** para comenzar un cuestionario
4. Responde las preguntas (se guardan automáticamente)
5. Al terminar, haz clic en **"Entregar Cuestionario"**
6. Revisa tus **resultados** con explicaciones detalladas
7. Ve a **Estadísticas** para ver tu progreso

## 🔧 Configuración Avanzada

### Variables de Entorno (.env)

```env
PORT=3000
JWT_SECRET=cambia_esto_en_produccion
NODE_ENV=development
```

### Añadir Más Preguntas

Puedes añadir preguntas directamente en SQLite:

```sql
INSERT INTO questions (
  category_id, 
  question_text, 
  option_a, 
  option_b, 
  option_c, 
  correct_answer, 
  explanation
) VALUES (
  1,
  '¿Qué indica una señal octogonal?',
  'Peligro',
  'Stop obligatorio',
  'Prohibición',
  'B',
  'La señal octogonal siempre indica STOP.'
);
```

O crear un script personalizado:

```javascript
// server/scripts/addQuestions.js
import { dbRun } from '../config/database.js';

const questions = [
  {
    category_id: 1,
    question_text: '¿Tu pregunta?',
    option_a: 'Opción A',
    option_b: 'Opción B',
    option_c: 'Opción C',
    correct_answer: 'A',
    explanation: 'Explicación...'
  },
  // ... más preguntas
];

for (const q of questions) {
  await dbRun(
    'INSERT INTO questions (category_id, question_text, option_a, option_b, option_c, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [q.category_id, q.question_text, q.option_a, q.option_b, q.option_c, q.correct_answer, q.explanation]
  );
}
```

## 📊 Estructura de Archivos Clave

```
TestConduccionWeb/
├── server/
│   ├── index.js              # Servidor principal
│   ├── routes/
│   │   ├── auth.js           # Login y registro
│   │   ├── quiz.js           # Lógica de cuestionarios
│   │   └── stats.js          # Estadísticas
│   └── scripts/
│       └── initDatabase.js   # Inicialización de BD
│
├── client/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.js  # Página principal
│       │   ├── Quiz.js       # Página de examen
│       │   └── Results.js    # Resultados
│       └── context/
│           └── AuthContext.js # Autenticación
│
├── database.sqlite           # Base de datos (se crea automáticamente)
├── .env                      # Variables de entorno
└── package.json
```

## 🐛 Solución de Problemas

### Error: "Cannot find module"
```bash
npm run install-all
```

### Error: "Database not found"
```bash
npm run init-db
```

### Error: "Port already in use"
```bash
# Cambiar el puerto en .env
PORT=3001
```

### Frontend no carga en producción
```bash
cd client
npm run build
cd ..
npm start
```

## 🚀 Deploy Rápido

### Heroku

```bash
heroku create tu-app-conduccion
heroku config:set JWT_SECRET=tu_secreto_seguro
git push heroku main
```

### Render

1. Conectar repositorio GitHub
2. Build Command: `npm run install-all && npm run init-db && npm run build`
3. Start Command: `NODE_ENV=production npm start`

### Railway

1. Conectar repositorio
2. Añadir variable `JWT_SECRET`
3. Deploy automático

## 📚 Recursos Adicionales

- **Documentación completa:** Ver [README.md](README.md)
- **API Endpoints:** `/api/*`
- **Base de datos:** SQLite Browser para ver/editar

## 💡 Tips

- El cuestionario se guarda automáticamente mientras respondes
- Puedes cerrar la ventana y continuar después
- Las preguntas se seleccionan proporcionalmente de todas las categorías
- El temporizador se muestra en rojo cuando quedan menos de 5 minutos
- Puedes navegar entre preguntas usando los puntos inferiores

## 🆘 Soporte

¿Problemas? Verifica:
1. ✅ Node.js instalado (v14+)
2. ✅ Dependencias instaladas (`npm run install-all`)
3. ✅ Base de datos inicializada (`npm run init-db`)
4. ✅ Puerto 3000/3001 disponibles
5. ✅ Variables de entorno configuradas (.env)

---

**¡Listo para comenzar! 🎉**
