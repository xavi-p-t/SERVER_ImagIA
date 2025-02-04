const Users = require('../models/Usuaris'); // Modelo de usuario
// const jwt = require('jsonwebtoken'); // Para generar un token JWT
const api_token = "111qqqwwweee"

// Controlador para iniciar sesión
const loginUser = async (req, res) => {
    const { nickname, password } = req.body; // Puede ser email o nickname

    if (!nickname || !password) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'El correu electrònic, el sobrenom i la contrasenya són obligatoris.'
        });
    }

    try {
        // Buscar usuario por email o nickname
        const user = await Users.findOne({
            where: { nickname: nickname }
        }); 
        

        if (!user) {
            return res.status(404).json({
                status: 'ERROR',
                message: 'Usuari no trobat.'
            });
        }

        // Verificar la contraseña

        if (!(password == user.password)) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'Contrasenya incorrecta.',
                user: user.toJSON()

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
            api_token
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
    const { token } = req.body; // Puede ser email o nickname

    if (api_token != token) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'El token es invalid'
        });
    }
    res.status(200).json({
        status: 'OK',
        message: 'Inici de sessió correcte.',
        api_token
    });
};


module.exports = {
    loginUser,
    verifyToken
};
