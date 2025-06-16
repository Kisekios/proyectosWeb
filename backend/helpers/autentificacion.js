import jsonwebtoken from 'jsonwebtoken'
import 'dotenv/config'

export function generarToken(email) {
    return jsonwebtoken.sign({ email }, process.env.JWT_SEC, { expiresIn: '1h' })
}

export function verificarToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    if (!token) {
        return res.status(401).json({ error: 'Token requerido' })
    }

    try {
        const dataToken = jsonwebtoken.verify(token, process.env.JWT_SEC)
        next()
    } catch (error) {
        res.status(401).json({ error: 'Token no valido' })
    }
}