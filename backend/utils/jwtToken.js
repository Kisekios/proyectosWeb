import jwt from 'jsonwebtoken';
import 'dotenv/config'

// jwtToken.js
export const generateToken = (user) => {
    const payload = {
        email: user.email,  // Usamos email como identificador principal
        iss: process.env.JWT_ISSUER,
        aud: process.env.JWT_AUDIENCE
    };
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '1h',
        algorithm: 'HS256'
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE
    });
};