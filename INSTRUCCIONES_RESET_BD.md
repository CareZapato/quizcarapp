# 🔄 Reiniciar Base de Datos con Nuevas Categorías

## Para aplicar los cambios, ejecuta:

```bash
# Desde la raíz del proyecto
node server/scripts/initDatabase.js
```

## Esto hará:

1. ✅ Eliminar todas las tablas existentes
2. ✅ Crear tablas nuevas con el esquema actualizado
3. ✅ Insertar las **7 categorías** (incluyendo la 0 y la 6):
   - **ID 0: Indefinido** (categoría por defecto)
   - ID 1: Señales de Tráfico
   - ID 2: Normas de Circulación
   - ID 3: Seguridad Vial
   - ID 4: Mecánica Básica
   - ID 5: Primeros Auxilios
   - **ID 6: Sistemas y Equipos del Vehículo** (nueva)
4. ✅ Crear usuarios admin y demo

## Categorías actualizadas:

```
ID | Nombre                              | Descripción
---+-------------------------------------+------------------------------------------
0  | Indefinido                          | Categoría por defecto para preguntas sin categoría específica
1  | Señales de Tráfico                  | Señales de tráfico y señalización
2  | Normas de Circulación               | Reglas y normas de circulación
3  | Seguridad Vial                      | Seguridad y prevención de accidentes
4  | Mecánica Básica                     | Conocimientos básicos de mecánica
5  | Primeros Auxilios                   | Primeros auxilios en accidentes
6  | Sistemas y Equipos del Vehículo     | Conocimientos sobre sistemas y equipos de seguridad
```

## Comportamiento de importación actualizado:

### ✅ Si category_id no existe o no se proporciona:
- Se guardará con **category_id: 0 (Indefinido)**
- Ya no dará error
- Warning informativo en la respuesta

### ✅ Tu pregunta 26 ahora funcionará:
```json
{
  "question_number": 26,
  "category_id": 6,  // ← Ahora existe!
  ...
}
```

## ⚠️ IMPORTANTE: Backup antes de reiniciar

```bash
# Hacer backup de la base de datos
pg_dump -U postgres testconduccion > backup_antes_reset.sql

# Reiniciar con nuevas categorías
node server/scripts/initDatabase.js

# Si algo sale mal, restaurar:
# psql -U postgres testconduccion < backup_antes_reset.sql
```

---

**Después del reset, todas las preguntas se borrarán. Tendrás que reimportarlas.**
