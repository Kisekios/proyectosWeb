import { MongoClient } from 'mongodb';


// Instancia unica y que tendra almacenada las conexiones, se podra ver todas cluster, dbs y colecciones que fueron registradas atravez de esta clase
class DBClient {
  constructor() {
    this.clients = new Map();
    this.dbs = new Map();
    this.collections = new Map();
  }

  getClustersConnections() {
    return Array.from(this.clients.keys());
  }

  getDatabases(clusterName) {
    return Array.from(this.dbs.keys())
      .filter(key => key.startsWith(clusterName))
      .map(key => key.slice(clusterName.length));
  }

  getCollections(db) {
    return Array.from(this.collections.keys())
      .filter(key => key.startsWith(db))
      .map(key => key.slice(db.length));
  }

  async connectToCluster(clusterName, uri, options = {}) {
    if (!uri || typeof uri !== 'string') {
      throw new Error(`URI inválida para ${clusterName}`);
    }

    if (this.clients.has(clusterName)) {
      console.warn(`⚠️ Ya existe una conexión con el nombre ${clusterName}`);
      return this.clients.get(clusterName);
    }

    try {
      const client = new MongoClient(uri, {
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        },
        ...options
      });

      await client.connect();
      this.clients.set(clusterName, client); // Guarda la conexion con el cluster en this.clients

      console.log(`\n✅ Conexión establecida con cluster: ${clusterName}\n`);
      return client;
    } catch (error) {
      console.error(`\n❌ Error conectando al cluster ${clusterName}:`, error.message);
      throw error;
    }
  }

  async getDB(clusterName, dbName, verifyExistence = false) {
    if (!this.clients.has(clusterName)) {
      throw new Error(`No existe conexión con el nombre ${clusterName}`);
    }

    const cacheKey = `${clusterName}_${dbName}`; // para guardar en this.dbs 

    if (!this.dbs.has(cacheKey)) {
      const client = this.clients.get(clusterName);
      const db = client.db(dbName);

      if (verifyExistence) {
        const dbList = await client.db().admin().listDatabases();
        const dbExists = dbList.databases.some(d => d.name === dbName);

        if (!dbExists) {
          console.warn(`⚠️ La base de datos '${dbName}' no existe en el cluster`);
        }
      }

      this.dbs.set(cacheKey, db);
      console.log(`🔷 Referencia obtenida para DB: ${dbName}`);
    }

    return this.dbs.get(cacheKey);
  }

  async ensureCollectionsExist(db, requiredCollections) {

    try {
      const existingCollections = (await db.listCollections().toArray()).map(c => c.name);

      for (const col of requiredCollections) {
        existingCollections.includes(col) === true ? this.collections.set(`${db.databaseName}_${col}`) : console.log(`\n❌ No existe la coleccion "${col}" en ${db.databaseName}`)
      }
    } catch (error) {
      console.error(`Error verificando colecciones:`, error);
      throw error;
    }
  }

  // Usar por medio de la API
  async closeConnection(connectionName) {
    if (this.clients.has(connectionName)) {
      await this.clients.get(connectionName).close();
      this.clients.delete(connectionName);

      // Eliminar referencias a bases de datos de esta conexión
      for (const [key] of this.dbs) {
        if (key.startsWith(`${connectionName}_`)) {
          this.dbs.delete(key);
        }
      }

      console.log(`🔴 Conexión cerrada: ${connectionName}`);
    }
  }

  /**
   * Cierra todas las conexiones por medio de la API
   */
  async closeAllConnections() {
    for (const [name, client] of this.clients) {
      await client.close();
      console.log(`🔴 Conexión cerrada: ${name}`);
    }
    this.clients.clear();
    this.dbs.clear();
    console.log('🛑 Todas las conexiones han sido cerradas');
  }
}

// Exportar una instancia singleton
export default new DBClient();