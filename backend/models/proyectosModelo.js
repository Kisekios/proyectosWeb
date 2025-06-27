import Proyecto from '../schems/proyectosSchem.js';
import Usuario from '../schems/usuariosSchem.js';
import { notifyCollaborators } from '../services/notificationService.js';

class ProyectoModel {
    /**
     * Crea un nuevo proyecto con validación extendida
     */
    async crear(proyectoData) {
        try {
            // Validación extendida
            const { nombre, creador } = proyectoData;
            if (!nombre || !creador) {
                throw this._buildError('VALIDATION_ERROR', 'Nombre y creador son requeridos');
            }

            // Verificar que el creador existe
            const creadorExiste = await Usuario.exists({ _id: creador });
            if (!creadorExiste) {
                throw this._buildError('USER_NOT_FOUND', 'El usuario creador no existe');
            }

            // Crear proyecto
            const proyecto = new Proyecto({
                ...proyectoData,
                estado: 'activo', // Estado por defecto
                historial: [{
                    accion: 'creacion',
                    usuario: creador,
                    fecha: new Date(),
                    cambios: { nombre }
                }]
            });

            await proyecto.save();

            // Agregar proyecto al usuario creador (asíncrono)
            Usuario.findByIdAndUpdate(
                creador,
                { $addToSet: { proyectos: proyecto._id } }
            ).catch(error => console.error('Error updating user projects:', error));

            return this._formatProject(proyecto);
        } catch (error) {
            this._handleError(error, 'crear proyecto');
        }
    }

    /**
     * Obtiene proyectos con paginación y filtrado avanzado
     */
    async obtenerTodosFiltrados({ 
        page = 1, 
        limit = 10, 
        tecnologias = [], 
        estado = 'activo',
        sort = '-createdAt'
    }) {
        try {
            const query = { estado };
            
            if (tecnologias.length > 0) {
                query.tecnologias = { $in: tecnologias };
            }

            const [proyectos, total] = await Promise.all([
                Proyecto.find(query)
                    .populate('creador', 'nombre email avatar')
                    .populate('colaboradores', 'nombre email avatar')
                    .sort(sort)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean(),
                Proyecto.countDocuments(query)
            ]);

            return {
                proyectos: proyectos.map(this._formatProject),
                total,
                page,
                limit
            };
        } catch (error) {
            this._handleError(error, 'obtener proyectos filtrados');
        }
    }

    /**
     * Obtiene un proyecto por ID con información completa
     */
    async obtenerPorIdCompleto(id) {
        try {
            const proyecto = await Proyecto.findById(id)
                .populate('creador', 'nombre email avatar')
                .populate('colaboradores', 'nombre email avatar')
                .populate('historial.usuario', 'nombre email avatar')
                .lean();

            if (!proyecto) {
                throw this._buildError('PROJECT_NOT_FOUND', 'Proyecto no encontrado');
            }

            return this._formatProject(proyecto, true);
        } catch (error) {
            this._handleError(error, 'obtener proyecto por ID');
        }
    }

    /**
     * Actualiza un proyecto con registro de cambios
     */
    async actualizarConHistorial(id, updateData, usuarioId) {
        try {
            // Obtener proyecto actual para comparar cambios
            const proyectoActual = await Proyecto.findById(id);
            if (!proyectoActual) {
                throw this._buildError('PROJECT_NOT_FOUND', 'Proyecto no encontrado');
            }

            // Filtrar campos permitidos
            const camposPermitidos = [
                'nombre', 'descripcion', 'tecnologias', 'estado', 
                'fechaInicio', 'fechaFin', 'enlaceDemo', 'enlaceRepositorio'
            ];
            const cambios = {};
            const cambiosHistorial = {};

            camposPermitidos.forEach(campo => {
                if (updateData[campo] !== undefined && 
                    updateData[campo] !== proyectoActual[campo]) {
                    cambios[campo] = updateData[campo];
                    cambiosHistorial[campo] = {
                        anterior: proyectoActual[campo],
                        nuevo: updateData[campo]
                    };
                }
            });

            // Si no hay cambios reales
            if (Object.keys(cambios).length === 0) {
                return this._formatProject(proyectoActual);
            }

            // Actualizar proyecto
            const proyecto = await Proyecto.findByIdAndUpdate(
                id,
                { 
                    $set: cambios,
                    $push: {
                        historial: {
                            accion: 'actualizacion',
                            usuario: usuarioId,
                            fecha: new Date(),
                            cambios: cambiosHistorial
                        }
                    }
                },
                { 
                    new: true,
                    runValidators: true
                }
            )
            .populate('creador', 'nombre email avatar')
            .populate('colaboradores', 'nombre email avatar');

            // Notificar colaboradores (asíncrono)
            if (proyecto.colaboradores.length > 0) {
                notifyCollaborators(
                    proyecto._id, 
                    proyecto.colaboradores.map(c => c._id),
                    'project_updated'
                ).catch(error => console.error('Error notifying collaborators:', error));
            }

            return this._formatProject(proyecto);
        } catch (error) {
            this._handleError(error, 'actualizar proyecto con historial');
        }
    }

