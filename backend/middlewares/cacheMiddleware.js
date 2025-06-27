import redis from 'redis';
import { promisify } from 'util';
import { generateCacheKey } from '../utils/helpers.js';

// Configuración de Redis
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DEFAULT_TTL = process.env.CACHE_TTL || 3600; // 1 hora por defecto

// Crear cliente Redis
const client = redis.createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 5) {
                console.error('❌ Max retries reached for Redis connection');
                return new Error('Max retries reached');
            }
            return Math.min(retries * 100, 5000); // Esperar hasta 5 segundos
        }
    }
});

// Promisificar los métodos de Redis
const getAsync = promisify(client.get).bind(client);
const setexAsync = promisify(client.setex).bind(client);
const delAsync = promisify(client.del).bind(client);

// Manejar eventos de conexión
client.on('connect', () => console.log('🔗 Redis client connected'));
client.on('error', (err) => console.error('❌ Redis error:', err));

// Middleware de caché
const cacheMiddleware = (ttl = DEFAULT_TTL) => {
    return async (req, res, next) => {
        // Solo cachear métodos GET
        if (req.method !== 'GET') {
            return next();
        }

        // Generar clave única para la solicitud
        const cacheKey = generateCacheKey(req);
        
        try {
            // Verificar si la respuesta está en caché
            const cachedData = await getAsync(cacheKey);
            
            if (cachedData) {
                console.log(`💾 Serving from cache: ${cacheKey}`);
                return res.json(JSON.parse(cachedData));
            }
            
            // Sobrescribir el método res.json para cachear la respuesta
            const originalJson = res.json;
            res.json = async (body) => {
                try {
                    // Cachear la respuesta
                    await setexAsync(cacheKey, ttl, JSON.stringify(body));
                    console.log(`✅ Cached response for: ${cacheKey}`);
                } catch (cacheError) {
                    console.error('❌ Cache set error:', cacheError);
                }
                
                // Enviar respuesta original
                originalJson.call(res, body);
            };
            
            next();
        } catch (error) {
            console.error('❌ Cache middleware error:', error);
            next();
        }
    };
};

// Métodos para manejo manual de caché
const cache = {
    get: async (key) => {
        try {
            const data = await getAsync(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ Cache get error:', error);
            return null;
        }
    },
    
    set: async (key, value, ttl = DEFAULT_TTL) => {
        try {
            await setexAsync(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ Cache set error:', error);
            return false;
        }
    },
    
    delete: async (key) => {
        try {
            await delAsync(key);
            return true;
        } catch (error) {
            console.error('❌ Cache delete error:', error);
            return false;
        }
    },
    
    clearByPattern: async (pattern) => {
        try {
            const keys = await new Promise((resolve, reject) => {
                client.keys(pattern, (err, keys) => {
                    if (err) return reject(err);
                    resolve(keys);
                });
            });
            
            if (keys.length > 0) {
                await delAsync(keys);
            }
            
            return keys.length;
        } catch (error) {
            console.error('❌ Cache clear by pattern error:', error);
            return 0;
        }
    },
    
    flush: async () => {
        try {
            await new Promise((resolve, reject) => {
                client.flushdb((err, succeeded) => {
                    if (err) return reject(err);
                    resolve(succeeded);
                });
            });
            return true;
        } catch (error) {
            console.error('❌ Cache flush error:', error);
            return false;
        }
    }
};

export { cacheMiddleware, cache };