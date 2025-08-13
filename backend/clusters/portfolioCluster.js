import DBClient from '../config/dbClient.js';
import fs from 'fs';
import path from 'path'

// Leer y parsear el JSON
const archivoJson = fs.readFileSync(path.resolve('./clusters/clusters.json'), 'utf-8');
const clusters = JSON.parse(archivoJson);

const cluster = clusters.find(cluster => cluster.clusterName === process.env.CLUSTER_ONE);

// Configuración del cluster
const CLUSTER_NAME = cluster.clusterName;
const CLUSTER_URI = cluster.mongoUri;

/**
 * Inicializa la conexión al cluster y verifica estructura
 */
export async function initPortfolioCluster() {
  try {
    // 1. Conectar al cluster
    await DBClient.connectToCluster(CLUSTER_NAME, CLUSTER_URI);

    // 2. Obtener referencias a las bases de datos (con verificación)
    const db1 = await DBClient.getDB(CLUSTER_NAME, cluster.dbs.db1Name, true);
    const db2 = await DBClient.getDB(CLUSTER_NAME, cluster.dbs.db2Name, true);

    // 3. Verificar/crear colecciones requeridas
    await DBClient.ensureCollectionsExist(db1, cluster.dbs.colectionsdb1);
    await DBClient.ensureCollectionsExist(db2, cluster.dbs.colectionsdb2);

    // 4. Verificar conexión
    await db1.command({ ping: 1 });
    await db2.command({ ping: 1 });

    console.log(`
    =================================================
    🚀 Conexión exitosa a ${CLUSTER_NAME}
    📁 Bases de datos inicializadas:

      • ${cluster.dbs.db1Name} (${DBClient.getDataOf('collections',`${cluster.dbs.db1Name}`)})
      • ${cluster.dbs.db2Name} (${DBClient.getDataOf('collections',`${cluster.dbs.db2Name}`)})
    =================================================
    `);

    return { db1, db2 };
  } catch (error) {
    console.error(`❌ Error inicializando el cluster ${CLUSTER_NAME}:`, error.message);
    await DBClient.closeAllConnections();

    // ❌ No terminar el proceso aquí
    throw error;
  }
}

// Manejo de cierre de conexiones
const setupCloseHandlers = () => {
  const shutdown = async (signal) => {
    console.log(`\n${signal} recibido. Cerrando conexiones...`);
    await DBClient.closeAllConnections();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', async (err) => {
    console.error('Excepción no capturada:', err);
    await DBClient.closeAllConnections();
    process.exit(1);
  });
};

setupCloseHandlers();