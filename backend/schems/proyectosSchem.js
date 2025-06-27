import mongoose from "mongoose";
import validator from 'validator';

const proyectoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre del proyecto es obligatorio'],
        trim: true,
        minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
        maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
        validate: {
            validator: function(v) {
                return /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-_.,:;!?()'"¿¡]+$/.test(v);
            },
            message: 'El nombre contiene caracteres no permitidos'
        }
    },
    descripcion: {
        type: String,
        required: [true, 'La descripción es obligatoria'],
        minlength: [20, 'La descripción debe tener al menos 20 caracteres'],
        maxlength: [2000, 'La descripción no puede exceder 2000 caracteres']
    },
    imagenPortada: {
        type: String,
        required: [true, 'La imagen de portada es obligatoria'],
        validate: {
            validator: validator.isURL,
            message: 'La URL de la imagen no es válida'
        }
    },
    imagenes: [{
        url: {
            type: String,
            validate: {
                validator: validator.isURL,
                message: 'La URL de la imagen no es válida'
            }
        },
        descripcion: String,
        orden: Number
    }],
    tecnologias: {
        type: [{
            type: String,
            trim: true,
            uppercase: true,
            enum: {
                values: [
                    'REACT', 'NODE', 'EXPRESS', 'MONGODB', 'JAVASCRIPT', 
                    'TYPESCRIPT', 'HTML', 'CSS', 'PYTHON', 'ANGULAR', 'VUE',
                    'DOCKER', 'AWS', 'GCP', 'FIREBASE', 'GRAPHQL', 'REDUX',
                    'SASS', 'JAVA', 'SWIFT', 'KOTLIN', 'PHP', 'RUBY', 'GO'
                ],
                message: '{VALUE} no es una tecnología válida'
            }
        }],
        required: [true, 'Debe especificar al menos una tecnología'],
        validate: {
            validator: function(v) {
                return v.length > 0 && v.length <= 15;
            },
            message: 'Debe tener entre 1 y 15 tecnologías'
        }
    },
    enlaceDemo: {
        type: String,
        validate: {
            validator: validator.isURL,
            message: 'La URL del demo no es válida'
        }
    },
    enlaceRepositorio: {
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true;
                return validator.isURL(v) && 
                    (v.includes('github.com') || 
                     v.includes('gitlab.com') || 
                     v.includes('bitbucket.org'));
            },
            message: 'Debe ser una URL de GitHub, GitLab o Bitbucket válida'
        }
    },
    creador: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El creador es obligatorio']
    },
    colaboradores: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario'
    }],
    estado: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'ARCHIVED', 'DELETED'],
        default: 'DRAFT',
        uppercase: true
    },
    fechaInicio: {
        type: Date,
        validate: {
            validator: function(v) {
                if (!this.fechaFin) return true;
                return v <= this.fechaFin;
            },
            message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        }
    },
    fechaFin: {
        type: Date
    },
    historial: [{
        accion: {
            type: String,
            required: true,
            enum: ['CREACION', 'ACTUALIZACION', 'ELIMINACION', 'ARCHIVADO', 'RESTAURADO', 'COLABORADOR_AGREGADO', 'COLABORADOR_ELIMINADO']
        },
        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Usuario',
            required: true
        },
        fecha: {
            type: Date,
            default: Date.now
        },
        cambios: mongoose.Schema.Types.Mixed,
        metadata: mongoose.Schema.Types.Mixed
    }],
    etiquetas: [{
        type: String,
        trim: true,
        maxlength: [20, 'La etiqueta no puede exceder 20 caracteres']
    }],
    visibilidad: {
        type: String,
        enum: ['PUBLICO', 'PRIVADO', 'COLABORADORES'],
        default: 'PUBLICO'
    },
    estadisticas: {
        visitas: {
            type: Number,
            default: 0
        },
        clicsRepositorio: {
            type: Number,
            default: 0
        },
        clicsDemo: {
            type: Number,
            default: 0
        }
    }
}, { 
    timestamps: true,
    toJSON: { 
        virtuals: true,
        versionKey: false,
        transform: function(doc, ret) {
            ret.id = ret._id;
            delete ret._id;
            return ret;
        }
    }
});

// Middlewares
proyectoSchema.pre('save', function(next) {
    // Limpieza y normalización de datos
    if (this.nombre) this.nombre = this.nombre.trim();
    if (this.descripcion) this.descripcion = this.descripcion.trim();
    
    // Validación de fechas
    if (this.fechaInicio && this.fechaFin && this.fechaInicio > this.fechaFin) {
        throw new Error('La fecha de inicio no puede ser posterior a la fecha de fin');
    }
    
    next();
});

proyectoSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    if (update.$set?.nombre) {
        update.$set.nombre = update.$set.nombre.trim();
    }
    
    if (update.$set?.descripcion) {
        update.$set.descripcion = update.$set.descripcion.trim();
    }
    
    next();
});

// Virtuals
proyectoSchema.virtual('duracion').get(function() {
    if (!this.fechaInicio || !this.fechaFin) return null;
    return this.fechaFin - this.fechaInicio;
});

proyectoSchema.virtual('descripcionCorta').get(function() {
    if (!this.descripcion) return '';
    return this.descripcion.length > 150 
        ? this.descripcion.substring(0, 150) + '...' 
        : this.descripcion;
});

proyectoSchema.virtual('esActivo').get(function() {
    return this.estado === 'ACTIVE';
});

proyectoSchema.virtual('tieneDemo').get(function() {
    return !!this.enlaceDemo;
});

proyectoSchema.virtual('tieneRepositorio').get(function() {
    return !!this.enlaceRepositorio;
});

// Métodos de instancia
proyectoSchema.methods = {
    agregarColaborador: function(usuarioId) {
        if (!this.colaboradores.includes(usuarioId)) {
            this.colaboradores.push(usuarioId);
        }
        return this.save();
    },
    registrarVisita: function() {
        this.estadisticas.visitas += 1;
        return this.save();
    }
};

// Índices
proyectoSchema.index({ nombre: 'text', descripcion: 'text', etiquetas: 'text' });
proyectoSchema.index({ tecnologias: 1 });
proyectoSchema.index({ creador: 1 });
proyectoSchema.index({ estado: 1 });
proyectoSchema.index({ visibilidad: 1 });
proyectoSchema.index({ 'tecnologias': 1, 'estado': 1 });
proyectoSchema.index({ fechaInicio: -1 });
proyectoSchema.index({ 'estadisticas.visitas': -1 });

export default mongoose.model('Proyecto', proyectoSchema);