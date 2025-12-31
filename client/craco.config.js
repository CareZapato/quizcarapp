// Suprimir warnings de deprecación de webpack dev server
process.env.NODE_OPTIONS = '--no-deprecation';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configuración personalizada de webpack si es necesario
      return webpackConfig;
    }
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      // Migración de onBeforeSetupMiddleware y onAfterSetupMiddleware
      return middlewares;
    }
  }
};
