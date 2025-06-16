import { generarToken } from '../helpers/autentificacion.js'
import usuarioModel from '../models/usuariosModelo.js'
import bcrypt from 'bcrypt'

class usuariosController {
  constructor() {

  }

  async registrarse(req, res) {
    try {
      const { email, nombre, telefono, clave } = req.body
      const usuaroExiste = await usuarioModel.getOneByEmail({ email })
      if (usuaroExiste) {
        return res.status(400).json({ error: "El usuario ya existe" })
      }

      const claveEncriptada = await bcrypt.hash(clave, 10)

      const data = await usuarioModel.create({
        nombre,
        email,
        telefono,
        clave: claveEncriptada
      })
      res.status(201).json(data)
    } catch (error) {
      console.log(error)
      res.status(500).send(error)
    }

  }

  async login(req, res) {
    const { email, clave } = req.body
    const usuaroExiste = await usuarioModel.getOneByEmail({ email })
    if (!usuaroExiste) {
      return res.status(400).json({ error: "El usuario no existe" })
    }

    const claveValida = await bcrypt.compare(clave, usuaroExiste.clave)

    if(!claveValida) {
      return res.status(400).json({ error: "Clave incorrecta" })
    }

    const token = generarToken(email)

    return res.status(200).json({msg: "Usuario Autenticado", token})
  }
}

export default new usuariosController()