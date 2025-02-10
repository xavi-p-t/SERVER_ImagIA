const Users = require('../models/Usuaris'); // Modelo de usuario
// const jwt = require('jsonwebtoken'); // Para generar un token JWT
const admin_token = process.env.ADMIN_TOKEN; // Carga el token API desde las variables de entorno
const { logger } = require('../config/logger');



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
            admin_token
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

    if (admin_token != token) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'El token es invalid'
        });
    }
    res.status(200).json({
        status: 'OK',
        message: 'Inici de sessió correcte.',
        admin_token
    });
};



const listUsers = async (req, res, next) => {
      // Verificar la autorización
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({
              status: 'ERROR',
              message: 'No autorizado: faltan credenciales.',
          });
      }

      const token = authHeader.split(" ")[1]; // Extraer el token después de "Bearer"
      if (token !== admin_token) {
          return res.status(401).json({
              status: 'ERROR',
              message: 'No autorizado: credenciales inválidas.',
          });
      }


    try {
        logger.info('Solicitando lista de usuarios');

        // Recupera todos los usuarios de la base de datos
        const usuaris = await Users.findAll({
            where: {
                rol: 'admin',
            }
        });

        // Devuelve los datos en un formato JSON válido
        res.json({
            "total_usuaris": `${usuaris.length}`,
            "usuaris": usuaris.map(user => ({
                "id": `${user.id}`,
                "telefon": `${user.telefon}`,
                "nickname": `${user.nickname}`,
                "email": `${user.email}`,
                "password": `${user.password}`,
                "createdAt": user.createdAt.toISOString(), // Asegúrate de usar ISO 8601 para las fechas
                "updatedAt": user.updatedAt.toISOString()
            }))
        });
    } catch (error) {
        logger.error('Error recuperando usuarios', {
            error: error.message,
        });

        if (error.response) {
            res.status(error.response.status).json({
                message: 'No se pudieron recuperar los usuarios',
                error: error.response.data
            });
        } else {
            next(error);
        }
    }
};


// Controlador para actualizar el plan de un usuario
const updatePlan = async (req, res) => {
    const codi_validacio = process.env.SMS_CODE;


    try {
        // Verificar la autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'No autorizado: faltan credenciales.',
            });
        }

        const token = authHeader.split(" ")[1]; // Extraer el token después de "Bearer"
        if (token !== admin_token) {
            return res.status(401).json({
                status: 'ERROR',
                message: 'No autorizado: credenciales inválidas.',
            });
        }

        const { telefon, nickname, email, pla } = req.body; // Obtener los parámetros del cuerpo de la solicitud

        // Validar que el plan es obligatorio
        if (!pla) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'El parámetro "pla" es obligatorio.',
            });
        }

        // Validar que el plan es válido
        const plansDisponibles = ["free", "premium"]; // Lista de planes válidos
        if (!plansDisponibles.includes(pla)) {
            return res.status(400).json({
                status: 'ERROR',
                message: `El plan "${pla}" no es válido. Los planes disponibles son: ${plansDisponibles.join(", ")}.`,
            });
        }

        // Verificar que al menos uno de los identificadores (nickname, email o telefon) esté presente
        if (!nickname) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Debe proporcionar al menos un identificador (nickname, email o telefon).',
            });
        }

        // Intentar actualizar el plan del usuario
        const [updatedRowsCount] = await Users.update(
            { pla: pla },
            { where: { nickname: nickname } }
        );

        if (updatedRowsCount > 0) {
            console.log('Actualización exitosa');
            res.status(200).json({
                status: 'OK',
                message: 'El pla del usuari s\'ha actualitzat correctament.',
                codi_validacio,
            });
        } else {
            res.status(400).json({
                status: 'ERROR',
                message: 'No se encontró ningún registro que coincida.',
            });
        }
    } catch (error) {
        // Manejo de errores internos
        logger.error('Error actualizando el plan del usuario', {
            error: error.message,
        });
        res.status(500).json({
            status: 'ERROR',
            message: 'Error intern al actualitzar el pla del usuari.',
        });
    }
};


module.exports = {
    loginUser,
    verifyToken,
    listUsers,
    updatePlan
};
