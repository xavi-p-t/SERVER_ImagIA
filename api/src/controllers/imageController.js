const fs = require('fs');
const Peticions = require('../models/Peticions');


// Carregar variables d'entorn
const dotenv = require('dotenv');
dotenv.config();

const CHAT_API_OLLAMA_URL = process.env.CHAT_API_OLLAMA_URL;
// Controlador para manejar la subida de imágenes
const uploadImage = async (req, res) => {
    console.log('Archivos recibidos:', req.file); // Verificar si el archivo está presente
    
    if (!req.file) {
        return res.status(400).send({ error: 'La imagen es requerida.' });
    }

    try {
        const filePath = req.file.path; // Ruta donde se guardó la imagen

        
        // Convertir la imagen a base64
        const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });

        const jsonBody = {
            model: "llama3.2-vision:latest",
            prompt: "Que hay en esta foto, responde brevemente?",
            stream: false,
            images: [base64Image]
        };

        //console.log(jsonBody);

        // Enviar la solicitud a la API del modelo
        const response = await sendToMarIA(jsonBody);

        // Usuario fijo para pruebas (puedes cambiarlo según tu lógica)
        const usuarid = '00000000-0000-0000-0000-000000000000';
        
        // Guardar los datos en la tabla Peticions
        const peticio = await Peticions.create({
            prompt: jsonBody.prompt,
            imatges: JSON.stringify([filePath]), // Guardar la ruta del archivo como JSON
            model: jsonBody.model,
            response: response.text || null,
            usuarid // Asociar la petición al usuario
        });

        console.log(peticio);

        // Devolver la respuesta al cliente
        res.status(200).send(response);

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error al procesar la imagen.' });
    }
};

// Función para enviar la solicitud a la API del modelo
const sendToMarIA = async (jsonBody) => {
    try {
        const response = await fetch('http://192.168.1.14:11434/api/generate', {
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
};

module.exports = {
    uploadImage
};

