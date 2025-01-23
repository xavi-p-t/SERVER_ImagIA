const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../../uploads');
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
router.post('/image', upload.single('image'), async (req, res) => {
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

// Función para enviar la solicitud a la API del modelo

// **  FUNCIONA SOLO SI UTILIZO COMANDO SSH PARA REDIRIGIR EL SERVIOR A EL PUERTO LOCAL DE MI API **
async function sendToMarIA(jsonBody) {
    try {
        const response = await fetch('http://localhost:1111/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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

module.exports = router;
