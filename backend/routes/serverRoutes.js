import compression from 'compression';
import express from 'express'
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors'
import morgan from 'morgan'

import ClustersOnline from '../config/dbClient.js'
import { initDatabasesClusterOne } from '../index.js'

import usuariosRutas from './portfolioRutas/usuariosRutas.js'
import proyectosRutas from './portfolioRutas/proyectosRutas.js'
import nacionalesRutas from './destinosRutas/nacionalesRutas.js'
import internacionalesRutas from './destinosRutas/internacionalesRutas.js'

const app = express()

app.use(express.json());

const setupMiddlewaresAPI = () => {
    app.use(helmet())
    app.use(compression())
    app.use(express.json({ limit: '10kb' }))
    app.use(express.urlencoded({ extended: true }))
    app.use(cors({
        origin: process.env.ALLOWED_ORIGINS,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeadres: ['Content-Type', 'Authorization'],
        credentials: true
    }))

    app.use(rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: '⚠️ Demasiadas req desde esta IP'
    }))

    if (process.env.NODE_ENV === 'desarrollo') {
        app.use(morgan('dev'))
        console.log('\n🛠️ Morgan habilitada (modo desarrollo)')
    }
}

const setupRoutesAPI = () => {
    app.get('/check', async (req, res) => {
        await initDatabasesClusterOne()
        res.json({
            status: 'OK',
            entorno: process.env.NODE_ENV
        })
    })

    app.get('/clusters-operativos', (req, res) => {
        const clusterNames = ClustersOnline.getClustersConnections(); // Array de nombres de clusters

        const clustersInfo = {};

        for (const clusterName of clusterNames) {
            const dbs = ClustersOnline.getDatabases(`${clusterName}_`);
            const dbInfo = {};

            for (const dbName of dbs) {
                const collections = ClustersOnline.getCollections(`${dbName}_`);
                dbInfo[dbName] = collections; // Ejemplo: "db1": ["users", "products"]
            }

            clustersInfo[clusterName] = {
                nombre: clusterName,
                dbs: dbInfo
            };
        }

        res.json({ clusters: clustersInfo });
    })

    app.use('/api/portfolio/usuarios', usuariosRutas)
    app.use('/api/portfolio/proyectos', proyectosRutas)
    app.use('/api/destinos/nacionales', nacionalesRutas)
    app.use('/api/destinos/internacionales', internacionalesRutas)
}


export const startServer = () => {
    try {
        const PORT = process.env.PORT
        app.listen(PORT, () => {
            console.log(`
✅ Servidor Operativo en http://localhost:${PORT}
    
    • Endpoints disponibles:
        - GET /portfolio
        - GET /destinos`)

            setupMiddlewaresAPI()
            setupRoutesAPI()
        })
    } catch (error) {
        throw new Error("Error iniciando servidor: " + error);
    }
}