# 🎨 Guía Visual de la Aplicación

## 📱 Páginas Principales

### 1. 🔐 Página de Login
**Ruta:** `/login`

**Características:**
- Formulario de inicio de sesión
- Link a registro
- Credenciales de usuario demo visibles
- Diseño centrado con gradiente de fondo

**Campos:**
- Usuario
- Contraseña

### 2. 📝 Página de Registro
**Ruta:** `/register`

**Características:**
- Formulario de registro completo
- Validación de contraseñas
- Link a login
- Diseño similar al login

**Campos:**
- Usuario
- Email
- Contraseña
- Confirmar Contraseña

### 3. 🏠 Dashboard (Página Principal)
**Ruta:** `/dashboard`

**Secciones:**
1. **Estadísticas Rápidas:**
   - Total de cuestionarios
   - Cuestionarios aprobados
   - Cuestionarios suspendidos
   - Promedio de puntuación

2. **Modos de Cuestionario:**
   - **Modo Real:** 35 preguntas, 45 min
   - **Modo Extenso:** 100 preguntas, 90 min
   - Cada modo con botón de inicio

3. **Últimos Cuestionarios:**
   - Lista de últimos 5 cuestionarios
   - Badge de aprobado/suspendido
   - Fecha y puntuación
   - Botón para ver detalles

### 4. 📝 Página de Cuestionario
**Ruta:** `/quiz`

**Componentes:**

**Header Superior:**
- Barra de progreso (pregunta X de Y)
- Contador de preguntas respondidas
- Temporizador (cambia a rojo con <5 min)

**Área de Pregunta:**
- Número de pregunta con badge
- Texto de la pregunta
- Imagen (si existe)
- 3 opciones de respuesta (A, B, C)
- Check verde en la opción seleccionada

**Navegación:**
- Botón "Anterior"
- Puntos de navegación (verde si respondida)
- Botón "Siguiente" o "Entregar"

**Características:**
- Guardado automático de respuestas
- Navegación libre entre preguntas
- Indicador visual de preguntas respondidas

### 5. 🏆 Página de Resultados
**Ruta:** `/results/:quizId`

**Secciones:**

**Hero Section:**
- Emoji grande (🎉 aprobado / 😔 suspendido)
- Título y mensaje personalizado
- Gráfico circular de puntuación
- Gradiente verde (aprobado) o rojo (suspendido)

**Tarjetas de Estadísticas:**
- Respuestas correctas
- Respuestas incorrectas
- Tiempo utilizado
- Modo del cuestionario

**Revisión de Respuestas:**
- Botón "Mostrar/Ocultar Detalles"
- Lista de todas las preguntas con:
  - Check verde (correcta) o X roja (incorrecta)
  - Texto de la pregunta
  - Imagen (si existe)
  - Opciones con código de colores:
    - Verde: respuesta correcta
    - Rojo: respuesta incorrecta del usuario
    - Gris: opciones no seleccionadas
  - Explicación de la respuesta

**Botones de Acción:**
- "Volver al Inicio"
- "Intentar de Nuevo"

### 6. 📊 Página de Estadísticas
**Ruta:** `/stats`

**Secciones:**

**Resumen General:**
- 4 tarjetas grandes con:
  - Total de cuestionarios
  - Aprobados
  - Suspendidos
  - Promedio general

**Progreso por Categoría:**
- Tarjetas individuales por categoría
- Preguntas respondidas
- Respuestas correctas
- Porcentaje de precisión
- Barra de progreso

**Historial de Cuestionarios:**
- Tabla con:
  - Fecha y hora
  - Modo (Real/Extenso)
  - Resultado (Aprobado/Suspendido)
  - Puntuación
  - Tiempo utilizado
  - Botón "Ver Detalles"
- Paginación

## 🎨 Paleta de Colores

### Colores Principales
```css
--primary: #667eea      /* Azul/Púrpura */
--secondary: #764ba2    /* Púrpura oscuro */
--success: #10b981      /* Verde */
--danger: #ef4444       /* Rojo */
--warning: #f59e0b      /* Amarillo/Naranja */
--info: #3b82f6         /* Azul */
```

### Colores de Fondo
```css
--white: #ffffff
--light: #f3f4f6
--dark: #1f2937
```

### Gradientes
```css
/* Principal */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* Éxito */
background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);

/* Error */
background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
```

## 🎯 Iconografía

