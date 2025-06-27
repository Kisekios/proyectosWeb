import mongoose from "mongoose";
import bcrypt from 'bcrypt';
import validator from 'validator';

const usuariosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio'],
        trim: true,
        minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
        maxlength: [50, 'El nombre no puede exceder 50 caracteres'],
        validate: {
            validator: function(v) {
                return /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v);
            },
            message: 'El nombre solo puede contener letras y espacios'
        }
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio'],
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
            validator: validator.isEmail,
            message: 'Por favor ingresa un email válido'
        }
    },
    telefono: {
        type: String,
        required: [true, 'El teléfono es obligatorio'],
        validate: {
            validator: function(v) {
                return validator.isMobilePhone(v, 'es-MX');
            },
            message: 'Por favor ingresa un número de teléfono válido'
        }
    },
    clave: {
        type: String,
        required: [true, 'La contraseña es obligatoria'],
        minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
        maxlength: [128, 'La contraseña no puede exceder 128 caracteres'],
        select: false
    },
    avatar: {
        type: String,
        default: 'https://res.cloudinary.com/tu-cloud/image/upload/v1620000000/avatars/default.png',
        validate: {
            validator: validator.isURL,
            message: 'La URL del avatar no es válida'
        }
    },
    rol: {
        type: String,
        enum: ['USER', 'ADMIN', 'EDITOR', 'CREATOR'],
        default: 'USER',
        uppercase: true
    },
    estado: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'ACTIVE', 'INACTIVE', 'BLOCKED', 'DELETED'],
        default: 'PENDING_VERIFICATION',
        uppercase: true
    },
    verificationToken: {
        type: String,
        select: false
    },
    verificationExpires: {
        type: Date,
        select: false
    },
    resetToken: {
        type: String,
        select: false
    },
    resetExpires: {
        type: Date,
        select: false
    },
    loginAttempts: {
        type: Number,
        default: 0,
        select: false
    },
    blockExpires: {
        type: Date,
        select: false
    },
    ultimoAcceso: {
        type: Date
    },
    proyectos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Proyecto'
    }],
    metadata: {
        timezone: String,
        dispositivo: String,
        navegador: String
    }
}, { 
    timestamps: true,
    toJSON: { 
        virtuals: true,
        versionKey: false,
        transform: function(doc, ret) {
            // Eliminar campos sensibles
            const hiddenFields = [
                'clave', 
                'verificationToken', 
                'verificationExpires',
                'resetToken',
                'resetExpires',
                'loginAttempts',
                'blockExpires'
            ];
            hiddenFields.forEach(field => delete ret[field]);
            
            // Formatear campos
            ret.id = ret._id;
            delete ret._id;
            
            return ret;
        }
    }
});

// Middlewares
usuariosSchema.pre('save', async function(next) {
    if (!this.isModified('clave')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.clave = await bcrypt.hash(this.clave, salt);
        next();
    } catch (error) {
        next(error);
    }
});

usuariosSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();
    if (update.$set?.clave) {
        try {
            const salt = await bcrypt.genSalt(12);
            update.$set.clave = await bcrypt.hash(update.$set.clave, salt);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Métodos de instancia
usuariosSchema.methods = {
    compararClave: async function(claveIngresada) {
        return await bcrypt.compare(claveIngresada, this.clave);
    },
    generarTokenVerificacion: function() {
        this.verificationToken = require('crypto').randomBytes(20).toString('hex');
        this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
        return this.verificationToken;
    },
    generarTokenReset: function() {
        this.resetToken = require('crypto').randomBytes(20).toString('hex');
        this.resetExpires = Date.now() + 3600000; // 1 hora
        return this.resetToken;
    }
};

// Virtuals
usuariosSchema.virtual('nombreCompleto').get(function() {
    return this.nombre.trim();
});

usuariosSchema.virtual('esActivo').get(function() {
    return this.estado === 'ACTIVE';
});

usuariosSchema.virtual('esVerificado').get(function() {
    return this.estado !== 'PENDING_VERIFICATION';
});

// Índices
usuariosSchema.index({ email: 1 }, { unique: true });
usuariosSchema.index({ nombre: 'text' });
usuariosSchema.index({ estado: 1 });
usuariosSchema.index({ rol: 1 });
usuariosSchema.index({ ultimoAcceso: -1 });

export default mongoose.model('Usuario', usuariosSchema);