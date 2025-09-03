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
    │   │   └── destinosController.js
    │   └── portfolioController/
    │       ├── proyectosController.js
    │       └── usuariosController.js
    │
    ├── middlewares/          # Middlewares personalizados
    │   ├── authMiddleware.js     # Validación de token y autorización
    │   ├── queryParams.js        # req.query permitidos y bloqueo de query params.
    │   └── rateLimiterAPI.js     # maximo de peticiones solicitadas por una ip
    │
    ├── models/               # Acceso a datos y operaciones sobre MongoDB
    │   ├── destinosModels/
    │   │   └── destinosModels.js
    │   └── portfolioModels/
    │       ├── proyectosModels.js
    │       └── usuariosModels.js
    │
    ├── routes/               # Definición de rutas de la API
    │   ├── serverRoutes.js       # Rutas principales del servidor, /check, /clusters-operativos
    │   ├── destinosRutas/
    │   │   └── destinosRutas.js
    │   └── portfolioRutas/
    │       ├── proyectosRutas.js
    │       └── usuariosRutas.js
    │
    ├── schems/               # Validación de datos con Joi
    │   ├── destinosSchems/
    │   │   └── destinosSchem.js
    │   └── portoflioschems/
    │       ├── proyectosschem.js
    │       └── usuariosSchem.js
    │
    └── utils/                # Utilidades generales
        ├── fecha.js                # Formateo de fechas
        ├── indicesMongodb.js       # Creación de índices en MongoDB
        ├── jwtToken.js             # Generación y validación de JWT
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
    ├─> /check
    ├─> /clusters-activos
    ├─> /api/usuarios { checkLimiter: 10 }
    │   ├─> /ingresar
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   └── .controller.ingresar
    │   │       ├── » envia req.body a loginSchema.validate() ─> « retorna { email, clave}; ⚠️ campos invalidos son limpiados; ❌ res.error por datos incoherente .
    │   │       ├── » envia email a usuariosModel.getByEmail() ─> « retorna { nombre, clave , lockedUntil, loginAttempts}; ⚠️ res.error por usuarios no encontrado.
    │   │       ├── → revisa lockedUntil; ⚠️ res.status(400) "cuenta bloqueada".
    │   │       ├── → compara req.clave con usuario.clave del model ─> usuariosModel.resetLoginAttempts si ingresa; ❌ fallo en clave » usuariosModel.incrementLoginAttempts() ─> « res intentos faltantes; ⚠️ si loginAttempts = maxAttemps bloquea la cuenta.
    │   │       ├── » envia generateToken(usuario) agrega el iss y aud al token.
    │   │       └── « res.status(200) usuario y token.
    │   ├─> /perfiles
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.perfiles
    │   │       ├── » solicita usuariosModel.getAll() ─> « retorna los usuarios sin { clave, _id, updatedAt }.
    │   │       └── « res.status(200) lista de usuarios.
    │   ├─> /registrarse
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.registrarse
    │   │       ├── ⚠️ validacion req.body; ⚠️ Validacion de req.body.rol : solo se permite el rol de "editor".
    │   │       ├── » envia req.body a usuariosSchema.validate(required [nombre, email, telefono, clave], default [rol: editor, loginAttempts, lockedUntil, lastAttempts]); ⚠️ datos no establecidos en schema son eliminados.
    │   │       ├── » envia {email, nombre}  usuariosModel.getOneByNameEmail(email, nombre); ⚠️ en caso de recibir {email || nombre} de la db res.(400) "Usuario/email ya existe".
    │   │       ├── → encripta la clave bcrypt
    │   │       ├── » envia los datos a usuariosModel.create() + createdAt y updatedAt.
    │   │       └── « res.status(200) { nombre, email }.
    │   ├─> /delete/:email
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── sanitizarParams
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.borrar
    │   │       ├── » envia { email } a deleteSchema.validate(); ⚠️ los demas datos en req.body son descartados.
    │   │       ├── » envia { email } a usuariosModel.delete(); ❌ Si no se encuentra el email (deletedCount === 0) en la db ─> res.status(404) "Usuario no encontrado".
    │   │       └── « res.status(200) "Usuario eliminado" + { email }.
    │   ├─> /set-items
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.setItems
    │   │       ├── » envia usuariosModel.resetIntentos() ─> updateMany() ─> setea todos los usuarios ['loginAttempts', 'lastAttempts', 'lockedUntil']
    │   │       └── « res.status(200) modifiedCount.
    │   └─> /editar-perfil
    │       ├── bloqReqParams
    │       ├── bloqReqQuery
    │       ├── authMiddleware(['admin', 'editor'])
    │       └── .controller.editar
    │           ├── → separa { email, ...data }; ⚠️ el email es obligatorio ; 
    │           ├── » envia { ...data } a usuariosUpdateSchema.validate() para validar datos; ⚠️ Solo permite cambios en [ nombre, email, clave ], los demas datos son descartados; ❌ si envia datos no validos en el schem res.status(400).
    │           ├── → si la clave es enviada la hashea con bcrypt.
    │           ├── » envia { email, ...data, fechaUpdatedAt } usuariosModel.update(); ❌ « .matchedCount === 0 res.status(400).
    │           └── » res.status(200) "Usuario actualizado" + userChanges.
    │   
    ├─> /api/proyectos { checkLimiter: 15 }
    │   ├─> /
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   └── .controller.proyectos
    │   │       │   # ✅ » res.status(200).json(proyectos).
    │   │       │   # ❌ » res.status(500).json({ error })
    │   │       ├── » solicita los proyectos a proyectosModel.getAll(); ⚠️ sanitiza los datos con mongodb.
    │   │       └── » res.status(200).
    │   ├─> /crear
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.crear
    │   │       │   # ⚠️ → se requieren datos del proyecto segun el proyectosSchema del req.body.
    │   │       │   # ✅ » res.status(201).json({ exito, id , nombre})
    │   │       │   # ❌ » res.status(500) / res.status(400) no cumple el schem o si el nombre y titulo ya existe.
    │   │       ├── → valida req.body ─> » envia proyectosSchema.validate(req.body); ⚠️ sanitiza los campos no requeridos; ❌ « no cumple los required res.status(400).
    │   │       ├── » envia { nombre, titulo } a proyectosModel.checkNameAndTitle(); ❌ « existencia de nombre o titulo res.status(400).
    │   │       ├── » envia { value } del schema a proyectosModel.create().
    │   │       └── » res.status(201).
    │   ├─> /:proyecto
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── sanitizarParams
    │   │   └── .controller.proyecto
    │   │       │   # ⚠️ → requerido el proyecto del req.params
    │   │       │   # ✅ » res.status(200).json(proyecto).
    │   │       │   # ❌ » res.status(500).json({ error })
    │   │       ├── → { id } de req.params; ⚠️ { id } puede ser un id_mongodb o el nombre del proyecto; ❌ no id res.status(400).
    │   │       ├── » envia { id } a proyectosModel.getOne(id); ⚠️ sanitiza los datos con mongodb; ❌ « res.status(200) si no encuentra el proyecto.
    │   │       └── » res.status(200)
    │   ├─> /editar/:proyecto
    │   │   ├── bloqReqQuery
    │   │   ├── sanitizarParams
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.editar
    │   │       │   # ⚠️ → requerido el proyecto del req.params + los cambios del req.body.
    │   │       │   # ✅ » res.status(200).json({ exito, cambios })
    │   │       │   # ❌ » res.status(500) / res.status(400) datos no validos o proyecto no encontrado.
    │   │       ├── → { id } de req.params y { ...cambios } de req.body; ⚠️ { id } puede ser un id_mongodb o el nombre del proyecto; ❌ no id res.status(400).
    │   │       ├── » envia { ...cambios } a proyectosUpdateSchema(); ⚠️ minimo 1 dato; ❌ res.status(400) si no cumple el schem.
    │   │       ├── » envia a proyectosModel.update(id, {...cambios, fechaUpdated} ) ; « res.status (404) si matchedCount = 0
    │   │       └── » res.status(200)
    │   └─> /delete/:proyecto
    │       ├── bloqReqQuery
    │       ├── bloqReqBody
    │       ├── sanitizarParams
    │       ├── authMiddleware(['admin'])
    │       └── .controller.borrar
    │           │   # ⚠️ → requerido el proyecto del req.params.
    │           │   # ✅ » res.status(200).json({ exito })
    │           │   # ❌ » res.status(500) / res.status(404) proyecto no encontrado.
    │           ├── { proyecto } de req.params; ❌ no proyecto ─> res.status(400).
    │           ├── » envia { proyecto } a proyectosModel.delete(); ❌ si deletedCount = 0 res.status(400) proyecto no encontrado.
    │           └── » res.status(200).
    │
    ├─> /api/destinos { checkLimiter: 100 }
    │   ├─> /:destino
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── sanitizarParams
    │   │   └── .controller.infoDestino
    │   │       │   # ⚠️ → requiere { destino } del req.params.
    │   │       │   # ✅ » res.status(200).json({destino})
    │   │       │   # ❌ » res.status(500) / res.status(400) destino no encontrado
    │   │       ├── → { destino } de req.params » destinosModel.getOne(destino) ; ⚠️ valida en las dos colecciones de la db; ❌ no resultado res.status(400)
    │   │       └── » res.status(200)
    │   ├─> /destacados?tipo=query
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqBody
    │   │   ├── sanitizarQuerys
    │   │   └── .controller.destacados
    │   │       │   # ⚠️ → requiere {nacionales, internacionales, home} de query params tipo
    │   │       │   # ✅ » res.status(200).json({tipo, cantidad, destacados nac/int/home})
    │   │       │   # ❌ » res.status(500) / res.status(400) querys params no validos.
    │   │       ├── → { tipo } de req.validatedQuery ─> destinosModel.getFeatured(tipo) ─> « destacados; ⚠️ solo datos permitidos en el sanitizarQuerys; ❌ no tipo / no destacados o === 0 ─> res.status(400) .
    │   │       ├── « recibe destacados [ home, nacional, internacional] = true; ⚠️ solo parametros validos.
    │   │       └── » res.status(200)
    │   ├─> /catalogo/:destinos {nacionales, internacionales}
    │   │   ├── bloqReqQuery
    │   │   ├── bloqReqBody
    │   │   ├── sanitizarParams
    │   │   └── .controller.allDestinosNI
    │   │       │   # ⚠️ → requiere destinos {nacionales, internacionales} de req.params.
    │   │       │   # ✅ » res.status(200).json({tipo, cantidad, catalogo nac/inter})
    │   │       │   # ❌ » res.status(500) / res.status(400) query params no valido / no se encontraron destinos.
    │   │       ├── → { destinos } de req.params ─> destinosModel.getList(destinos) ─> « catalogo; ⚠️ solo { nacionales, internacionales } es valido; ❌ catalogo <=0 res.status(400)
    │   │       └── » res.status(200)
    │   ├─> /nuevo
    │   │   ├── bloqReqParams
    │   │   ├── bloqReqQuery
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.crearDestino
    │   │       │   # ⚠️ → requiere { destino } de req.body → se valida con newDestinoSchem (joi).
    │   │       │   # ✅ » res.status(200).json({exito, nombreDestino})
    │   │       │   # ❌ » res.status(500) / res.status(400) nombreDestino ya existe, datos de req.body incompletos o no validos.
    │   │       ├── 
    │   │       ├── 
    │   │       └── 
    │   ├─> /editar/:id
    │   │   ├── bloqReqQuery
    │   │   ├── sanitizarParams
    │   │   ├── authMiddleware(['admin'])
    │   │   └── .controller.editarDestino
    │   │       │   # ⚠️ → requiere { destino } de req.params, { datos } de req.body → se valida con destinoUpdateSchem.
    │   │       │   # ✅ » res.status(200).json({exito, cambio})
    │   │       │   # ❌ » res.status(500) / res.status(400) destino no encontrado, datos de req.body no validos.
    │   │       ├── 
    │   │       ├── 
    │   │       └── 
    │   └─> /delete/:id
    │       ├── bloqReqQuery
    │       ├── bloqReqBody
    │       ├── sanitizarParams
    │       ├── authMiddleware(['admin'])
    │       └── .controller.borrarDestino
    │           │   # ⚠️ → requiere { destino } de req.params.
    │           │   # ✅ » res.status(200).json({exito, nombreDestinoDel})
    │           │   # ❌ » res.status(500) / res.status(400) destino no encontrado.
    │           ├── 
    │           ├── 
    │           └── 