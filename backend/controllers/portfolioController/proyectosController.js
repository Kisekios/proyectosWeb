

export const proyectosController = {

    proyecto: async (req, res) => {
        res.json({ruta: 'proyecto'})
    },

    proyectos: async (req, res) => {
        res.json({ruta: 'proyectos'})
    },

    crear: async (req, res) => {
        res.json({ruta: 'crear'})
    },

    editar: async (req, res) => {
        res.json({ruta: 'editar proyecto'})
    },

    borrar: async (req, res) => {
        res.json({ruta: 'borrar proyecto'})
    }
}