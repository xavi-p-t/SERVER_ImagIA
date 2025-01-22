async function sendImage() {
    const filePath = './cat.png'; // Ruta del archivo en el sistema del cliente

    try {
        // Lee el archivo usando el módulo fs (Node.js)
        const fs = require('fs');
        const path = require('path');

        const fileName = path.basename(filePath); // Extrae el nombre del archivo
        const fileBuffer = fs.readFileSync(filePath); // Lee el archivo como un buffer

        // Crea un FormData manualmente
        const formData = new FormData();
        const blob = new Blob([fileBuffer], { type: 'image/png' }); // Convierte el buffer a Blob
        formData.append('image', blob, fileName);

        // Realiza la solicitud
        const result = await fetch('http://localhost:3000/image', {
            method: 'POST',
            body: formData,
        });

        if (!result.ok) {
            console.error('Error al subir la imagen:', await result.text());
            return;
        }

        const data = await result.json();
        console.log('Imagen subida con éxito:', data);
    } catch (error) {
        console.error('Error al enviar la imagen:', error);
    }
}

sendImage();
