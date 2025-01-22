const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const port = 3000;
const host = '0.0.0.0';

const app = express();

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

// Ruta para subir una imagen
app.post('/image', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ error: 'La imagen es requerida.' });
    }

    try {
        const filePath = req.file.path; // Ruta donde se guardó la imagen
        res.status(200).send({ message: 'Imagen subida con éxito.', filePath });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error al guardar la imagen.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});


// // Activar el servidor
// const httpServer = app.listen(port, host, () => {
//     console.log(`Servidor escuchando en: http://${host}:${port}`);
// });

// Aturar el servidor correctament
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
    console.log('Recibida señal de cierre, apagando servidor.');
    httpServer.close(() => {
        console.log('Servidor cerrado.');
        process.exit(0);
    });
}
