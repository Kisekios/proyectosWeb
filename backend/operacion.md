1. Descripción General del Proyecto Backend

    
    Este backend está diseñado como una arquitectura modular y escalable para administrar múltiples proyectos a través de una API REST construida con Express.js. Su núcleo se basa en la conexión dinámica a uno o varios clusters de MongoDB, permitiendo el acceso seguro y eficiente a sus bases de datos y colecciones.
    
    🎯 Funcionalidades Principales
    
            Gestión de usuarios

                Registro, autenticación, edición de perfil y eliminación, con validación de datos mediante Joi y autenticación JWT.

            Administración de proyectos

                Interfaces para crear, editar y consultar proyectos asociados a usuarios.

            Catálogo de destinos

                Rutas para destinos nacionales e internacionales, integradas como parte de un proyecto de una agencia de viajes.
    
    🛠️ Características Técnicas
    
        Conexión flexible a MongoDB

            Soporte para múltiples clusters (MongoDB Atlas).

        Configuración multi-entorno

            Carga automática de variables desde .env.dev o .env.prod, con validación previa al arranque del servidor.

        Middlewares de seguridad

            Uso de helmet, compression, cors, rateLimit, y parsers de Express para proteger y optimizar la API.

        Validación robusta de datos

            Esquemas Joi para asegurar la integridad de los datos enviados a la base de datos.

        Autenticación y autorización

            Middleware personalizado que valida tokens JWT y restringe el acceso según el rol del usuario.

        Soporte para transacciones

            Diagnóstico de clusters habilitados para operaciones multi-documento.

        Rutas de diagnóstico y monitoreo

            Endpoints como /check y /clusters-operativos permiten verificar el estado de conexión, transacciones y disponibilidad de colecciones en tiempo real.


============================================================================================================================================


2. Estructura del Proyecto

    backend/
    ├── .env                  # Variables de entorno base
    ├── .env.dev              # Configuración para entorno de desarrollo
    ├── .env.prod             # Configuración para entorno de producción
    ├── .gitignore            # Archivos y carpetas ignoradas por Git
    ├── index.js              # Carga de entorno, conexion a MongoDB, exportacion db
    ├── operacion.md          # Documentación del flujo de ejecución
    ├── package.json          # Dependencias y scripts del proyecto
    ├── package-lock.json     # Registro exacto de versiones instaladas
    ├── pendientes.md         # Lista de tareas pendientes
    │
    ├── clusters/             # Configuración y lógica de conexión a clusters MongoDB
    │   ├── clusters.json         # Definición de clusters disponibles
    │   └── portfolioCluster.js   # Inicialización del cluster portfolio
    │
    ├── config/               # Configuración general del servidor
    │   ├── dbClient.js          # Cliente MongoDB con patrón singleton
    │   ├── env.js               # Carga el archivo .env (ENTORNO) para cargar archivo .env.*
    │   └── initServer.js        # Validacion de las variables del archivo .env.*
    │
    ├── controllers/          # Lógica de negocio para cada módulo
    │   ├── destinosControllers/
    │   │   ├── internacionalesController.js
    │   │   └── nacionalesController.js
    │   └── portfolioController/
    │       ├── proyectosController.js
    │       └── usuariosController.js
    │
    ├── middlewares/          # Middlewares personalizados
    │   └── authMiddleware.js     # Validación de token y autorización
    │   └── rateLimiterAPI.js
    │
    ├── models/               # Acceso a datos y operaciones sobre MongoDB
    │   ├── destinosModels/
    │   │   ├── internacionalesModels.js
    │   │   └── nacionalesModels.js
    │   └── portfolioModels/
    │       ├── proyectosModels.js
    │       └── usuariosModels.js
    │
    ├── routes/               # Definición de rutas de la API
    │   ├── serverRoutes.js       # Rutas principales del servidor, /check, /clusters-operativos
    │   ├── destinosRutas/
    │   │   ├── internacionalesRutas.js
    │   │   └── nacionalesRutas.js
    │   └── portfolioRutas/
    │       ├── proyectosRutas.js
    │       └── usuariosRutas.js
    │
    ├── schems/               # Validación de datos con Joi
    │   ├── destinosSchems/
    │   │   ├── internacionalesSchem.js
    │   │   └── nacionalesSchem.js
    │   └── portoflioschems/
    │       ├── proyectosschem.js
    │       └── usuariosSchem.js
    │
    └── utils/                # Utilidades generales
        ├── fecha.js              # Formateo de fechas
        ├── indicesMongodb.js     # Creación de índices en MongoDB
        ├── jwtToken.js           # Generación y validación de JWT
        └── transaccionesMongoDb.js # Diagnóstico de transacciones con MongoDB


============================================================================================================================================


