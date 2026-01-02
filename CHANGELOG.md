# Changelog

## [0.2.1] - 2025-12-31

### Fixed
- Solucionado bug crítico de abandonar quiz: ahora al presionar "Abandonar" desde dentro del quiz o "Finalizar Revisión" en Results, el quiz se elimina correctamente sin necesidad de repetir el proceso en el Dashboard
- Implementada eliminación de TODOS los quizzes incompletos del usuario al abandonar, solucionando el problema de múltiples quizzes activos
- Agregada verificación antes de navegar al Dashboard para asegurar que el quiz fue eliminado correctamente
- Implementadas transacciones atómicas en la base de datos para garantizar consistencia

## [0.2.0] - 2025-12-31

### Added
- Modo Práctica: quiz infinito con 60 segundos por pregunta y nota de aprobación del 85%
- Soporte para preguntas con múltiples respuestas correctas (opciones D y E)
- Carga de imágenes para preguntas desde el panel de administración
- Acceso a la aplicación desde otros dispositivos en la red local
- Sistema de categorías para las preguntas
- Panel de estadísticas por categoría

### Changed
- Migración de SQLite a PostgreSQL 13
- Mejorada la interfaz de usuario con diseño responsive
- Actualizado el sistema de navegación con React Router v6

### Fixed
- Corregidos problemas de autenticación
- Mejorado el manejo de errores en el servidor
- Optimizado el rendimiento de las consultas a la base de datos

## [0.1.0] - 2025-12-30

### Added
- Versión inicial de la aplicación
- Sistema de autenticación (login/registro)
- Quiz en modo Real (35 preguntas, 45 minutos, 85% aprobación)
- Quiz en modo Extendido (100 preguntas, 90 minutos, 80% aprobación)
- Panel de administración para gestión de preguntas
- Sistema de resultados y revisión de respuestas
- Dashboard con estadísticas básicas