    /**
     * Elimina un proyecto lógicamente (soft delete)
     */
    async eliminarLogicamente(id, usuarioId) {
        try {
            const proyecto = await Proyecto.findByIdAndUpdate(
                id,
                { 
                    $set: { 
                        estado: 'eliminado',
                        eliminadoPor: usuarioId,
                        eliminadoEn: new Date()
                    },
                    $push: {
                        historial: {
                            accion: 'eliminacion',
                            usuario: usuarioId,
                            fecha: new Date()
                        }
                    }
                },
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!proyecto) {
                throw this._buildError('PROJECT_NOT_FOUND', 'Proyecto no encontrado');
            }

            return this._formatProject(proyecto);
        } catch (error) {
            this._handleError(error, 'eliminar proyecto lógicamente');
        }
    }

    /**
     * Agrega un colaborador al proyecto
     */
    async agregarColaborador(proyectoId, usuarioId) {
        try {
            // Verificar que el usuario existe
            const usuarioExiste = await Usuario.exists({ _id: usuarioId });
            if (!usuarioExiste) {
                throw this._buildError('USER_NOT_FOUND', 'Usuario no encontrado');
            }

            // Actualizar proyecto
            const proyecto = await Proyecto.findByIdAndUpdate(
                proyectoId,
                { 
                    $addToSet: { colaboradores: usuarioId },
                    $push: {
                        historial: {
                            accion: 'agregar_colaborador',
                            usuario: usuarioId,
                            fecha: new Date()
                        }
                    }
                },
                { 
                    new: true,
                    runValidators: true
                }
            )
            .populate('creador', 'nombre email avatar')
            .populate('colaboradores', 'nombre email avatar');

            if (!proyecto) {
                throw this._buildError('PROJECT_NOT_FOUND', 'Proyecto no encontrado');
            }

            // Notificar al nuevo colaborador (asíncrono)
            notifyCollaborators(
                proyecto._id, 
                [usuarioId],
                'added_to_project'
            ).catch(error => console.error('Error notifying new collaborator:', error));

            return this._formatProject(proyecto);
        } catch (error) {
            this._handleError(error, 'agregar colaborador');
        }
    }

    // --- Métodos auxiliares privados ---

    _formatProject(project, fullDetails = false) {
        if (!project) return null;
        
        const formatted = {
            id: project._id,
            nombre: project.nombre,
            descripcion: project.descripcion,
            estado: project.estado,
            tecnologias: project.tecnologias || [],
            creador: project.creador,
            colaboradores: project.colaboradores || [],
            createdAt: project.createdAt,
            updatedAt: project.updatedAt
        };

        if (fullDetails) {
            Object.assign(formatted, {
                fechaInicio: project.fechaInicio,
                fechaFin: project.fechaFin,
                enlaceDemo: project.enlaceDemo,
                enlaceRepositorio: project.enlaceRepositorio,
                historial: project.historial || []
            });
        }

        return formatted;
    }

    _buildError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }

    _handleError(error, context) {
        console.error(`[ProyectoModel] Error al ${context}:`, error.message);
        
        // Preservar errores personalizados
        if (error.code) {
            throw error;
        }
        
        // Manejar errores de Mongoose
        if (error.name === 'ValidationError') {
            throw this._buildError('VALIDATION_ERROR', error.message);
        }
        
        if (error.code === 11000) {
            throw this._buildError('DUPLICATE_PROJECT', 'Ya existe un proyecto con ese nombre');
        }
        
        throw this._buildError('DB_OPERATION_FAILED', `Error al ${context}`);
    }
}

export default new ProyectoModel();