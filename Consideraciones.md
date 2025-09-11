# BACKEND

- archivo que compruebe todas las variables esten ok, preferiblemente en la carpeta config (init) ✅
- toda conexion con DB debe estar en el dbClient.js y en caso de solicitar informacion debe ser tomada de esta.✅
- al instanciar la class dbclient para las 2 db (proyectos,destinos), debe tener conexion y desconexion independiente, que pueda desconectar una base de datos y la otra siga operativa. ✅
- El arranque/cierre del servidor debe intentar iniciar/cerrar las DB que esten disponibles ✅
- En el momento de presionar "ctrl+c" se cierra el servidor pero no se esta ejecutando el procedimiento de cierre correctamente, estan los 2 await para cerrar la conexion con las bases de datos y no se terminan de ejecutar o por lo menos de mostrar el mensaje cuando el servidor ya se cerro. ✅ (se establecio comandos para abrir/cerrar las conexiones de las bases de datos y cierre del servidor).
-