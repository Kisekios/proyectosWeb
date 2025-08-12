import { portfolio } from "../index.js";

export const createIndexes = async () => {
    try {
        // Índice único para email (crítico para login/registro)
        await portfolio.collection('usuarios').createIndex(
            { email: 1 }, 
            { 
                unique: true,
                name: 'email_unique_idx',
                partialFilterExpression: { email: { $exists: true } }
            }
        );

        // Índice para búsquedas por nombre (si es frecuente)
        await portfolio.collection('usuarios').createIndex(
            { nombre: 1 },
            { name: 'nombre_idx' }
        );

        // Índice compuesto para consultas frecuentes con createdAt
        await portfolio.collection('usuarios').createIndex(
            { createdAt: -1 },
            { name: 'createdAt_desc_idx' }
        );

        console.log('✅ Índices creados exitosamente\n');
    } catch (error) {
        console.error('❌ Error creando índices:', error.message);
        throw error;
    }
};