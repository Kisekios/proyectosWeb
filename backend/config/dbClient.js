import mongoose from 'mongoose';
import 'dotenv/config';

class DBClient {
  constructor() {
    this.connection = null;
    this.isConnected = false;
    this.retryCount = 0;
    
    this.config = {
      maxRetries: parseInt(process.env.DB_MAX_RETRIES) || 3,
      retryDelay: parseInt(process.env.DB_RETRY_DELAY_MS) || 5000,
      timeout: parseInt(process.env.DB_TIMEOUT_MS) || 5000,
      socketTimeout: parseInt(process.env.DB_SOCKET_TIMEOUT_MS) || 30000,
      poolSize: parseInt(process.env.DB_POOL_SIZE) || 10
    };

    mongoose.set('strictQuery', true);
    this._configureEventListeners();
  }

  _configureEventListeners() {
    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      console.log('✅ MongoDB connected:', {
        dbName: this.connection.db.databaseName,
        host: this.connection.host,
        port: this.connection.port,
        poolSize: this.config.poolSize,
        status: mongoose.connection.readyState
      });
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', {
        name: error.name,
        code: error.code,
        message: error.message
      });
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔁 MongoDB reconnected');
    });
  }

  async connect() {
    if (this.isConnected) {
      console.log('ℹ️ Using existing MongoDB connection');
      return this.status;
    }

    const options = {
      serverSelectionTimeoutMS: this.config.timeout,
      socketTimeoutMS: this.config.socketTimeout,
      maxPoolSize: this.config.poolSize,
      retryWrites: true,
      retryReads: true,
      w: 'majority'
    };

    try {
      await mongoose.connect(process.env.MONGODB_URI, options);
      this.connection = mongoose.connection;
      return this.status;
    } catch (error) {
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        console.warn(`Retry #${this.retryCount} in ${this.config.retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
        return this.connect();
      }
      
      throw new Error(`DB connection failed after ${this.config.maxRetries} attempts: ${error.message}`);
    }
  }

  async disconnect() {
    if (!this.isConnected) {
      console.log('ℹ️ No active MongoDB connection to disconnect');
      return;
    }

    try {
      await mongoose.disconnect();
      console.log('🛑 MongoDB disconnected gracefully');
    } catch (error) {
      console.error('❌ MongoDB disconnection error:', {
        name: error.name,
        message: error.message
      });
      throw error;
    } finally {
      this.connection = null;
      this.isConnected = false;
      this.retryCount = 0;
    }
  }

  async checkHealth() {
    if (!this.isConnected) {
      return { 
        healthy: false, 
        error: 'Not connected to database',
        details: this.status 
      };
    }
    
    try {
      const startTime = Date.now();
      await this.connection.db.command({ ping: 1 });
      const latency = Date.now() - startTime;
      
      return { 
        healthy: true,
        dbName: this.connection.db.databaseName,
        ping: 'OK',
        latency: `${latency}ms`,
        collections: (await this.connection.db.listCollections().toArray()).length
      };
    } catch (error) {
      return { 
        healthy: false,
        error: error.message,
        code: error.code 
      };
    }
  }

  get status() {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };

    return {
      isConnected: this.isConnected,
      readyState: states[this.connection?.readyState] || 'unknown',
      dbName: this.connection?.db?.databaseName || 'disconnected',
      poolSize: this.config.poolSize,
      retryCount: this.retryCount
    };
  }
}

// Singleton pattern para la instancia de DBClient
const dbClient = new DBClient();
export default dbClient;