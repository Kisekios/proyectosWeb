/**
 * Genera una clave única para caché basada en la solicitud
 */
export const generateCacheKey = (req) => {
    const { originalUrl, method, query, body, user } = req;
    
    const keyParts = [
        method,
        originalUrl,
        JSON.stringify(query),
        JSON.stringify(body),
        user?.id ? `user:${user.id}` : 'guest'
    ];
    
    return `cache:${hashString(keyParts.join('::'))}`;
};

/**
 * Función simple de hashing para strings
 */
const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
};

export default {
    generateCacheKey,
    hashString
};