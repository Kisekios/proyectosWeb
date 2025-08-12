

export const internacionalesController = {

    destino: async (req, res) => {
        res.json({ruta: 'destino'})
    },

    destinos: async (req, res) => {
        res.json({ruta: 'destinos'})
    },
    
    populares: async (req, res) => {
        res.json({ruta: 'populares'})
    },

    crear: async (req, res) => {
        res.json({ruta: 'crear'})
    },

    editar: async (req, res) => {
        res.json({ruta: 'editar destino'})
    },

    borrar: async (req, res) => {
        res.json({ruta: 'borrar destino'})
    }
}