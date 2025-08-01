import { config } from 'dotenv';
import path from 'path';
import { validateEnv } from './initServer.js';

// Paso 1: cargar .env base para obtener NODE_ENV
config(); // Esto carga NODE_ENV

// Paso 2: usar NODE_ENV ya cargado para cargar el archivo específico
const env = process.env.ENTORNO;
config({ path: path.resolve(process.cwd(), `.env.${env}`) });

console.log(`\n🔧 Variables cargadas desde .${env}`);

try {
    validateEnv()
} catch (error) {
    console.warn(error);
}