### Emojis Principales
- 🚗 Modo Real
- 📚 Modo Extenso
- 📝 Cuestionarios
- 🎉 Aprobado
- 😔 Suspendido
- 📊 Estadísticas
- 🏆 Logros
- ⏰ Tiempo

### React Icons
- `FaUser` - Usuario
- `FaLock` - Contraseña
- `FaEnvelope` - Email
- `FaClock` - Temporizador
- `FaCheckCircle` - Correcto
- `FaTimesCircle` - Incorrecto
- `FaChartBar` - Estadísticas
- `FaTrophy` - Trofeo
- `FaPlay` - Iniciar
- `FaHome` - Inicio

## 📐 Componentes de UI

### Botones

**Primario:**
```css
background: linear-gradient(135deg, #667eea, #764ba2);
color: white;
padding: 12px 24px;
border-radius: 8px;
```

**Secundario:**
```css
background: #1f2937;
color: white;
padding: 12px 24px;
border-radius: 8px;
```

**Éxito:**
```css
background: #10b981;
color: white;
padding: 12px 24px;
border-radius: 8px;
```

**Outline:**
```css
background: transparent;
border: 2px solid #667eea;
color: #667eea;
padding: 12px 24px;
border-radius: 8px;
```

### Tarjetas (Cards)

```css
background: white;
border-radius: 12px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
padding: 24px;
transition: transform 0.3s;
```

**Hover:**
```css
transform: translateY(-4px);
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
```

### Badges

**Aprobado:**
```css
background: #d1fae5;
color: #065f46;
padding: 6px 12px;
border-radius: 6px;
font-weight: 600;
```

**Suspendido:**
```css
background: #fee2e2;
color: #991b1b;
padding: 6px 12px;
border-radius: 6px;
font-weight: 600;
```

### Barra de Progreso

```css
height: 8px;
background: #e5e7eb;
border-radius: 4px;
overflow: hidden;

/* Fill */
background: linear-gradient(90deg, #667eea, #764ba2);
transition: width 0.3s;
```

### Alertas

**Info:**
```css
background: #dbeafe;
color: #1e40af;
border: 1px solid #3b82f6;
padding: 16px;
border-radius: 8px;
```

**Éxito:**
```css
background: #d1fae5;
color: #065f46;
border: 1px solid #10b981;
padding: 16px;
border-radius: 8px;
```

**Error:**
```css
background: #fee2e2;
color: #991b1b;
border: 1px solid #ef4444;
padding: 16px;
border-radius: 8px;
```

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile */
@media (max-width: 768px) {
  /* Diseño vertical */
  /* Botones full-width */
  /* Fuentes más pequeñas */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  /* Grid ajustado */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Diseño completo */
}
```

### Adaptaciones Mobile

1. **Navbar:**
   - Se apila verticalmente
   - Iconos más grandes

2. **Dashboard:**
   - Cards en columna única
   - Botones full-width

3. **Quiz:**
   - Temporizador más pequeño
   - Navegación vertical
   - Dots más separados

4. **Tabla de Historial:**
   - Scroll horizontal
   - Fuentes reducidas

## 🎭 Animaciones

### Entrada de Elementos
```css
animation: fadeIn 0.5s ease;

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Bounce del Icono de Resultado
```css
animation: bounceIn 0.6s ease;

@keyframes bounceIn {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

### Pulse del Temporizador
```css
animation: pulse 1s infinite;

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### Hover en Botones
```css
transition: transform 0.3s, box-shadow 0.3s;

&:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}
```

## 🎨 Consejos de Diseño

### Para Mantener Consistencia:

1. **Espaciado:**
   - Usar múltiplos de 4px (8, 12, 16, 20, 24, 32...)
   - Mantener consistencia en márgenes y padding

2. **Tipografía:**
   - Títulos: 48px, 32px, 24px, 20px, 18px
   - Texto: 16px
   - Pequeño: 14px, 12px

3. **Bordes:**
   - Radius estándar: 8px
   - Radius grande: 12px o 16px
   - Pills: 20px o 50%

4. **Sombras:**
   - Suave: `0 2px 4px rgba(0, 0, 0, 0.1)`
   - Media: `0 4px 6px rgba(0, 0, 0, 0.1)`
   - Fuerte: `0 8px 16px rgba(0, 0, 0, 0.15)`

5. **Colores de Texto:**
   - Principal: `#1f2937`
   - Secundario: `#6b7280`
   - Terciario: `#9ca3af`

---

**¡Con esta guía puedes personalizar el diseño fácilmente! 🎨**
