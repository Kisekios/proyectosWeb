import proyectoModel from '../models/proyectosModelo.js';
import { notifyCollaborators } from '../services/notificationService.js'; // Nuevo servicio de notificaciones

class ProyectosController {
    /**
     * Crea un nuevo proyecto con validación avanzada
     */
    async crear(req, res) {
        try {
            const proyectoData = {
                ...this._sanitizeProjectInput(req.body),
                creador: req.user.id,
                colaboradores: [req.user.id] // Auto-agrega al creador como colaborador
            };

            // Validación de tecnologías únicas
            if (proyectoData.tecnologias) {
                proyectoData.tecnologias = [...new Set(proyectoData.tecnologias)];
            }

            const proyecto = await proyectoModel.crear(proyectoData);
            
            // Notificación asíncrona a potenciales colaboradores
            if (proyectoData.colaboradores?.length > 1) {
                notifyCollaborators(proyecto._id, proyectoData.colaboradores)
                    .catch(error => console.error('Error notifying collaborators:', error));
            }

            res.status(201).json(this._buildResponse(
                this._formatProjectOutput(proyecto),
                'Proyecto creado exitosamente'
            ));

        } catch (error) {
            this._handleError(res, error, 'CREATE_PROJECT_ERROR');
        }
    }

    /**
     * Obtiene proyectos con paginación y filtrado
     */
    async obtenerTodos(req, res) {
        try {
            const { page = 1, limit = 10, tecnologias, estado } = req.query;
            
            const { proyectos, total } = await proyectoModel.obtenerTodosFiltrados({
                page: parseInt(page),
                limit: Math.min(parseInt(limit), 100),
                tecnologias: tecnologias?.split(','),
                estado
            });

            res.status(200).json(this._buildResponse(
                proyectos.map(this._formatProjectOutput),
                '',
                {
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total,
                        pages: Math.ceil(total / limit)
                    }
                }
            ));

        } catch (error) {
            this._handleError(res, error, 'FETCH_PROJECTS_ERROR');
        }
    }

    /**
     * Obtiene un proyecto por ID con información extendida
     */
    async obtenerPorId(req, res) {
        try {
            const proyecto = await proyectoModel.obtenerPorIdCompleto(req.params.id);
            
            if (!proyecto) {
                return res.status(404).json(this._buildError(
                    'PROJECT_NOT_FOUND',
                    'Proyecto no encontrado'
                ));
            }

            res.status(200).json(this._buildResponse(
                this._formatProjectOutput(proyecto, true) // Detalles completos
            ));

        } catch (error) {
            this._handleError(res, error, 'FETCH_PROJECT_ERROR');
        }
    }

    /**
     * Actualiza un proyecto con control de cambios
     */
    async actualizar(req, res) {
        try {
            const cambios = this._sanitizeProjectInput(req.body);
            const proyecto = await proyectoModel.actualizarConHistorial(
                req.params.id,
                cambios,
                req.user.id // Usuario que realiza el cambio
            );
            
            if (!proyecto) {
                return res.status(404).json(this._buildError(
                    'PROJECT_NOT_FOUND',
                    'Proyecto no encontrado'
                ));
            }

            // Notificar colaboradores sobre cambios importantes
            if (this._cambioRelevante(cambios)) {
                notifyCollaborators(proyecto._id, proyecto.colaboradores, 'project_updated')
                    .catch(error => console.error('Error notifying collaborators:', error));
            }

            res.status(200).json(this._buildResponse(
                this._formatProjectOutput(proyecto),
                'Proyecto actualizado exitosamente'
            ));

        } catch (error) {
            this._handleError(res, error, 'UPDATE_PROJECT_ERROR');
        }
    }

    /**
     * Elimina un proyecto (soft delete)
     */
    async eliminar(req, res) {
        try {
            const proyecto = await proyectoModel.eliminarLogicamente(
                req.params.id,
                req.user.id
            );
            
            if (!proyecto) {
                return res.status(404).json(this._buildError(
                    'PROJECT_NOT_FOUND',
                    'Proyecto no encontrado'
                ));
            }

            res.status(200).json(this._buildResponse(
                null,
                'Proyecto marcado como eliminado'
            ));

        } catch (error) {
            this._handleError(res, error, 'DELETE_PROJECT_ERROR');
        }
    }

    /**
     * Agrega un colaborador al proyecto
     */
    async agregarColaborador(req, res) {
        try {
            const { proyectoId, usuarioId } = req.params;
            const proyecto = await proyectoModel.agregarColaborador(proyectoId, usuarioId);
            
            res.status(200).json(this._buildResponse(
                this._formatProjectOutput(proyecto),
                'Colaborador agregado exitosamente'
            ));

        } catch (error) {
            this._handleError(res, error, 'ADD_COLLABORATOR_ERROR');
        }
    }

    // --- Métodos auxiliares privados ---

    _sanitizeProjectInput(input) {
        const camposPermitidos = [
            'nombre', 
            'descripcion', 
            'tecnologias', 
            'estado', 
            'fechaInicio', 
            'fechaFin',
            'enlaceDemo',
            'enlaceRepositorio',
            'colaboradores'
        ];
        
        const sanitized = {};
        
        for (const campo of camposPermitidos) {
            if (input[campo] !== undefined) {
                sanitized[campo] = input[campo];
            }
        }
        
        return sanitized;
    }

    _formatProjectOutput(project, fullDetails = false) {
        const formatted = {
            id: project._id,
            nombre: project.nombre,
            descripcion: project.descripcion,
            tecnologias: project.tecnologias,
            estado: project.estado,
            creador: project.creador,
            fechaCreacion: project.createdAt
        };

        if (fullDetails) {
            Object.assign(formatted, {
                colaboradores: project.colaboradores,
                historial: project.historial,
                fechaInicio: project.fechaInicio,
                fechaFin: project.fechaFin,
                enlaces: {
                    demo: project.enlaceDemo,
                    repositorio: project.enlaceRepositorio
                }
            });
        }

        return formatted;
    }

    _cambioRelevante(cambios) {
        const camposRelevantes = ['estado', 'fechaFin', 'colaboradores'];
        return camposRelevantes.some(campo => cambios[campo] !== undefined);
    }

    _buildResponse(data, message = '', extras = {}) {
        return {
            success: true,
            data,
            message,
            ...extras,
            timestamp: new Date().toISOString()
        };
    }

    _buildError(code, message, details = null) {
        const error = { code, message };
        if (details) error.details = details;
        
        return {
            success: false,
            error,
            timestamp: new Date().toISOString()
        };
    }

    _handleError(res, error, context) {
        console.error(`[${context}]`, error);
        
        let status = 500;
        let errorCode = 'SERVER_ERROR';
        let errorMessage = 'Error en el servidor';
        
        if (error.name === 'ValidationError') {
            status = 400;
            errorCode = 'VALIDATION_ERROR';
            errorMessage = error.message;
        } else if (error.code === 11000) {
            status = 409;
            errorCode = 'DUPLICATE_PROJECT';
            errorMessage = 'Ya existe un proyecto con ese nombre';
        } else if (error.message.includes('not found')) {
            status = 404;
            errorCode = 'NOT_FOUND';
            errorMessage = error.message;
        }
        
        const response = this._buildError(errorCode, errorMessage);
        
        if (process.env.NODE_ENV === 'development') {
            response.error.stack = error.stack;
            response.error.details = error.message;
        }
        
        res.status(status).json(response);
    }
}

// Singleton para reutilizar la instancia
export const proyectosController = new ProyectosController();