3. Flujo de Inicialización

    Secuencia de Arranque

            Carga de Entorno:

                index.js → Importa env.js

                Selecciona .env.dev o .env.prod según ENTORNO de .env

                Valida variables obligatorias con validateEnv()

                    Usa un esquema(Joi) para validar las variables obligatorias.

                    Si la validación es exitosa, ejecuta startServer() desde routes/server.js.


            Inicio del Servidor:

                Ejecuta startServer() (initServer.js)

                Se activa setupMiddlewaresAPI():
                    
                    helmet, compression, express.json, express.urlencoded, cors, rateLimit.


                Se ejecuta setupRoutesAPI():

                    Rutas de portfolio: usuarios, proyectos.

                    Rutas de destinos: nacionales, internacionales.

                    Rutas de diagnóstico:

                        /check: inicializa initDatabasesClusterOne(index.js) y ejecuta checkTransactionsOn() para verificar soporte de transacciones.

                        /clusters-operativos: retorna un objeto con clusters, bases de datos y colecciones activas.


            Inicialización de Clúster: initDatabasesClusterOne()

                
                Inicializa initPortfolioCluster()
                
                    Separa db1 y db2 del cluster portfolio.

                    Crea índices en la colección de usuarios.
                
                Ejecución de initPortfolioCluster()
                
                    Lee clusters.json y selecciona el cluster según .env.*.

                    Usa dbClient.js para conectar con MongoDB:
                
                        connectToCluster(clusterName, URI):
                
                            Verifica si el cluster ya está conectado.
                            
                            Conecta con MongoClient y guarda en this.clients.
                
                Obtención de bases de datos
                
                    getDB(clusterName, dbName):

                        Valida existencia del cluster.

                        Obtiene y guarda las bases en this.dbs.

                        Retorna la cacheKey.
                
                Verificación de conexión
                
                    Se realiza un ping: 1.

                    Se retornan las bases conectadas a index.js para su exportacion.

            Exportación de Bases de Datos

                Las bases db1 y db2 del clusterOne se exportan para ser utilizadas en los models.


            Rutas de Usuarios
            
                ingresar
                    
                    Valida req.body con loginSchema (Joi): nombre, email, teléfono, clave.
                    
                    Verifica existencia del email con usuariosModel.getByEmail(email).
                    
                    Compara claves con bcrypt.
                    
                    Genera token con generateToken() usando email, proveedor y audiencia de .env.*.
                
                
                perfiles
                    
                    Usa authMiddleware:
                    
                    Valida token y email.
                    
                    Agrega req.user con email y nombre.
                    
                    Obtiene perfiles desde la colección usuarios (sin clave ni _id).
                
                
                registrarse
                    
                    Usa authMiddleware (solo el primer usuario puede registrar).
                    
                    Valida datos con Joi.
                    
                    Verifica duplicados con usuariosModel.getOneByNameEmail(email, nombre).
                    
                    Encripta clave y guarda con usuariosModel.create().
                
                
                editar-perfil
                    
                    Usa authMiddleware.
                    
                    Verifica existencia por email.
                    
                    Valida datos con usuariosUpdateSchema (Joi).
                    
                    Hashea clave y actualiza con usuariosModel.update().
                
                
                delete
                    
                    Usa authMiddleware.
                    
                    Valida email con deleteSchema (Joi).
                    
                    Elimina usuario con usuariosModel.delete(email).


============================================================================================================================================


4. Seguridad
    
    El backend implementa múltiples capas de seguridad para proteger los datos, las rutas y el entorno de ejecución:
    
        🧭 Protección de Rutas

            Autenticación y autorización

                Todas las rutas sensibles están protegidas mediante authMiddleware, que valida tokens JWT y verifica la identidad del usuario antes de permitir el acceso.

        📋 Validación de Datos

            Schemas Joi

                Cada entrada (req.body) es validada con esquemas definidos en Joi, asegurando que los datos cumplan con el formato esperado antes de interactuar con la base de datos.

        🛡️ Hardening del Servidor

            Helmet

                Configura cabeceras HTTP seguras para mitigar ataques comunes como XSS, clickjacking y sniffing.

            Rate Limiting

                express-rate-limit previene ataques de fuerza bruta y abuso de endpoints, limitando el número de solicitudes por IP.

            Compression

                Reduce el tamaño de las respuestas HTTP, mejorando el rendimiento y reduciendo la superficie de ataque.

            CORS

                Configurado para controlar el acceso entre dominios y proteger la API de solicitudes no autorizadas.

        🔑 Gestión de Secrets

            Variables sensibles en .env

                Claves JWT, URIs de conexión a MongoDB y configuraciones de entorno se gestionan mediante archivos .env, evitando exposición en el código fuente.

    


5. Flujo EndPoints

    Server.js
    ├── /check
    ├── /clusters-activos
    ├── /api/usuarios
    │   ├─ /ingresar
    │   │   ├── .controller
    │   │   │   ├── » envia req.body a loginSchema.validate() ─> « retorna { email, clave}; ⚠️ res.error por datos incoherente ❌ campos invalidos son limpiados.
    │   │   │   ├── » envia email a usuariosModel.getByEmail() ─> « retorna { nombre, clave , lockedUntil, loginAttempts}; ⚠️ res.error por usuarios no encontrado.
    │   │   │   ├── → revisa lockedUntil; ⚠️ res "cuenta bloqueada"
    │   │   │   ├── → compara la req.clave con usuario.clave del model ─> usuariosModel.resetLoginAttempts si ingresa; ❌ fallo en clave » usuariosModel.incrementLoginAttempts() ─> « res intentos faltantes; ⚠️ si loginAttempts = maxAttemps bloquea la cuenta.
    │   │   │   ├── » envia generateToken(usuario) agrega el iss y aud al token
    │   │   │   └── « res.status(200) 