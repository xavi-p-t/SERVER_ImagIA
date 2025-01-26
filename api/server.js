/**
 * Configuració principal del servidor Express
 * Aquest fitxer inicialitza tots els components necessaris per l'API
 */

// Carregar variables d'entorn
const dotenv = require('dotenv');
dotenv.config();

// Importacions principals
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./src/config/swagger');
const { sequelize } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const chatRoutes = require('./src/routes/chatRoutes');
const { logger, expressLogger } = require('./src/config/logger');
const imageRoutes = require('./src/routes/imageRoutes');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear instància d'Express
const app = express();

/**
 * Configuració dels middlewares principals
 * - CORS per permetre peticions des d'altres dominis
 * - Parser de JSON per processar el cos de les peticions
 */
app.use(cors());
app.use(express.json());

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage });


// Configuració de Swagger per la documentació de l'API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

/**
 * Middleware de logging personalitzat
 * Registra totes les peticions HTTP amb timestamp
 */
app.use((req, res, next) => {
    logger.info('Petició HTTP rebuda', {
        info: req.body,
        method: req.method,
        url: req.url,
        timestamp: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('user-agent')
    });

    //console.log(req);
    next();
});

// Configuració del logger d'Express per més detalls
app.use(expressLogger);

// Registre de les rutes principals
app.use('/api/chat', chatRoutes);




// // Registre de les rutes de imatges
// app.use('/api/images', imageRoutes);

// Ruta para subir una imagen
app.post('/api/images/image', upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'La imagen es requerida.' });
    }

    try {
        const filePath = req.file.path; // Ruta donde se guardó la imagen

        // Convertir la imagen a base64
        const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });

        const jsonBody = {
            model: "llama3.2-vision:latest",
            prompt: "What is in this picture?",
            stream: false,
            images: [base64Image]
        };
       
        // Enviar la solicitud
        const response = await sendToMarIA(jsonBody);

        // Devolver la respuesta al cliente
        res.status(200).send(response);

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error al procesar la imagen.' });
    }
});

// Función para enviar la solicitud a la API
async function sendToMarIA(jsonBody) {
    try {
        const response = await fetch('http://localhost:1111/api/generate', {
            method: 'POST',
            body: JSON.stringify(jsonBody),
        });


        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error al enviar la solicitud:', errorText);
            return { error: errorText };
        }

        const data = await response.json();
        console.log('Respuesta del modelo:', data);
        return data;
    } catch (error) {
        console.error('Error al enviar la solicitud:', error);
        return { error: 'Error al comunicarse con el modelo.' };
    }
}



// Gestió centralitzada d'errors
app.use(errorHandler);

// Port per defecte 3000 si no està definit a les variables d'entorn
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

/**
 * Funció d'inicialització del servidor
 * - Connecta amb la base de dades
 * - Sincronitza els models
 * - Inicia el servidor HTTP
 */
async function startServer() {
    
    try {
        // Verificar connexió amb la base de dades
        await sequelize.authenticate();
        logger.info('Base de dades connectada', {
            host: process.env.MYSQL_HOST,
            database: process.env.MYSQL_DATABASE,
            port: process.env.MYSQL_PORT
        });
        
        // Sincronitzar models amb la base de dades
        await sequelize.sync({
            // No fa res si la taula ja existeix
            force: false,  // Valor per defecte, segur per producció
        
            // Elimina i recrea totes les taules cada vegada (PERILLÓS!)
            // force: true,   // Útil per development/testing, MAI per producció
        
            // Altera taules existents per coincidir amb els models
            // alter: true,   // Modifica estructures sense perdre dades
            // alter: false,  // No modifica estructures existents
        
            // Sincronitza només models específics
            // models: [Model1, Model2],
        
            // Ometre taules específiques
            // omitSync: ['TableName1', 'TableName2'],
        
            // No crear taules si ja existeixin
            // hooks: false,
        
            // Mode transaccional
            // transaction: transaction,
        
            // Validar camps durant la sincronització
            // validate: true,
        
            // Opcions avançades per dialectes específics
            // dialectOptions: {}
        });

        logger.info('Models sincronitzats', {
            force: true,
            timestamp: new Date().toISOString()
        });
        
        // Iniciar el servidor HTTP
        app.listen(PORT, HOST, () => {
            logger.info('Servidor iniciat correctament', {
                port: PORT,
                mode: process.env.NODE_ENV,
                docs: `http://${HOST}:${PORT}/api-docs`
            });
        });
    } catch (error) {
        logger.error('Error fatal en iniciar el servidor', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        process.exit(1);
    }
}

/**
 * Gestió d'errors no controlats
 * Registra l'error i tanca l'aplicació de forma segura
 */
process.on('unhandledRejection', (error) => {
    logger.error('Error no controlat detectat', {
        error: error.message,
        stack: error.stack,
        type: 'UnhandledRejection',
        timestamp: new Date().toISOString()
    });
    process.exit(1);
});

// Gestió del senyal SIGTERM per tancament graciós
process.on('SIGTERM', () => {
    logger.info('Senyal SIGTERM rebut. Tancant el servidor...');
    process.exit(0);
});

// Iniciar el servidor
startServer();

// Exportar l'app per tests
module.exports = app;



// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const port = 3000;
// const host = '0.0.0.0';

// const app = express();

// // Configuración de almacenamiento para multer
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadPath = path.join(__dirname, 'uploads');
//         if (!fs.existsSync(uploadPath)) {
//             fs.mkdirSync(uploadPath, { recursive: true });
//         }
//         cb(null, uploadPath);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//         cb(null, uniqueSuffix + '-' + file.originalname);
//     }
// });

// const upload = multer({ storage });

// // Ruta para subir una imagen
// app.post('/image', upload.single('image'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).send({ error: 'La imagen es requerida.' });
//     }

//     try {
//         const filePath = req.file.path; // Ruta donde se guardó la imagen

//         // Convertir la imagen a base64
//         const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });

//         const jsonBody = {
//             model: "llama3.2-vision:latest",
//             prompt: "What is in this picture?",
//             stream: false,
//             images: [base64Image]
//         };
       
//         // Enviar la solicitud
//         const response = await sendToMarIA(jsonBody);

//         // Devolver la respuesta al cliente
//         res.status(200).send(response);

//     } catch (err) {
//         console.error(err);
//         res.status(500).send({ error: 'Error al procesar la imagen.' });
//     }
// });

// // Función para enviar la solicitud a la API
// async function sendToMarIA(jsonBody) {
//     try {
//         const response = await fetch('http://localhost:1111/api/generate', {
//             method: 'POST',
//             body: JSON.stringify(jsonBody),
//         });


//         if (!response.ok) {
//             const errorText = await response.text();
//             console.error('Error al enviar la solicitud:', errorText);
//             return { error: errorText };
//         }

//         const data = await response.json();
//         console.log('Respuesta del modelo:', data);
//         return data;
//     } catch (error) {
//         console.error('Error al enviar la solicitud:', error);
//         return { error: 'Error al comunicarse con el modelo.' };
//     }
// }

// // Iniciar el servidor
// app.listen(port, () => {
//     console.log(`Servidor corriendo en http://localhost:${port}`);
// });
