/* import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import proyectosRutas from './routes/proyectosRutas.js';
import usuariosRutas from './routes/usuariosRutas.js'
import dbClient from './config/dbClient.js'


const app = express();
app.use(express.json()); // Para parsear JSON

 const allowedOrigins = [
  'http://localhost:5000',       // Ejemplo: frontend en React
  'http://localhost:3000',       // Ejemplo: frontend en React
];

app.use((req, res, next) => {
  const origen = req.headers.origin;
  if (allowedOrigins.includes(origen)) {
    res.setHeader('Access-Control-Allow-Origin', origin); // Solo permite dominios en la lista
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Antes de tus rutas
app.options('/proyecto', (req, res) => {
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.sendStatus(200);
});

// Rutas básicas
app.get('/', (req, res) => {
  res.send('Backend funcionando!');
});

// Rutas proyectos
app.use('/proyecto', proyectosRutas); 
app.use('/usuario', usuariosRutas); 

try {
  const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
} catch (error) {
  console.log('Error en arranque de servidor. Archivo index.js: ' + error)
}

process.on('SIGINT', async() =>{
  dbClient.cerrarConexion();
  process.exit(0)
}) */

import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import proyectosRutas from './routes/proyectosRutas.js';
import usuariosRutas from './routes/usuariosRutas.js';
import dbClient from './config/dbClient.js';

// Verificación de variables de entorno
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Faltan variables de entorno críticas');
  process.exit(1);
}

const app = express();

// Middlewares
app.use(helmet());
app.use(express.json());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Configuración de CORS
const allowedOrigins = [
  'http://localhost:5000',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rutas básicas
app.get('/', (req, res) => {
  res.send('Backend funcionando!');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Rutas de la aplicación
app.use('/proyecto', proyectosRutas);
app.use('/usuario', usuariosRutas);

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal en el servidor' });
});

// Inicio del servidor
const iniciarServidor = async () => {
  try {
    await dbClient.conectar();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Servidor en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

iniciarServidor();

// Manejo de cierre
process.on('SIGINT', async () => {
  await dbClient.cerrarConexion();
  process.exit(0);
});