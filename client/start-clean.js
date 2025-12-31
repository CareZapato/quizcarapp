#!/usr/bin/env node

// Suprimir warnings de deprecación
process.env.NODE_OPTIONS = '--no-deprecation';
process.removeAllListeners('warning');

// Redirigir warnings a /dev/null
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(...args) {
  const warning = args[0];
  if (typeof warning === 'string') {
    // Suprimir warnings específicos de webpack-dev-server
    if (warning.includes('DeprecationWarning') || 
        warning.includes('DEP_WEBPACK') ||
        warning.includes('DEP0060')) {
      return;
    }
  }
  return originalEmitWarning.apply(process, args);
};

// Ejecutar react-scripts start
require('react-scripts/scripts/start');
