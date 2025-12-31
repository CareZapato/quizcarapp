/**
 * Script para ayudar a identificar consultas SQL que necesitan conversión
 * de SQLite (?) a PostgreSQL ($1, $2, etc.)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '../routes');

function convertQueryPlaceholders(content) {
  let modified = content;
  let paramCounter = 0;

  // Reemplazar ? con $1, $2, etc. en orden
  modified = modified.replace(/(['"` ])\?/g, (match, prefix) => {
    paramCounter++;
    return `${prefix}$${paramCounter}`;
  });

  return modified;
}

function processFile(filePath) {
  console.log(`\nProcesando: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar patrones de consultas SQL con ?
  const sqlPatterns = [
    /dbGet\s*\(\s*['"`].*?\?.*?['"`]/g,
    /dbRun\s*\(\s*['"`].*?\?.*?['"`]/g,
    /dbAll\s*\(\s*['"`].*?\?.*?['"`]/g,
  ];

  let hasSqlite = false;
  for (const pattern of sqlPatterns) {
    if (pattern.test(content)) {
      hasSqlite = true;
      break;
    }
  }

  if (hasSqlite) {
    console.log(`⚠️  Encontradas consultas con formato SQLite (?)`);
    return true;
  } else {
    console.log(`✅ No se encontraron consultas con formato SQLite`);
    return false;
  }
}

// Procesar todos los archivos en routes/
const files = fs.readdirSync(routesDir);
let needsConversion = false;

console.log('🔍 Buscando archivos con consultas SQLite...\n');

for (const file of files) {
  if (file.endsWith('.js')) {
    const filePath = path.join(routesDir, file);
    if (processFile(filePath)) {
      needsConversion = true;
    }
  }
}

if (needsConversion) {
  console.log('\n⚠️  IMPORTANTE: Algunos archivos necesitan actualización manual');
  console.log('📝 Busca y reemplaza: ? por $1, $2, $3, etc. en orden de aparición');
} else {
  console.log('\n✅ Todos los archivos están actualizados');
}
