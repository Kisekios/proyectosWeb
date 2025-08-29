import compression from 'compression';
import express from 'express'
import helmet from 'helmet';
import cors from 'cors'
import morgan from 'morgan'

import ClustersOnline from '../config/dbClient.js'
import { initDatabasesClusterOne } from '../index.js'
import { checkTransactionsOn } from '../utils/transaccionesMongoDb.js'
import { bloqReqQuery, bloqReqBody, bloqReqParams, sanitizarParams } from '../middlewares/queryParams.js'
import { authMiddleware } from '../middlewares/authMiddleware.js'


import usuariosRutas from './portfolioRutas/usuariosRutas.js'
import proyectosRutas from './portfolioRutas/proyectosRutas.js'
import destinosRutas from './destinosRutas/destinosRutas.js'

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
}

const setupRoutesAPI = () => {

    // rutas de chequeo

    app.get('/acciones-clusters-conexion/:id',
        bloqReqQuery,// necesito un nuevo sanitizador de req.query en esta ruta ya que requiero acciones sobre cluster,db o colleciones.
        bloqReqBody,
        sanitizarParams,
        authMiddleware(['admin']),
        accionesClusterConexion
    )
    app.get('/clusters-operativos',
        bloqReqQuery,
        bloqReqBody,
        bloqReqParams,
        authMiddleware(['admin']),
        checkClusters
    )

    //Rutas a bases de datos

    app.use('/api/portfolio/usuarios', usuariosRutas)
    app.use('/api/portfolio/proyectos', proyectosRutas)
    app.use('/api/destinos/', destinosRutas)
}

const accionesClusterConexion = async (req, res) => {
    try {

        res.json({
            status: 'OK',
        })

    } catch (error) {
        res.status(400).json({ msg: 'Error al establecer conexion con el cluster', detalles: error })
    }
}

const checkClusters = (req, res) => {
    const clusterNames = ClustersOnline.getDataOf('clusters'); // Array de nombres de clusters

    const clustersInfo = {};

    for (const clusterName of clusterNames) {
        const dbs = ClustersOnline.getDataOf('databases', `${clusterName}`);
        const dbInfo = {};

        for (const dbName of dbs) {
            const collections = ClustersOnline.getDataOf('collections', `${dbName}`);
            dbInfo[dbName] = collections; // Ejemplo: "db1": ["users", "products"]
        }

        clustersInfo[clusterName] = {
            nombre: clusterName,
            dbs: dbInfo
        };
    }

    res.json({ clusters: clustersInfo });
}

export const startServer = async () => {
    try {
        const PORT = process.env.PORT
        app.listen(PORT, () => {
            console.log(`✅ Servidor Operativo en http://localhost:${PORT}`)
        })
        setupMiddlewaresAPI()
        setupRoutesAPI()
        // la app se cerrara mientras no tenga internet

        setTimeout(async () => {
            await initDatabasesClusterOne()
            if (process.env.NODE_ENV === 'desarrollo') {
                app.use(morgan('dev'))
                console.log('\n🛠️ Morgan habilitada (modo desarrollo)')
                checkTransactionsOn(ClustersOnline.getDataOf('clusters', '', 'values'))
            }
        }, 3000);


    } catch (error) {
        throw new Error("Error iniciando servidor: " + error);
    }
}