import { ObjectId } from "mongodb";

// Función helper para validar y crear ObjectId de forma segura
export const createSafeObjectId = (id) => {
    // Validación completa: debe ser string, 24 caracteres y formato hexadecimal válido
    if (typeof id === 'string' && id.length === 24 && ObjectId.isValid(id)) {
        return new ObjectId(id);
    }
    return null; // Retorna null si no es un ObjectId válido
};