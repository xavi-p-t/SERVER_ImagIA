const Users = require('../models/Usuaris'); // Modelo de usuario
// const jwt = require('jsonwebtoken'); // Para generar un token JWT
const token = "111qqqwwweee"

// Controlador para iniciar sesión
const loginUser = async (req, res) => {
    const { identifier, password } = req.body; // Puede ser email o nickname

    if (!identifier || !password) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'El correu electrònic, el sobrenom i la contrasenya són obligatoris.'
        });
    }

    try {
        // Buscar usuario por email o nickname
        const user = await Users.findOne({
            where: {
                [Op.or]: [
                    { email: identifier },
                    { nickname: identifier }
                ]
            }
        });

        if (!user) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Usuari no trobat.'
            });
        }

        // Verificar la contraseña
        
        if (!(password.equals == user.password)) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'Contrasenya incorrecta.'
            });
        }
        
        
        // // Generar un token JWT
        // const token = jwt.sign(
        //     { id: user.id, email: user.email },
        //     process.env.JWT_SECRET,
        //     //{ expiresIn: '1h' }
        // );

        res.status(200).json({
            status: 'OK',
            message: 'Inici de sessió correcte.',
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error intern al iniciar sessió.'
        });
    }
};

const verifyToken = async (req, res) => {
    const { adminToken } = req.body; // Puede ser email o nickname

    if (token != adminToken) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'El token es invalid'
        });
    }
        res.status(200).json({
            status: 'OK',
            message: 'Inici de sessió correcte.',
            token
        });
};


module.exports = {
    loginUser,
    verifyToken
};
