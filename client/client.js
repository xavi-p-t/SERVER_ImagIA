const fs = require('fs');
const path = require('path');


class ImageUploader {
    constructor(serverUrl) {
        this.serverUrl = serverUrl; // URL del servidor donde se subirá la imagen
    }

    /**
     * Lee un archivo del sistema de archivos local.
     * @param {string} filePath - Ruta del archivo.
     * @returns {Buffer} - Buffer del archivo leído.
     */
    readFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`El archivo no existe: ${filePath}`);
        }
        return fs.readFileSync(filePath);
    }

    /**
     * Crea un FormData con el archivo.
     * @param {Buffer} fileBuffer - Buffer del archivo.
     * @param {string} fileName - Nombre del archivo.
     * @returns {FormData} - FormData con el archivo adjunto.
     */
    createFormData(fileBuffer, fileName) {
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' }); // Cambia el tipo según sea necesario
        formData.append('image', blob, fileName);
        return formData;
    }

    /**
     * Envía la imagen al servidor.
     * @param {string} filePath - Ruta del archivo a enviar.
     * @returns {Promise<Object>} - Respuesta del servidor.
     */
    async uploadImage(filePath) {
        try {
            const fileBuffer = this.readFile(filePath);
            const fileName = path.basename(filePath);
            const formData = this.createFormData(fileBuffer, fileName);

            const response = await fetch(this.serverUrl, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error del servidor: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error al subir la imagen:', error.message);
            throw error;
        }
    }
}

// Ejemplo de uso:
(async () => {
    const uploader = new ImageUploader('http://localhost:3000/api/images/image');
    try {
        const response = await uploader.uploadImage('./cat.png');
        console.log('Respuesta del servidor:', response);
    } catch (error) {
        console.error('Error durante la prueba:', error.message);
    }
})();
