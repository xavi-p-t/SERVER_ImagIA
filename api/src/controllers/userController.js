// controllers/usersController.js
const Users = require('../models/Usuaris'); // Modelo de usuario, asegúrate de tenerlo configurado
const uuid = require('uuid'); // Para generar un ID único de usuario


// Controlador para registrar un usuario
const registerUser = async (req, res) => {

    const { telefon, nickname, email, password } = req.body; // Obtener los parámetros del cuerpo de la solicitud
     const codi_validacio = "0000";

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

         
        // Guardar log de la petición en la bbdd
        try {
            const logData = {
                tag: 'REGISTRAR',
                peticio_id: uuid.v4(), 
                usuari_id: newUser.id,  
                ip: req.ip,
                metodo_http: 'GET',
                status: 200,
                mensaje: 'Peticion a la API de registro de usuario'
            };
    
            await logger.logToDatabase(logData);
    
            console.log('Log guardado correctamente en la base de datos.');
        } catch (error) {
            logger.error('Error en el endpoint /test-log', { error });
            console.log('Ocurrió un error al guardar el log.');
        }
        

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


const validateUser =  async(req, res) => {

    const { codi } = req.body;

    if ( codi === process.env.SMS_CODE){
        res.status(200).json({
            status: 'OK',
            message: "L'usuari validart correctament",
            data: {
                api_key:   process.env.SMS_API_TOKEN
            }
        });
    } else {
        return res.status(400).json({
            status: 'ERROR',
            message: 'Codi incorrecte'
        });
    }
}

module.exports = {
    registerUser, 
    validateUser
};
