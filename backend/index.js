import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import proyectosRoutes from './routes/proyectosRoutes.js';
import usuariosRoutes from './routes/usuariosRoutes.js';
import dbClient from './config/dbClient.js';

// =============================================
// Configuración inicial y validaciones
// =============================================
const ENV_VARS = {
  required: ['MONGODB_URI', 'JWT_SECRET', 'NODE_ENV'],
  optional: {
    PORT: 5000,
    RATE_LIMIT_MAX: 100,
    ALLOWED_ORIGINS: 'http://localhost:3000'
  }
};

// Validar variables de entorno
const validateEnvironment = () => {
  const missingVars = ENV_VARS.required.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required ENV vars:', missingVars.join(', '));
    process.exit(1);
  }

  // Establecer valores por defecto para variables opcionales
  Object.entries(ENV_VARS.optional).forEach(([key, value]) => {
    process.env[key] = process.env[key] || value;
  });
};

validateEnvironment();

// =============================================
// Configuración de Express
// =============================================
const app = express();
let server = null;

// Middlewares esenciales
const setupMiddlewares = () => {
  app.use(helmet());
  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // Configuración de CORS
  app.use(cors({
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS.split(',')
      : process.env.ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  // Rate limiting
  app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX),
    message: '⚠️ Too many requests from this IP'
  }));

  // Logging en desarrollo
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
    console.log('🔧 Development mode enabled');
  }
};

setupMiddlewares();

// =============================================
// Rutas
// =============================================
const setupRoutes = () => {
  // Health check endpoints
  app.get('/', (req, res) => res.json({
    status: 'OK',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }));

  app.get('/health', async (req, res) => {
    const dbStatus = await dbClient.checkHealth();
    res.json({
      status: 'OK',
      db: dbStatus,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    });
  });

  // API Routes
  app.use('/api/v1/proyectos', proyectosRoutes);
  app.use('/api/v1/usuarios', usuariosRoutes);
};

setupRoutes();

// =============================================
// Manejo de errores
// =============================================
const setupErrorHandling = () => {
  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({ 
      success: false,
      code: 'ENDPOINT_NOT_FOUND',
      error: '🔍 Endpoint not found' 
    });
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    const status = err.statusCode || 500;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const response = {
      success: false,
      code: err.code || 'INTERNAL_ERROR',
      error: isDevelopment ? err.message : 'Internal server error'
    };

    if (isDevelopment) {
      response.stack = err.stack;
      console.error('🔥 Error:', {
        message: err.message,
        stack: err.stack,
        request: {
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          body: req.body
        }
      });
    }

    res.status(status).json(response);
  });
};

setupErrorHandling();

// =============================================
// Inicio y cierre del servidor
// =============================================
const startServer = async () => {
  try {
    await dbClient.connect();
    const port = parseInt(process.env.PORT);
    
    server = app.listen(port, () => {
      console.log(`
        🚀 Server running on port ${port}
        ⚡ Environment: ${process.env.NODE_ENV}
        🗄️  Database: ${dbClient.status.dbName}
        📅 Started at: ${new Date().toISOString()}
      `);
    });

    return server;
  } catch (error) {
    console.error('💥 Failed to start server:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};



const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    await dbClient.disconnect();
    
    if (server) {
      server.close(() => {
        console.log('💤 Server terminated');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Shutdown error:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Manejo de señales de terminación
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Iniciar la aplicación
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('💀 Critical failure:', error);
    process.exit(1);
  }
})();

export default app;