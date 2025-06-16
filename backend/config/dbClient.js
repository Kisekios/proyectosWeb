/* import mongoose from 'mongoose';
import 'dotenv/config';

class dbClient {
    constructor() {
        this.conectarBD();
    }

    async conectarBD() {
        try {
            mongoose.connect(process.env.MONGODB_URI);
            this.db = mongoose.connection;
            console.log('Conectado a la Base de Datos');
        } catch (error) {
            console.log('Error al conectar a la Base de Datos', error);
        }
    }
}

export default new dbClient(); */

import mongoose from 'mongoose';
import 'dotenv/config';

class dbClient {
  constructor() {
    this.db = null; // Inicializa this.db como null
    this.conectarBD();
  }

  async conectarBD() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Ajusta tiempo de espera
      });
      this.db = mongoose.connection;

      this.db.on('error', (error) => {
        console.error('Error después de conectar:', error);
      });

      console.log('✅ Conectado a MongoDB (con await)');
    } catch (error) {
      console.error('🚨 Error inicial de conexión:', error);
      process.exit(1); // Detén la app si la conexión es crítica
    }
  }

  async cerrarConexion() {
    try {
      await mongoose.disconnect();
      console.log("Conexion a la base de datos cerrada")
    } catch (error) {
      console.log("Error al cerrar la base de datos")
    }
  }
}

export default new dbClient();
