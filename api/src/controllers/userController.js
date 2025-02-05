// controllers/usersController.js
const Users = require('../models/Usuaris'); // Modelo de usuario, asegúrate de tenerlo configurado
const uuid = require('uuid'); // Para generar un ID único de usuario

// Controlador para registrar un usuario
const registerUser = async (req, res) => {
    const { telefon, nickname, email, password } = req.body; // Obtener los parámetros del cuerpo de la solicitud

    // Validación básica
    if (!telefon || !nickname || !email || !password) {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Tots els camps són obligatoris.'
        });
    }

    try {
        // Verificar si el email o el nickname ya existen
        const existingUser = await Users.findOne({ where: { email } });

        if (existingUser) {
            return res.status(400).json({
                status: 'ERROR',
                message: 'Aquest correu electrònic ja està registrat.'
            });
        }

        // Crear un nuevo usuario
        const newUser = await Users.create({
            id: uuid.v4(), // Generar un ID único
            telefon,
            nickname,
            email,
            password
        });

        // Devolver la respuesta con los datos del usuario creado
        res.status(200).json({
            status: 'OK',
            message: "L'usuari s'ha creat correctament",
            data: {
                id: newUser.id,
                telefon: newUser.telefon,
                nickname: newUser.nickname,
                email: newUser.email,
                password: newUser.password
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: 'ERROR',
            message: 'Error intern al crear l\'usuari.'
        });
    }
};

module.exports = {
    registerUser
};
