import express from 'express'

const app = express()

app.use(express.json());

export const startServer = () => {
    try {
        const PORT = process.env.PORT
        app.listen(PORT, () => {
            console.log(`
✅ Servidor Operativo en http://localhost:${PORT}
    
    • Endpoints disponibles:
        - GET /portfolio/projec
        - GET /destinos/places`)
        })
    } catch (error) {
        throw new Error("Error iniciando servidor: " + error);
    }
}